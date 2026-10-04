const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function setup() {
  const elements = new Map();
  const storage = new Map();
  const ctx = vm.createContext({ console, Date, Set, JSON, Math, setTimeout: () => {},
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: { getElementById: id => {
      if (!elements.has(id)) elements.set(id, { style: {}, classList: { add() {}, remove() {} } });
      return elements.get(id);
    } },
    FileReader: class { readAsText(file) { this.pending = this.onload({ target: { result: file.text } }); ctx.pending = this.pending; } },
    lucide: { createIcons() {} }, renderAll() {}, celebrate() {} });
  for (const file of ['mockData.js', 'js/config.js', 'js/state.js', 'js/utils.js', 'js/ai-goal-prompt.js', 'js/ai-goals.js', 'js/tabs/system.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
  }
  vm.runInContext('loadLocalData()', ctx);
  const run = code => vm.runInContext(code, ctx);
  const state = () => JSON.parse(run('JSON.stringify(appState)'));
  return { ctx, run, state, storage, elements };
}
function plan() {
  return { northStar: [{ id: 'ns_health', title: 'Health' }],
    sixMonth: [{ id: 'g_six', name: 'Six month outcome', northStarId: 'ns_health' }],
    threeMonth: [{ id: 'g_three', name: 'Three month outcome', northStarId: 'ns_health' }],
    oneMonth: [{ id: 'g_one', name: 'One month outcome', northStarId: 'ns_health' }],
    dailyHabits: [{ id: 'lunch_walk', name: 'Lunch walk', time: '12:30 PM' },
      { id: 'practice', name: 'Evening practice', time: '7:00 PM', fields: [{ id: 'minutes', type: 'number' }] }],
    linkedHabits: [{ habitId: 'lunch_walk', northStarId: 'ns_health' }, { habitId: 'practice', northStarId: 'ns_health' }] };
}
test('complete plan replaces defaults, persists custom times, and feeds completion metrics', () => {
  const { ctx, run, state, storage } = setup(); ctx.plan = plan();
  run('appState.logs = { "2026-10-01": { lunch_walk: { completed: true } } }; applyGeneratedGoalCascade(plan)');
  assert.deepEqual(state().settings.scheduleBlocks.map(b => b.id), ['lunch_walk', 'practice']);
  assert.equal(state().settings.scheduleBlocks[0].time, '12:30 PM');
  assert.equal(state().settings.scheduleBlocks[0].fields[0].id, 'completed');
  assert.equal(run('getLinkedBlocks().length'), 2);
  assert.equal(run('getLoggedCompletionRate("2026-10-01")'), 0.5);
  assert.equal(state().logs['2026-10-01'].lunch_walk.completed, true);
  assert.deepEqual(JSON.parse(storage.get('telos_data')), state());
  run('loadLocalData()');
  assert.equal(state().settings.scheduleBlocks[0].time, '12:30 PM');
});
test('invalid definitions and links fail without changing saved state', () => {
  const { ctx, run, state } = setup(); const before = state();
  const cases = [
    [p => delete p.dailyHabits, /missing dailyHabits/],
    [p => p.linkedHabits[0].habitId = 'missing', /unknown daily habit/],
    [p => p.oneMonth[0].northStarId = 'missing', /unknown North Star/],
    [p => p.dailyHabits[1].id = 'lunch_walk', /duplicate ID/],
    [p => p.linkedHabits.pop(), /needs a linkedHabits entry/],
    [p => p.dailyHabits[0].fields = [{ id: 'notes', type: 'text' }], /checkbox or number/],
    [p => p.dailyHabits[0].id = '__proto__', /valid ID/]
  ];
  for (const [edit, error] of cases) {
    ctx.plan = plan(); edit(ctx.plan);
    assert.throws(() => run('applyGeneratedGoalCascade(plan)'), error);
    assert.deepEqual(state(), before);
  }
});
test('empty habits clear previous schedule; scheduleBlocks alias is accepted', () => {
  const { ctx, run, state } = setup(); ctx.plan = plan();
  ctx.plan.scheduleBlocks = ctx.plan.dailyHabits; delete ctx.plan.dailyHabits;
  run('applyGeneratedGoalCascade(plan)'); assert.equal(state().settings.scheduleBlocks.length, 2);
  ctx.plan = plan(); ctx.plan.dailyHabits = []; ctx.plan.linkedHabits = [];
  run('applyGeneratedGoalCascade(plan)'); assert.equal(state().settings.scheduleBlocks.length, 0);
});
test('planner prompt defines personalized habits without restricting IDs to defaults', () => {
  const { run } = setup(); const prompt = run('getAIGoalImportPrompt()');
  assert.ok(prompt.includes('"dailyHabits"'));
  assert.ok(!prompt.includes('{{HABIT_IDS}}'));
  assert.ok(!prompt.includes('Use only these habit ids'));
});
test('JSON file input accepts complete plans as well as backups', async () => {
  const { ctx, run, state } = setup(); ctx.file = { text: JSON.stringify(plan()) };
  run('importDataJSON({target: {files: [file]}})'); await ctx.pending;
  assert.equal(state().settings.scheduleBlocks[0].time, '12:30 PM');
  ctx.file = { text: JSON.stringify(state()) };
  run('importDataJSON({target: {files: [file]}})'); await ctx.pending;
  assert.equal(state().settings.scheduleBlocks[0].time, '12:30 PM');
});
test('cloud pull uses remote habit schedule while preserving local credentials', async () => {
  const { ctx, run, state } = setup(); ctx.plan = plan();
  run('applyGeneratedGoalCascade(plan)'); const remote = state();
  remote.settings.scheduleBlocks[0].time = '1:00 PM';
  delete remote.settings.supabaseUrl; delete remote.settings.supabaseKey;
  ctx.remote = remote;
  run(`appState.settings.supabaseUrl = 'local-url'; appState.settings.supabaseKey = 'local-key'; appState.settings.syncEnabled = true;
    dbClient = { from() { return { select() { return { eq() { return { maybeSingle: async () => ({data: {data: remote}}) }; } }; }, upsert: async () => ({}) }; } };`);
  await run('pullFromCloud()');
  assert.equal(state().settings.scheduleBlocks[0].time, '1:00 PM');
  assert.equal(state().settings.supabaseKey, 'local-key');
});
