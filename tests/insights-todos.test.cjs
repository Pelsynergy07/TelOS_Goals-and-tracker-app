const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function setup(today = '2026-10-20') {
  const storage = new Map();
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [`${today}T12:00:00`])); }
    static now() { return new RealDate(`${today}T12:00:00`).getTime(); }
  }
  const ctx = vm.createContext({ console, Date: FixedDate, Set, Map, JSON, Math, setTimeout: () => {},
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: { getElementById: () => null },
    lucide: { createIcons() {} }, renderAll() {}, renderTodos() {}, playTapSound() {} });
  for (const file of ['mockData.js', 'js/config.js', 'js/state.js', 'js/utils.js', 'js/insights.js', 'js/tabs/todos.js', 'js/ai-goal-prompt.js', 'js/ai-goals.js', 'js/desktop.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
  }
  vm.runInContext('loadLocalData()', ctx);
  // Two linked habits so rates and "weakest habit" are meaningful.
  vm.runInContext(`appState.goals.northStar = [{ id: 'ns', title: 'Health' }];
    appState.settings.scheduleBlocks = [
      { id: 'walk', name: 'Walk', fields: [{ id: 'completed', type: 'checkbox' }] },
      { id: 'read', name: 'Read', fields: [{ id: 'completed', type: 'checkbox' }] }];
    appState.goals.linkedHabits = [{ habitId: 'walk', northStarId: 'ns' }, { habitId: 'read', northStarId: 'ns' }];`, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { run, storage };
}
const days = (end, n) => Array.from({ length: n }, (_, i) => {
  const d = new Date(end + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (n - 1 - i)); return d.toISOString().slice(0, 10);
});

test('to-dos are saved per day, toggled, and refused for future dates', () => {
  const { run, storage } = setup();
  assert.equal(run(`addTodo('2026-10-20', '  Buy milk  ')`), true);
  assert.equal(run(`addTodo('2026-10-21', 'Tomorrow')`), false);
  assert.equal(run(`addTodo('2026-10-20', '   ')`), false);
  run(`toggleTodo('2026-10-20', getTodos('2026-10-20')[0].id)`);
  const saved = JSON.parse(storage.get('telos_data'));
  assert.equal(saved.todos['2026-10-20'][0].text, 'Buy milk');
  assert.equal(saved.todos['2026-10-20'][0].done, true);
  assert.equal(saved.todos['2026-10-21'], undefined);
});

test('carry-over moves only the latest day\'s open tasks and stops nagging after', () => {
  const { run } = setup();
  run(`appState.todos = {
    '2026-10-16': [{ id: 'a', text: 'Old', done: false }],
    '2026-10-19': [{ id: 'b', text: 'Open', done: false }, { id: 'c', text: 'Done', done: true }] }`);
  assert.equal(run(`getCarryOverSource('2026-10-20').date`), '2026-10-19');
  run(`carryOverTodos('2026-10-20')`);
  assert.deepEqual(JSON.parse(run(`JSON.stringify(getTodos('2026-10-20').map(t => [t.text, t.carriedFrom]))`)), [['Open', '2026-10-19']]);
  assert.equal(run(`getTodos('2026-10-19')[0].movedTo`), '2026-10-20');
  assert.equal(run(`getCarryOverSource('2026-10-20')`), null);
  // Moved tasks are counted only on the day they landed.
  assert.equal(run(`getPeriodStats(['2026-10-19','2026-10-20']).todosTotal`), 2);
});

test('period stats ignore days before tracking started', () => {
  const { run } = setup();
  run(`appState.logs = { '2026-10-19': { walk: { completed: true } }, '2026-10-20': { walk: { completed: true }, read: { completed: true } } }`);
  const dates = run(`JSON.stringify(getCountableDates(getWeekDates('2026-10-20')))`);
  assert.deepEqual(JSON.parse(dates), ['2026-10-19', '2026-10-20']);
  const stats = JSON.parse(run(`JSON.stringify(getPeriodStats(${dates}))`));
  assert.equal(stats.overall, 75);
  assert.equal(stats.perfect, 1);
});

test('insights flag the weakest habit, declines, and skip trends on tiny samples', () => {
  const { run } = setup();
  const prev = days('2026-10-11', 7), cur = days('2026-10-18', 7);
  const logs = {};
  prev.forEach(d => { logs[d] = { walk: { completed: true }, read: { completed: true } }; });
  cur.forEach((d, i) => { logs[d] = { walk: { completed: true }, read: { completed: i < 2 } }; });
  run(`appState.logs = ${JSON.stringify(logs)}`);
  const result = JSON.parse(run(`JSON.stringify(buildInsights({ current: getPeriodStats(${JSON.stringify(cur)}), previous: getPeriodStats(${JSON.stringify(prev)}), unit: 'week', patternDates: [], todayStr: '2026-10-20' }))`));
  const focus = result.focus.map(f => f.text).join(' | ');
  assert.match(focus, /Read is your weakest habit at 29%/);
  assert.doesNotMatch(focus, /Read slipped/, 'a habit is named once per list');
  assert.match(result.working.map(w => w.text).join(' | '), /Walk is locked in at 100%/);

  const short = JSON.parse(run(`JSON.stringify(buildInsights({ current: getPeriodStats(${JSON.stringify(cur.slice(-2))}), previous: getPeriodStats(${JSON.stringify(prev)}), unit: 'week', patternDates: [], todayStr: '2026-10-20' }))`));
  assert.equal(short.working.some(w => /improved|locked in|Overall/.test(w.text)), false);
});

test('checkpoint pace flags goals behind schedule', () => {
  const { run } = setup();
  run(`appState.goals.oneMonth = [{ id: 'g', name: 'Write 10 posts', progress: 2, target: 10, deadline: '2026-10-25', northStarId: 'ns' }]`);
  const [pace] = JSON.parse(run(`JSON.stringify(getCheckpointPace('2026-10-20'))`));
  assert.equal(pace.actual, 20);
  assert.equal(pace.expected, 83);
  assert.equal(pace.daysLeft, 5);
});

test('backups keep to-dos and reject malformed ones', () => {
  const { run } = setup();
  run(`appState.todos = { '2026-10-20': [{ id: 'x', text: 'Keep me', done: true }] }`);
  assert.equal(run(`normalizeBackup(JSON.parse(JSON.stringify(appState))).todos['2026-10-20'][0].text`), 'Keep me');
  assert.throws(() => run(`normalizeBackup({ ...JSON.parse(JSON.stringify(appState)), todos: { '2026-10-20': 'nope' } })`), /todos/);
});
