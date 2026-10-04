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
        <button onclick="copyAIGoalPrompt()" class="btn btn-outline border-green/30 text-green hover:bg-green/[0.06] text-caption">Copy ChatGPT Prompt</button>
        <button onclick="openChatGPTPlanner()" class="btn btn-outline text-caption">Open ChatGPT</button>
        <span id="ai-import-msg" class="text-xs font-semibold text-text-dim"></span>
      </div>
      <div class="space-y-2">
        <label for="ai-import-json" class="text-caption text-text-dim font-bold uppercase tracking-wider block">Paste generated JSON</label>
        <textarea id="ai-import-json" rows="12" class="w-full text-xs" placeholder='{"identityStatement":{...},"dangerAreas":[...],"rules":[...],"northStar":[...],"sixMonth":[...],"threeMonth":[...],"oneMonth":[...],"dailyHabits":[...],"linkedHabits":[...]}' oninput="validateAIImportInput()"></textarea>
      </div>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <button onclick="closeAIModal()" class="text-caption font-bold text-text-dim hover:text-text">Cancel</button>
        <button id="ai-import-btn" onclick="importAIGoalsFromTextarea()" class="btn btn-green text-caption opacity-50" disabled>Import JSON</button>
      </div>
    </div>`;
  validateAIImportInput();
}

function validateAIImportInput() {
  const input = document.getElementById("ai-import-json");
  const btn = document.getElementById("ai-import-btn");
  if (!input || !btn) return;
  const valid = input.value.trim().length > 0;
  btn.disabled = !valid;
  btn.classList.toggle("opacity-50", !valid);
  btn.classList.toggle("cursor-not-allowed", !valid);
}

function getAIGoalImportPrompt() {
  return AI_GOAL_IMPORT_PROMPT_TEMPLATE
    .replace("{{TODAY}}", getLocalDateString());
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

// Validate the complete plan before changing any saved data.
function validateGoalCascade(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) throw new Error("Imported JSON must be an object.");
  for (const key of ["northStar", "sixMonth", "threeMonth", "linkedHabits"]) {
    if (!Array.isArray(content[key])) throw new Error(`JSON must include a ${key} array.`);
  }
  if (content.oneMonth !== undefined && !Array.isArray(content.oneMonth)) throw new Error("oneMonth must be an array.");
  const habits = content.dailyHabits ?? content.scheduleBlocks ?? content.settings?.scheduleBlocks;
  if (!Array.isArray(habits)) {
    throw new Error("This plan is missing dailyHabits. Copy the updated planner prompt and regenerate JSON with habit names, times, and IDs; linkedHabits alone cannot define a schedule.");
  }
  const safeId = id => typeof id === "string" && /^[a-zA-Z0-9_-]+$/.test(id) && !["__proto__", "constructor", "prototype"].includes(id);
  const checkIds = (items, label) => {
    const ids = new Set();
    for (const item of items) {
      if (!item || !safeId(item.id)) throw new Error(`${label}: each item needs a valid ID (letters, numbers, underscores or hyphens).`);
      if (ids.has(item.id)) throw new Error(`${label}: duplicate ID "${item.id}".`);
      ids.add(item.id);
    }
    return ids;
  };
  const northStarIds = checkIds(content.northStar, "northStar");
  const habitIds = checkIds(habits, "dailyHabits");
  const reservedLogKeys = new Set(["feelingScore","biggestWin","biggestLearning","energyLevel","moodGuiltLevel","pmoAvoided","avoidanceFriction","adjustment"]);
  const blocks = habits.map(habit => {
    if (reservedLogKeys.has(habit.id)) throw new Error(`Habit ID "${habit.id}" is reserved for reflection data.`);
    if (typeof habit.name !== "string" || !habit.name.trim()) throw new Error(`Habit "${habit.id}" needs a name.`);
    if (habit.time !== undefined && typeof habit.time !== "string") throw new Error(`Habit "${habit.id}": time must be text.`);
    const fields = habit.fields ?? [{ id: "completed", type: "checkbox", label: "Completed" }];
    if (!Array.isArray(fields) || !fields.length) throw new Error(`Habit "${habit.id}" needs tracking fields.`);
    checkIds(fields, `Habit "${habit.id}" fields`);
    if (!fields.some(f => f.type === "checkbox" || f.type === "number")) throw new Error(`Habit "${habit.id}" needs a checkbox or number field to track completion.`);
    for (const field of fields) {
      if (!["checkbox", "number", "text", "time"].includes(field.type)) throw new Error(`Habit "${habit.id}": unsupported field type "${field.type}".`);
      if (field.type === "checkbox" && field.id !== "completed") throw new Error(`Habit "${habit.id}": checkbox field ID must be "completed".`);
    }
    return { id: habit.id, name: habit.name.trim(), time: habit.time || "", fields: fields.map(f => ({ ...f, label: f.label || f.id })) };
  });
  for (const level of ["sixMonth", "threeMonth", "oneMonth"]) {
    const goals = content[level] || [];
    checkIds(goals, level);
    for (const goal of goals) {
      if (!Number.isFinite(Number(goal.progress || 0)) || !Number.isFinite(Number(goal.target || 0)) || Number(goal.progress || 0) < 0 || Number(goal.target || 0) < 0) throw new Error(`${level}: checkpoint numbers must be non-negative and finite.`);
      if (goal.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(goal.deadline) || addDateDays(goal.deadline, 0) !== goal.deadline)) throw new Error(`${level}: invalid deadline.`);
      if (!northStarIds.has(goal.northStarId)) throw new Error(`${level}: checkpoint "${goal.id}" references an unknown North Star.`);
    }
  }
  const linkedIds = new Set();
  for (const link of content.linkedHabits) {
    if (!link || !habitIds.has(link.habitId)) throw new Error(`linkedHabits references an unknown daily habit: "${link?.habitId}".`);
    if (!northStarIds.has(link.northStarId)) throw new Error(`Habit "${link.habitId}" references an unknown North Star.`);
    if (linkedIds.has(link.habitId)) throw new Error(`Habit "${link.habitId}" is linked more than once. Link each habit to one North Star.`);
    linkedIds.add(link.habitId);
  }
  for (const id of habitIds) {
    if (!linkedIds.has(id)) throw new Error(`Daily habit "${id}" needs a linkedHabits entry to appear in Execution and Progress.`);
  }
  for (const key of ["dangerAreas", "rules"]) {
    if (content[key] !== undefined && (!Array.isArray(content[key]) || content[key].some(item => !item || typeof item !== "object"))) throw new Error(`${key} must be an array of objects.`);
  }
  return blocks;
}

function applyGeneratedGoalCascade(content) {
  const scheduleBlocks = validateGoalCascade(content);

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
  appState.goals.oneMonth = normalizeGoalItems(content.oneMonth, "g").map(mapGoal);
  appState.goals.linkedHabits = (content.linkedHabits || []).filter(link => link?.habitId && validNorthStarIds.has(link.northStarId));

  appState.settings.scheduleBlocks = scheduleBlocks;
  persistState();
  closeAIModal();
  renderAll();
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
