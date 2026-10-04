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
  for (const file of ['mockData.js', 'js/config.js', 'js/state.js', 'js/utils.js', 'js/ai-goal-prompt.js', 'js/ai-goals.js', 'js/tabs/system.js', 'js/desktop.js']) {
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
  run(`syncMeta.dirty = false; appState.settings.supabaseUrl = 'local-url'; appState.settings.supabaseKey = 'local-key'; appState.settings.syncEnabled = true;
    dbClient = { from() { return { select() { return { eq() { return { maybeSingle: async () => ({data: {data: remote}}) }; } }; }, upsert: async () => ({}) }; } };`);
  await run('pullFromCloud()');
  assert.equal(state().settings.scheduleBlocks[0].time, '1:00 PM');
  assert.equal(state().settings.supabaseKey, 'local-key');
});


test('ISO week boundaries and date-only arithmetic are correct across timezones', () => {
  const { ctx, run } = setup();
  for (const [date, week, start] of [['2026-10-04','2026-W40','2026-09-28'],['2026-01-01','2026-W01','2025-12-29'],['2021-01-01','2020-W53','2020-12-28']]) {
    ctx.date = date; ctx.week = week;
    assert.equal(run('getWeekID(date)'), week);
    assert.equal(run('getWeekStartDate(week)'), start);
    assert.ok(JSON.parse(run('JSON.stringify(getWeekDates(date))')).includes(date));
  }
  assert.equal(run('getYesterdayDateString("2026-03-01")'), '2026-02-28');
});

test('pillar deletion unlinks dependents consistently without deleting historical data', () => {
  const { ctx, run, state } = setup(); ctx.plan = plan();
  run('applyGeneratedGoalCascade(plan)');
  vm.runInContext(fs.readFileSync(path.join(root,'js/tabs/blueprint.js'),'utf8'), ctx);
  ctx.confirm = () => true;
  run('renderGoalsHub = () => {}; appState.logs["2026-10-01"] = { lunch_walk: { completed: true } }; deleteNorthStar(0)');
  assert.equal(state().goals.linkedHabits.length, 0);
  assert.equal(state().goals.oneMonth[0].northStarId, '');
  assert.equal(run('getLinkedBlocks().length'), 0);
  assert.equal(state().logs['2026-10-01'].lunch_walk.completed, true);
});

test('malformed backup does not replace or persist existing state', async () => {
  const { ctx, run, state, storage } = setup(); const before = state();
  ctx.file = { text: JSON.stringify({logs:{},goals:{},settings:{}}) };
  run('importDataJSON({target:{files:[file]}})'); await ctx.pending;
  assert.deepEqual(state(), before);
  assert.deepEqual(JSON.parse(storage.get('telos_data')), before);
});

test('numeric quick completion opens an editor without fabricating a value', () => {
  const { ctx, run, state } = setup(); ctx.plan = plan(); run('applyGeneratedGoalCascade(plan)');
  vm.runInContext(fs.readFileSync(path.join(root,'js/tabs/execution.js'),'utf8'),ctx);
  ctx.opened = null; ctx.capture = (date,id) => { ctx.opened = {date,id}; };
  run('openHabitLog = capture; toggleBlockQuickCompletion("2026-10-01", "practice", true)');
  assert.equal(ctx.opened.id, 'practice'); assert.deepEqual(state().logs, {});
});

test('monthly metrics use actual days; historical edit transfers selected date', () => {
  const { ctx, run, elements } = setup();
  vm.runInContext(fs.readFileSync(path.join(root,'js/tabs/progress.js'),'utf8'),ctx);
  run('let reviewMode="monthly", reviewYear=2026, reviewMonth=9, reviewWeekId="2026-W40", selectedReviewDate="", trackerDate="";');
  assert.equal(run('getPeriodDates().length'),31);
  ctx.switchTab = tab => { ctx.switched = tab; };
  run('editExecutionDate("2026-10-01")'); assert.equal(run('trackerDate'),'2026-10-01'); assert.equal(ctx.switched,'today');
});

