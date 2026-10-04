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
let syncMeta = { dirty: false, base: null };
try { syncMeta = { ...syncMeta, ...JSON.parse(localStorage.getItem(APP_CONFIG.storageKey + '_sync') || '{}') }; } catch {}
let stateRevision = 0;
let pushJob = null;
let pullJob = null;
let syncError = "";
let syncConflict = false;

function saveSyncMeta() { localStorage.setItem(APP_CONFIG.storageKey + '_sync', JSON.stringify(syncMeta)); }
function markSyncError(error) {
  syncError = error.message || String(error);
  updateSyncStatusBadge(false, syncConflict ? "Conflict" : "Sync failed");
  const msg = document.getElementById("supabase-msg");
  if (msg) { msg.className = "text-sm text-red"; msg.textContent = syncError; }
  const conflict = document.getElementById("sync-conflict-controls");
  if (conflict) conflict.classList.toggle("hidden", !syncConflict);
}


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
    persistState({ sync: false });
  }
}

function persistState({ sync = true } = {}) {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(appState));
  if (!sync) return;
  stateRevision++;
  syncMeta.dirty = true;
  saveSyncMeta();
  if (dbClient && appState.settings.syncEnabled) pushToCloud().catch(markSyncError);
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
      if (syncMeta.dirty) await pushToCloud();
      else await pullFromCloud();
      if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.TelOSStorage) {
        Capacitor.Plugins.TelOSStorage.saveCredentials({ url, key });
      }
    } catch (e) {
      markSyncError(e);
    }
  } else {
    dbClient = null;
    appState.settings.supabaseUrl = "";
    appState.settings.supabaseKey = "";
    appState.settings.syncEnabled = false;
    updateSyncStatusBadge(false);
  }
}

function saveCredentialsToNative(url, key) {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.TelOSStorage) {
    Capacitor.Plugins.TelOSStorage.saveCredentials({ url, key });
  }
}

function clearCredentialsFromNative() {
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.TelOSStorage) {
    Capacitor.Plugins.TelOSStorage.clearCredentials();
  }
}

