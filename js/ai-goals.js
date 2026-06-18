function openAIGoalImport() {
  document.getElementById("ai-modal").style.display = "flex";
  renderAIImportMode();
}

function openChatGPTPlanner() {
  window.open("https://chatgpt.com", "_blank", "noopener,noreferrer");
}

function closeAIModal() {
  document.getElementById("ai-modal").style.display = "none";
}

function renderAIImportMode() {
  const container = document.getElementById("ai-question-container");
  if (!container) return;
  container.innerHTML = `
    <div class="space-y-3">
      <div>
        <p class="text-sm font-bold text-text">Use ChatGPT as your planner</p>
        <p class="text-xs text-text-dim mt-1">Copy the prompt below into ChatGPT, answer the curated questions there, then paste the final JSON back here.</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="copyAIGoalPrompt()" class="btn btn-primary text-[10px]">Copy ChatGPT Prompt</button>
        <button onclick="openChatGPTPlanner()" class="btn btn-outline text-[10px]">Open ChatGPT</button>
        <span id="ai-import-msg" class="text-xs font-semibold text-text-dim"></span>
      </div>
      <div class="space-y-2">
        <label class="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Paste generated JSON</label>
        <textarea id="ai-import-json" rows="12" class="w-full text-xs" placeholder='{"identityStatement":{...},"dangerAreas":[...],"rules":[...],"northStar":[...],"sixMonth":[...],"threeMonth":[...],"linkedHabits":[...]}'></textarea>
      </div>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <button onclick="closeAIModal()" class="text-[10px] font-bold text-text-dim hover:text-text">Cancel</button>
        <button onclick="importAIGoalsFromTextarea()" class="btn btn-primary text-[10px]">Import JSON</button>
      </div>
    </div>`;
}

function getAIGoalImportPrompt() {
  return AI_GOAL_IMPORT_PROMPT_TEMPLATE
    .replace("{{TODAY}}", getLocalDateString())
    .replace("{{HABIT_IDS}}", JSON.stringify(appState.settings.scheduleBlocks.map(b => b.id)));
}

async function copyAIGoalPrompt() {
  const msgEl = document.getElementById("ai-import-msg");
  try {
    await navigator.clipboard.writeText(getAIGoalImportPrompt());
    if (msgEl) {
      msgEl.className = "text-xs font-semibold text-green";
      msgEl.textContent = "Prompt copied.";
    }
  } catch {
    if (msgEl) {
      msgEl.className = "text-xs font-semibold text-red";
      msgEl.textContent = "Clipboard copy failed. Open the prompt file directly.";
    }
  }
}

function normalizeGoalItems(items, prefix) {
  return (items || []).map(item => ({
    ...item,
    id: item.id || `${prefix}_${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    completed: !!item.completed
  }));
}

function validateGoalCascade(content) {
  if (!content || typeof content !== "object") throw new Error("Imported JSON must be an object.");
  if (!Array.isArray(content.northStar) || !Array.isArray(content.sixMonth) || !Array.isArray(content.threeMonth) || !Array.isArray(content.linkedHabits)) {
    throw new Error("JSON must include northStar, sixMonth, threeMonth, and linkedHabits arrays.");
  }
}

function applyGeneratedGoalCascade(content) {
  validateGoalCascade(content);

  if (content.identityStatement && typeof content.identityStatement === "object") {
    appState.identityStatement = {
      title: content.identityStatement.title || "Who I Am Becoming",
      description: content.identityStatement.description || ""
    };
  }
  if (Array.isArray(content.dangerAreas)) {
    appState.dangerAreas = content.dangerAreas.map(d => ({
      id: d.id || "da_" + Date.now() + Math.random().toString(36).slice(2, 6),
      title: d.title || "Untitled Danger Area",
      reality: d.reality || "",
      reminder: d.reminder || ""
    }));
  }
  if (Array.isArray(content.rules)) {
    appState.rules = content.rules.map(r => ({
      id: r.id || "rule_" + Date.now() + Math.random().toString(36).slice(2, 6),
      text: r.text || "Untitled Rule"
    }));
  }

  const northStar = normalizeGoalItems(content.northStar, "ns").map(item => ({
    id: item.id,
    title: item.title || "Untitled North Star",
    description: item.description || "",
    completed: !!item.completed
  }));

  const validNorthStarIds = new Set(northStar.map(n => n.id));
  const mapGoal = (goal) => ({
    id: goal.id,
    name: goal.name || "Untitled Goal",
    progress: Number(goal.progress || 0),
    target: Number(goal.target || 0),
    unit: goal.unit || "",
    deadline: goal.deadline || "",
    northStarId: validNorthStarIds.has(goal.northStarId) ? goal.northStarId : "",
    completed: !!goal.completed
  });

  appState.goals.northStar = northStar;
  appState.goals.sixMonth = normalizeGoalItems(content.sixMonth, "g").map(mapGoal);
  appState.goals.threeMonth = normalizeGoalItems(content.threeMonth, "g").map(mapGoal);
  appState.goals.oneMonth = (content.oneMonth || []).map(mapGoal);
  appState.goals.linkedHabits = (content.linkedHabits || []).filter(link => link?.habitId && validNorthStarIds.has(link.northStarId));

  persistState();
  closeAIModal();
  renderGoalsHub();
  if (typeof renderReview === "function") renderReview();
  if (typeof renderToday === "function") renderToday();
  celebrate();
}

function importAIGoalsFromTextarea() {
  const input = document.getElementById("ai-import-json");
  const msgEl = document.getElementById("ai-import-msg");
  if (!input) return;
  try {
    const raw = input.value.trim();
    if (!raw) throw new Error("Paste the generated JSON first.");
    const content = JSON.parse(raw.replace(/```json|```/g, "").trim());
    applyGeneratedGoalCascade(content);
  } catch (err) {
    if (msgEl) {
      msgEl.className = "text-xs font-semibold text-red";
      msgEl.textContent = err.message || "Invalid JSON.";
    }
  }
}
