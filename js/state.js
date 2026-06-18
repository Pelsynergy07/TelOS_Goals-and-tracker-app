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

async function initSupabase() {
  const url = APP_CONFIG.supabaseUrl || appState.settings.supabaseUrl;
  const key = APP_CONFIG.supabaseKey || appState.settings.supabaseKey;
  if (url && key) {
    try {
      dbClient = supabase.createClient(url, key);
      appState.settings.supabaseUrl = appState.settings.supabaseUrl || APP_CONFIG.supabaseUrl;
      appState.settings.supabaseKey = appState.settings.supabaseKey || APP_CONFIG.supabaseKey;
      appState.settings.syncEnabled = true;
      updateSyncStatusBadge(true);
      await pullFromCloud();
    } catch (e) {
      updateSyncStatusBadge(false, "Connection error");
    }
  } else {
    dbClient = null;
    appState.settings.supabaseUrl = "";
    appState.settings.supabaseKey = "";
    appState.settings.syncEnabled = false;
    updateSyncStatusBadge(false);
  }
}

function updateSyncStatusBadge(connected, msg) {
  const badge = document.getElementById("sync-status-badge");
  const discBtn = document.getElementById("settings-supabase-disconnect");
  const connectBtn = document.getElementById("settings-connect-btn");
  const syncBtn = document.getElementById("settings-sync-btn");
  if (!badge) return;
  if (msg === "Offline") {
    badge.className = "text-[9px] bg-amber/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-amber border border-amber/20";
    badge.textContent = "Cloud (Offline)";
    if (discBtn) discBtn.classList.remove("hidden");
    if (connectBtn) connectBtn.classList.add("hidden");
    if (syncBtn) syncBtn.classList.add("hidden");
  } else if (connected) {
    badge.className = "text-[9px] bg-green/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-green border border-green/20";
    badge.textContent = "Cloud Connected";
    if (discBtn) discBtn.classList.remove("hidden");
    if (connectBtn) connectBtn.classList.add("hidden");
    if (syncBtn) { syncBtn.classList.remove("hidden"); lucide.createIcons(); }
  } else {
    badge.className = "text-[9px] bg-border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-text-dim";
    badge.textContent = msg ? `Local (${msg})` : "Local Mode";
    if (discBtn) discBtn.classList.add("hidden");
    if (connectBtn) connectBtn.classList.remove("hidden");
    if (syncBtn) syncBtn.classList.add("hidden");
  }
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    pullFromCloud();
  }, 10000);

  window.addEventListener('online', async () => {
    const url = APP_CONFIG.supabaseUrl || appState.settings.supabaseUrl;
    const key = APP_CONFIG.supabaseKey || appState.settings.supabaseKey;
    if (!url || !key) return;
    if (!dbClient) {
      try {
        dbClient = supabase.createClient(url, key);
        appState.settings.syncEnabled = true;
      } catch (e) { return; }
    }
    await pushToCloud();
    await pullFromCloud();
    updateSyncStatusBadge(true);
    renderAll();
  });

  window.addEventListener('offline', () => {
    if (!dbClient) return;
    const url = APP_CONFIG.supabaseUrl || appState.settings.supabaseUrl;
    const key = APP_CONFIG.supabaseKey || appState.settings.supabaseKey;
    if (url && key) {
      updateSyncStatusBadge(false, "Offline");
    }
  });
}

async function syncNow() {
  const syncBtn = document.getElementById("settings-sync-btn");
  const msgEl = document.getElementById("supabase-msg");
  if (syncBtn) { syncBtn.disabled = true; syncBtn.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Syncing...'; }
  if (msgEl) { msgEl.className = "text-xs font-semibold text-blue"; msgEl.textContent = "Pushing local data..."; }
  await pushToCloud();
  if (msgEl) { msgEl.className = "text-xs font-semibold text-blue"; msgEl.textContent = "Pulling cloud data..."; }
  await pullFromCloud();
  if (msgEl) { msgEl.className = "text-xs font-semibold text-green"; msgEl.textContent = "Synced!"; }
  if (syncBtn) { syncBtn.disabled = false; syncBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sync Now'; lucide.createIcons(); }
  setTimeout(() => { if (msgEl) msgEl.textContent = ""; }, 3000);
}

async function pushToCloud() {
  if (!dbClient || !appState.settings.syncEnabled) return;
  try {
    const clean = JSON.parse(JSON.stringify(appState));
    clean.settings = { ...clean.settings };
    delete clean.settings.supabaseUrl;
    delete clean.settings.supabaseKey;
    delete clean.settings.syncEnabled;
    await dbClient.from('life_os_sync').upsert({
      id: 'life_os_data', data: clean,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) { console.error("Cloud push failed", e); }
}

async function pullFromCloud() {
  if (!dbClient || !appState.settings.syncEnabled) return;
  try {
    const { data } = await dbClient.from('life_os_sync').select('data').eq('id', 'life_os_data').maybeSingle();
    if (data && data.data && data.data.logs && data.data.goals) {
      const localSettings = appState.settings;
      appState = data.data;
      appState.settings = { ...appState.settings, ...localSettings };
      persistState();
      renderAll();
    }
  } catch (e) { console.error("Cloud pull failed", e); }
}