function updateSyncStatusBadge(connected, msg) {
  const badge = document.getElementById("sync-status-badge");
  const discBtn = document.getElementById("settings-supabase-disconnect");
  const connectBtn = document.getElementById("settings-connect-btn");
  const syncBtn = document.getElementById("settings-sync-btn");
  if (!badge) return;
  if (msg === "Offline") {
    badge.className = "text-caption bg-amber/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-amber border border-amber/20";
    badge.textContent = "Cloud (Offline)";
    if (discBtn) discBtn.classList.remove("hidden");
    if (connectBtn) connectBtn.classList.add("hidden");
    if (syncBtn) syncBtn.classList.add("hidden");
  } else if (connected) {
    badge.className = "text-caption bg-green/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-green border border-green/20";
    badge.textContent = "Cloud Connected";
    if (discBtn) discBtn.classList.remove("hidden");
    if (connectBtn) connectBtn.classList.add("hidden");
    if (syncBtn) { syncBtn.classList.remove("hidden"); lucide.createIcons(); }
  } else {
    badge.className = "text-caption bg-border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-text-dim";
    badge.textContent = msg ? `Local (${msg})` : "Local Mode";
    if (discBtn) discBtn.classList.toggle("hidden", !dbClient);
    if (connectBtn) connectBtn.classList.toggle("hidden", !!dbClient);
    if (syncBtn) syncBtn.classList.toggle("hidden", !dbClient);
  }
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    if (syncMeta.dirty) pushToCloud().catch(markSyncError);
    else pullFromCloud().catch(markSyncError);
  }, 10000);

  window.addEventListener('online', async () => {
    const url = APP_CONFIG.supabaseUrl || appState.settings.supabaseUrl;
    const key = APP_CONFIG.supabaseKey || appState.settings.supabaseKey;
    if (!url || !key) return;
    if (!dbClient) {
      try {
        dbClient = supabase.createClient(url, key);
        appState.settings.syncEnabled = true;
        saveCredentialsToNative(url, key);
      } catch (e) { return; }
    }
    try {
      if (syncMeta.dirty) await pushToCloud();
      await pullFromCloud();
      updateSyncStatusBadge(true);
    } catch (error) { markSyncError(error); }
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
  const button = document.getElementById("settings-sync-btn");
  const msg = document.getElementById("supabase-msg");
  if (button) button.disabled = true;
  if (msg) { msg.className = "text-sm text-blue"; msg.textContent = "Syncing…"; }
  try {
    if (!dbClient) throw new Error("Connect Supabase before syncing.");
    if (syncMeta.dirty) await pushToCloud();
    await pullFromCloud();
    syncError = "";
    updateSyncStatusBadge(true);
    if (msg) { msg.className = "text-sm text-green"; msg.textContent = "Synced successfully."; }
  } catch (error) { markSyncError(error); }
  finally { if (button) button.disabled = false; }
}

function cleanCloudState() {
  const clean = JSON.parse(JSON.stringify(appState));
  delete clean.settings.supabaseUrl;
  delete clean.settings.supabaseKey;
  delete clean.settings.syncEnabled;
  return clean;
}

function conflictError() {
  syncConflict = true;
  return new Error("Both this device and the cloud have changes. Choose which version to keep in System; local changes are still saved.");
}

async function pushToCloud({ force = false } = {}) {
  if (pushJob) return pushJob;
  if (!dbClient || !appState.settings.syncEnabled) return;
  const client = dbClient;
  pushJob = (async () => {
    // Serialize whole-state writes and detect a changed cloud revision before replacing it.
    do {
      const revision = stateRevision;
      const { data: remote, error: readError } = await client.from('life_os_sync').select('updated_at,data').eq('id', 'life_os_data').maybeSingle();
      if (readError) throw new Error(readError.message || "Cloud read failed.");
      if (client !== dbClient) return;
      if (remote?.data?.cloudResetAt && remote.data.cloudResetAt !== appState.cloudResetAt) {
        applyCloudSnapshot(remote); return;
      }
      if (syncConflict && !force) throw conflictError();
      if (remote && !force && (!syncMeta.base || Date.parse(remote.updated_at) !== Date.parse(syncMeta.base))) throw conflictError();
      const updated_at = new Date(Math.max(Date.now(), (Date.parse(remote?.updated_at) || 0) + 1)).toISOString();
      const payload = { id: 'life_os_data', data: cleanCloudState(), updated_at };
      let result;
      if (remote) {
        result = await client.from('life_os_sync').update(payload).eq('id', 'life_os_data').eq('updated_at', remote.updated_at).select('updated_at');
        if (!result.error && !result.data?.length) throw conflictError();
      } else {
        result = await client.from('life_os_sync').insert(payload);
      }
      if (result.error) throw new Error(result.error.message || "Cloud write failed.");
      if (client !== dbClient) return;
      syncMeta.base = result.data?.[0]?.updated_at || updated_at;
      syncMeta.dirty = stateRevision !== revision;
      syncConflict = false;
      syncError = "";
      saveSyncMeta();
      force = false;
    } while (syncMeta.dirty);
    updateSyncStatusBadge(true);
    document.getElementById("sync-conflict-controls")?.classList.add("hidden");
  })();
  try { return await pushJob; }
  finally { pushJob = null; }
}

function applyCloudSnapshot(snapshot) {
  const next = normalizeBackup(snapshot.data);
  const { scheduleBlocks, ...deviceSettings } = appState.settings;
  next.settings = { ...next.settings, ...deviceSettings };
  appState = next;
  stateRevision++;
  syncMeta = { dirty: false, base: snapshot.updated_at || null };
  syncConflict = false; syncError = "";
  saveSyncMeta(); persistState({ sync: false });
  document.getElementById("sync-conflict-controls")?.classList.add("hidden");
  renderAll();
}

async function pullFromCloud({ force = false } = {}) {
  if (pullJob) return pullJob;
  if (!dbClient || !appState.settings.syncEnabled || pushJob || (syncMeta.dirty && !force)) return;
  if (!force && typeof document !== 'undefined') {
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
    if (typeof document.querySelector === 'function' && document.querySelector('[role="dialog"][data-open="true"]')) return;
  }
  const client = dbClient;
  const revision = stateRevision;
  pullJob = (async () => {
    const { data, error } = await client.from('life_os_sync').select('data,updated_at').eq('id', 'life_os_data').maybeSingle();
    if (error) throw new Error(error.message || "Cloud read failed.");
    if (client !== dbClient || revision !== stateRevision || (!force && syncMeta.dirty)) return;
    if (force && !data?.data) throw new Error("No cloud snapshot exists. Local data was kept.");
    if (data?.data) {
      if (!force && data.updated_at && syncMeta.base && Date.parse(data.updated_at) === Date.parse(syncMeta.base)) return;
      applyCloudSnapshot(data);
    }
  })();
  try { return await pullJob; }
  finally { pullJob = null; }
}

async function resolveSyncConflict(source) {
  if (!confirm(`Keep the ${source} version? This replaces the other version. Export a backup first if you need both.`)) return;
  try {
    if (source === "local") await pushToCloud({ force: true });
    else await pullFromCloud({ force: true });
    document.getElementById("sync-conflict-controls")?.classList.add("hidden");
    const message = document.getElementById("supabase-msg");
    if (message) { message.textContent = "Conflict resolved. Synced!"; message.className = "text-xs font-semibold text-green"; }
    updateSyncStatusBadge(true);
  } catch (error) { markSyncError(error); }
}