function fakeCloud(remote = null) {
  const cloud = { remote, writes: 0, reads: 0, error: null, beforeRead: null, beforeWrite: null };
  cloud.client = { from() {
    let payload, filters = [];
    return {
      select() {
        if (!payload) return this;
        return (async () => {
          if (cloud.beforeWrite) await cloud.beforeWrite();
          if (cloud.error) return {error:cloud.error};
          if (filters.some(([key,value]) => cloud.remote?.[key] !== value)) return {data:[]};
          cloud.remote = structuredClone(payload); cloud.writes++;
          return {data:[{updated_at:payload.updated_at}]};
        })();
      },
      eq(key,value) { filters.push([key,value]); return this; },
      async maybeSingle() { cloud.reads++; const copy=structuredClone(cloud.remote); if(cloud.beforeRead) await cloud.beforeRead(); return {data:copy,error:cloud.error}; },
      update(value) { payload=value; return this; },
      async insert(value) { if(cloud.beforeWrite) await cloud.beforeWrite(); if(cloud.error)return{error:cloud.error}; if(cloud.remote)return{error:{code:'23505',message:'Already exists'}}; cloud.remote=structuredClone(value); cloud.writes++; return{}; }
    };
  } };
  return cloud;
}
function connect(ctx,run,cloud,base=null) {
  ctx.client=cloud.client; ctx.base=base;
  run('dbClient=client; appState.settings.supabaseUrl="url"; appState.settings.supabaseKey="key"; appState.settings.syncEnabled=true; syncMeta={dirty:true,base};');
}

test('cloud API errors propagate and never clear dirty local changes', async () => {
  const {ctx,run}=setup(); const cloud=fakeCloud(); cloud.error={message:'Permission denied'}; connect(ctx,run,cloud);
  await assert.rejects(run('pushToCloud()'), /Permission denied/);
  assert.equal(run('syncMeta.dirty'),true); assert.equal(cloud.writes,0);
});

test('changed remote revision raises conflict instead of overwriting cloud', async () => {
  const {ctx,run,state}=setup(); const cloud=fakeCloud({id:'life_os_data',updated_at:'2026-10-04T00:00:00Z',data:state()});
  connect(ctx,run,cloud,'2026-10-03T00:00:00Z');
  await assert.rejects(run('pushToCloud()'), /Both this device/);
  assert.equal(cloud.writes,0); assert.equal(run('syncMeta.dirty'),true);
});

test('successful writes strip credentials and accept equivalent timestamp formats', async () => {
  const {ctx,run,state}=setup(); const cloud=fakeCloud({id:'life_os_data',updated_at:'2026-10-04T00:00:00+00:00',data:state()});
  connect(ctx,run,cloud,'2026-10-04T00:00:00.000Z');
  await run('pushToCloud()'); assert.equal(cloud.writes,1); assert.equal(run('syncMeta.dirty'),false);
  assert.equal(cloud.remote.data.settings.supabaseKey,undefined);
});

test('pull does not echo remote data back or replace edits made during a request', async () => {
  const {ctx,run,state}=setup(); const cloud=fakeCloud({id:'life_os_data',updated_at:'2026-10-04T00:00:00Z',data:state()});
  connect(ctx,run,cloud); run('syncMeta.dirty=false');
  await run('pullFromCloud()'); assert.equal(cloud.writes,0);
  let release; const gate=new Promise(r=>release=r); cloud.beforeRead=()=>gate;
  cloud.remote.updated_at='2026-10-04T01:00:00Z';
  const pulling=run('pullFromCloud()');
  run('appState.identityStatement.description="New local edit"; stateRevision++; syncMeta.dirty=true');
  release(); await pulling;
  assert.equal(state().identityStatement.description,'New local edit'); assert.equal(cloud.writes,0);
});

test('serialized writes flush edits arriving while a request is in flight', async () => {
  const {ctx,run}=setup(); const cloud=fakeCloud(); connect(ctx,run,cloud);
  let release, signal; const gate=new Promise(r=>release=r); const started=new Promise(r=>signal=r); let first=true;
  cloud.beforeWrite=async()=>{if(first){first=false;signal();await gate;}};
  const writing=run('pushToCloud()'); await started;
  run('appState.identityStatement.description="Latest edit"; stateRevision++; syncMeta.dirty=true');
  release(); await writing;
  assert.equal(cloud.remote.data.identityStatement.description,'Latest edit'); assert.equal(run('syncMeta.dirty'),false); assert.equal(cloud.writes,2);
});
