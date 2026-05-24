// ============================================================
//  ⚙️ Life OS — Settings Tab
//  ============================================================
//  Supabase config, backup/export/import, and destructive resets.
// ============================================================

function renderSettings() {
  const urlEl = document.getElementById("settings-supabase-url");
  const keyEl = document.getElementById("settings-supabase-key");
  if (urlEl) urlEl.value = appState.settings.supabaseUrl || "";
  if (keyEl) keyEl.value = appState.settings.supabaseKey || "";
  const aiKeyEl = document.getElementById("settings-ai-key");
  const aiEndpointEl = document.getElementById("settings-ai-endpoint");
  const aiModelEl = document.getElementById("settings-ai-model");
  const aiSpeechModelEl = document.getElementById("settings-ai-speech-model");
  if (aiKeyEl) aiKeyEl.value = appState.settings.aiApiKey || "";
  if (aiEndpointEl) aiEndpointEl.value = appState.settings.aiEndpoint || "";
  if (aiModelEl) aiModelEl.value = appState.settings.aiModel || "";
  if (aiSpeechModelEl) aiSpeechModelEl.value = appState.settings.aiSpeechModel || "";
}

function saveAISettings() {
  const key = document.getElementById("settings-ai-key").value.trim();
  const endpoint = document.getElementById("settings-ai-endpoint").value.trim();
  const model = document.getElementById("settings-ai-model").value.trim();
  const speechModel = document.getElementById("settings-ai-speech-model").value.trim();
  const msgEl = document.getElementById("ai-msg");
  if (!key || !endpoint || !model) {
    if (msgEl) { msgEl.className = "text-xs font-semibold text-red"; msgEl.textContent = "All fields required."; }
    return;
  }
  appState.settings.aiApiKey = key;
  appState.settings.aiEndpoint = endpoint;
  appState.settings.aiModel = model;
  appState.settings.aiSpeechModel = speechModel;
  persistState();
  if (msgEl) { msgEl.className = "text-xs font-semibold text-green"; msgEl.textContent = "Saved."; setTimeout(() => msgEl.textContent = "", 2000); }
}

// ─── Supabase Connection ──────────────────────────────────

async function testAndSaveSupabaseConnection() {
  const url = document.getElementById("settings-supabase-url").value.trim();
  const key = document.getElementById("settings-supabase-key").value.trim();
  const msgEl = document.getElementById("supabase-msg");
  if (!url || !key) return;
  if (msgEl) { msgEl.className = "text-xs font-semibold text-blue animate-pulse"; msgEl.textContent = "Verifying connection..."; }
  try {
    const testClient = supabase.createClient(url, key);
    const { error } = await testClient.from('life_os_sync').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { if (error.code === '42P01') throw new Error("Table 'life_os_sync' doesn't exist."); throw error; }
    appState.settings.supabaseUrl = url;
    appState.settings.supabaseKey = key;
    appState.settings.syncEnabled = true;
    dbClient = testClient;
    persistState();
    updateSyncStatusBadge(true);
    await pushToCloud();
    if (msgEl) { msgEl.className = "text-xs font-semibold text-green"; msgEl.textContent = "Connected."; }
  } catch (err) {
    if (msgEl) { msgEl.className = "text-xs font-semibold text-red"; msgEl.textContent = err.message || "Connection failed."; }
    updateSyncStatusBadge(false, "Failed");
  }
}

function disconnectSupabase() {
  if (confirm("Disconnect database sync?")) {
    appState.settings.supabaseUrl = "";
    appState.settings.supabaseKey = "";
    appState.settings.syncEnabled = false;
    dbClient = null;
    persistState();
    updateSyncStatusBadge(false);
    const urlEl = document.getElementById("settings-supabase-url");
    const keyEl = document.getElementById("settings-supabase-key");
    if (urlEl) urlEl.value = "";
    if (keyEl) keyEl.value = "";
  }
}

// ─── Reset, Export, Import ───────────────────────────────

function confirmReset(type) { if (confirm(`Reset all logs for ${type === 'week' ? 'this week' : 'this month'}?`)) executeReset(type); }

function executeReset(type) {
  if (type === "week") {
    getWeekDates(getLocalDateString()).forEach(dStr => { delete appState.logs[dStr]; });
  } else if (type === "month") {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    Object.keys(appState.logs).forEach(dStr => {
      const d = new Date(dStr);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) delete appState.logs[dStr];
    });
  } else if (type === "all") {
    localStorage.removeItem(APP_CONFIG.storageKey);
    appState = JSON.parse(JSON.stringify(initialMockData));
    persistState();
    initSupabase();
    renderAll();
    alert("Reset completed.");
    return;
  }
  persistState(); renderAll();
}

function exportDataJSON() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `life_os_backup_${getLocalDateString()}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportLogsCSV() {
  const headers = ["Date","Feeling Score","Energy Level","Mood/Guilt","PMO Avoided","Biggest Win","Biggest Learning","Avoidance/Friction","Adjustment"];
  appState.settings.scheduleBlocks.forEach(b => { headers.push(`${b.name} (Value)`); headers.push(`${b.name} (Notes)`); });
  let csvContent = headers.join(",") + "\r\n";
  Object.keys(appState.logs).sort().forEach(dStr => {
    const log = appState.logs[dStr];
    const row = [dStr, log.feelingScore || "", log.energyLevel || "", log.moodGuiltLevel || "", log.pmoAvoided !== undefined ? (log.pmoAvoided ? "Yes" : "No") : "", `"${(log.biggestWin || "").replace(/"/g,'""')}"`, `"${(log.biggestLearning || "").replace(/"/g,'""')}"`, `"${(log.avoidanceFriction || "").replace(/"/g,'""')}"`, `"${(log.adjustment || "").replace(/"/g,'""')}"`];
    appState.settings.scheduleBlocks.forEach(b => {
      const bVal = log[b.id] || {};
      let val = "", note = "";
      const hasNumber = b.fields.some(f => f.type === "number");
      if (hasNumber) {
        const numField = b.fields.find(f => f.type === "number");
        val = bVal[numField.id] !== undefined ? bVal[numField.id] : "";
        note = bVal.notes || "";
      } else {
        val = bVal.completed ? "Checked" : "Unchecked";
        note = bVal.notes || bVal.actual_time || "";
      }
      row.push(`"${val}"`); row.push(`"${note.replace(/"/g,'""')}"`);
    });
    csvContent += row.join(",") + "\r\n";
  });
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `life_os_logs_${getLocalDateString()}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function importDataJSON(event) {
  const file = event.target.files[0];
  const statusMsg = document.getElementById("import-msg");
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.logs && imported.goals && imported.settings) {
        appState = imported;
        persistState();
        initSupabase();
        renderAll();
        if (statusMsg) { statusMsg.className = "block text-center text-[10px] mt-2 font-medium text-green"; statusMsg.textContent = "Backup imported successfully."; }
      } else throw new Error();
    } catch (err) {
      if (statusMsg) { statusMsg.className = "block text-center text-[10px] mt-2 font-medium text-red"; statusMsg.textContent = "Invalid backup format."; }
    }
  };
  reader.readAsText(file);
}
