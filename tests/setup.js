const fs = require('fs');
const path = require('path');

// Set up all globals needed by the source files
global.APP_CONFIG = {
  appName: 'TelOS',
  appSubtitle: 'Goal Operating System',
  storageKey: 'telos_test_data',
  userName: 'Test',
  userInitials: 'T',
  userTagline: 'Testing things',
  supabaseUrl: '',
  supabaseKey: ''
};

global.appState = {
  logs: {},
  weeklyReviews: {},
  monthlyReviews: {},
  identityStatement: { title: "Who I Am Becoming", description: "" },
  dangerAreas: [],
  rules: [],
  goals: {
    northStar: [],
    yearly: [],
    sixMonth: [],
    threeMonth: [],
    oneMonth: [],
    linkedHabits: []
  },
  settings: {
    scheduleBlocks: [],
    supabaseUrl: "",
    supabaseKey: "",
    syncEnabled: false,
    upcomingHidden: false,
    goalsCountdownCollapsed: false
  }
};

global.document = { getElementById: () => null };
global.window = { location: { hash: '' } };
global.navigator = { onLine: true };
global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; }
};
global.supabase = {
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => ({}),
          limit: () => ({})
        })
      }),
      upsert: () => Promise.resolve({})
    })
  })
};
global.lucide = { createIcons: () => {} };

function loadGlobalScript(filePath) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');
  (0, eval)(code);
}

// Load source files in dependency order
loadGlobalScript('js/constants.js');
loadGlobalScript('js/utils.js');
