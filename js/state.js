// ============================================================
//  📦 Life OS — State & Data Layer
//  ============================================================
//  Handles localStorage persistence and optional Supabase cloud sync.
//  The global `appState` object is the single source of truth.
// ============================================================

let appState = {
  logs: {},
  weeklyReviews: {},
  monthlyReviews: {},
  identityStatement: { title: "Who I Am Becoming", description: "" },
  dangerAreas: [],
  rules: [],
  goals: { northStar: [], yearly: [], sixMonth: [], threeMonth: [], oneMonth: [], linkedHabits: [] },
  settings: {
    scheduleBlocks: [],
    supabaseUrl: "",
    supabaseKey: "",
    syncEnabled: false,
    upcomingHidden: false,
    goalsCountdownCollapsed: false
  }
};

let dbClient = null;

function loadLocalData() {
  const localData = localStorage.getItem(APP_CONFIG.storageKey);
  if (localData) {
    try {
      appState = JSON.parse(localData);
      if (!appState.settings) appState.settings = initialMockData.settings;
      if (!appState.goals) appState.goals = initialMockData.goals;
      if (!appState.identityStatement) appState.identityStatement = { title: "Who I Am Becoming", description: "" };
      if (!Array.isArray(appState.dangerAreas)) appState.dangerAreas = [];
      if (!Array.isArray(appState.rules)) appState.rules = [];
      if (!appState.goals.northStar) appState.goals.northStar = initialMockData.goals.northStar;
      if (!appState.goals.sixMonth) appState.goals.sixMonth = [];
      if (!appState.goals.threeMonth) {
        appState.goals.threeMonth = appState.goals.ninetyDay || [];
      }
      delete appState.goals.ninetyDay;
      if (!appState.goals.oneMonth) appState.goals.oneMonth = [];
      if (!appState.goals.linkedHabits) appState.goals.linkedHabits = [];
      if (!appState.monthlyReviews) appState.monthlyReviews = {};
      ["yearly", "sixMonth", "threeMonth", "oneMonth"].forEach(level => {
        (appState.goals[level] || []).forEach(goal => {
          if (goal.completed === undefined) goal.completed = false;
        });
      });
    } catch (e) {
      appState = JSON.parse(JSON.stringify(initialMockData));
    }
  } else {
    appState = JSON.parse(JSON.stringify(initialMockData));
    persistState();
  }
}

function persistState() {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(appState));
  if (dbClient && appState.settings.supabaseUrl && appState.settings.supabaseKey) {
    pushToCloud();
  }
}

function initSupabase() {
  const url = APP_CONFIG.supabaseUrl || appState.settings.supabaseUrl;
  const key = APP_CONFIG.supabaseAnonKey || appState.settings.supabaseKey;
  if (url && key) {
    try {
      dbClient = supabase.createClient(url, key);
      appState.settings.syncEnabled = true;
      updateSyncStatusBadge(true);
      pullFromCloud();
    } catch (e) {
      updateSyncStatusBadge(false, "Connection error");
    }
  } else {
    updateSyncStatusBadge(false);
  }
}

function updateSyncStatusBadge(connected, msg) {
  const badge = document.getElementById("sync-status-badge");
  const discBtn = document.getElementById("settings-supabase-disconnect");
  if (!badge) return;
  if (connected) {
    badge.className = "text-[9px] bg-green/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-green border border-green/20";
    badge.textContent = "Cloud Connected";
    if (discBtn) discBtn.classList.remove("hidden");
  } else {
    badge.className = "text-[9px] bg-border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-text-dim";
    badge.textContent = msg ? `Local (${msg})` : "Local Mode";
    if (discBtn) discBtn.classList.add("hidden");
  }
}

async function pushToCloud() {
  if (!dbClient || !appState.settings.syncEnabled) return;
  try {
    await dbClient.from('life_os_sync').upsert({
      id: 'life_os_data', data: appState,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) { console.error("Cloud push failed", e); }
}

async function pullFromCloud() {
  if (!dbClient || !appState.settings.syncEnabled) return;
  try {
    const { data } = await dbClient.from('life_os_sync').select('data').eq('id', 'life_os_data').maybeSingle();
    if (data && data.data && data.data.logs && data.data.goals) {
      appState = data.data;
      persistState();
      renderAll();
    }
  } catch (e) { console.error("Cloud pull failed", e); }
}
