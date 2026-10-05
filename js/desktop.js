// Shared desktop editing flows; all changes use the same persisted appState.
function normalizeBackup(source) {
  const record = value => value && typeof value === "object" && !Array.isArray(value);
  if (!record(source) || !record(source.logs) || !record(source.goals) || !record(source.settings) || !Array.isArray(source.settings.scheduleBlocks)) throw new Error("Invalid backup: logs, goals and settings.scheduleBlocks are required.");
  const next = JSON.parse(JSON.stringify(source));
  for (const key of ["yearly", "northStar", "sixMonth", "threeMonth", "oneMonth", "linkedHabits"]) {
    if (next.goals[key] === undefined) next.goals[key] = key === "threeMonth" ? next.goals.ninetyDay || [] : [];
    if (!Array.isArray(next.goals[key])) throw new Error(`Invalid backup: goals.${key} must be an array.`);
  }
  delete next.goals.ninetyDay;
  // Validate every habit even when it is intentionally available but unlinked.
  const probe = { northStar: [{ id: "validation", title: "Validation" }], sixMonth: [], threeMonth: [], dailyHabits: next.settings.scheduleBlocks, linkedHabits: next.settings.scheduleBlocks.map(h => ({ habitId: h?.id, northStarId: "validation" })) };
  next.settings.scheduleBlocks = validateGoalCascade(probe);
  const safeId = value => typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value) && !["__proto__","constructor","prototype"].includes(value);
  for (const level of ["northStar","yearly","sixMonth","threeMonth","oneMonth"]) {
    const ids = new Set();
    for (const item of next.goals[level]) {
      if (!record(item) || !safeId(item.id) || ids.has(item.id)) throw new Error(`Invalid backup: duplicate or missing ID in ${level}.`);
      ids.add(item.id);
      const text = level === "northStar" ? item.title : item.name;
      if (typeof text !== "string") throw new Error(`Invalid backup: ${level} needs text names.`);
      if (level !== "northStar") {
        item.progress = Number(item.progress || 0); item.target = Number(item.target || 0);
        if (!Number.isFinite(item.progress) || !Number.isFinite(item.target) || item.progress < 0 || item.target < 0) throw new Error("Invalid checkpoint numbers.");
        if (item.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(item.deadline)) throw new Error("Invalid checkpoint deadline.");
      }
      item.completed = !!item.completed;
    }
  }
  const pillars = new Set(next.goals.northStar.map(n => n.id));
  const habits = new Set(next.settings.scheduleBlocks.map(h => h.id));
  next.goals.linkedHabits = next.goals.linkedHabits.filter(l => record(l) && pillars.has(l.northStarId) && habits.has(l.habitId));
  for (const level of ["yearly","sixMonth","threeMonth","oneMonth"]) next.goals[level].forEach(g => { if (!pillars.has(g.northStarId)) g.northStarId = ""; });
  for (const key of ["weeklyReviews","monthlyReviews"]) {
    next[key] ??= {};
    if (!record(next[key]) || Object.values(next[key]).some(v => !record(v))) throw new Error(`Invalid backup: ${key} must contain review objects.`);
  }
  for (const review of Object.values(next.weeklyReviews)) review.reflection ??= {};
  for (const key of ["dangerAreas","rules"]) {
    next[key] ??= [];
    if (!Array.isArray(next[key]) || next[key].some(v => !record(v))) throw new Error(`Invalid backup: ${key} must be an array of objects.`);
  }
  next.identityStatement ??= { title: "Who I Am Becoming", description: "" };
  if (!record(next.identityStatement) || Object.values(next.logs).some(v => !record(v))) throw new Error("Invalid backup content.");
  return next;
}

function editExecutionDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > getLocalDateString()) return;
  trackerDate = date;
  switchTab("today");
  const picker = document.getElementById("execution-date");
  if (picker) picker.value = date;
}

function saveInlineHabitDetails(date, id, form) {
  const habit = appState.settings.scheduleBlocks.find(b => b.id === id);
  if (!habit || date > getLocalDateString()) return;
  const values = { ...appState.logs[date]?.[id] };
  for (const field of habit.fields.filter(f => f.type !== "checkbox")) {
    const input = form.querySelector(`[data-detail-field="${field.id}"]`);
    if (field.type === "number" && input.value.trim() === "") { delete values[field.id]; continue; }
    const value = field.type === "number" ? Number(input.value) : input.value;
    if (field.type === "number" && (!Number.isFinite(value) || value < 0)) { form.querySelector(".habit-details-error").textContent = "Enter a valid non-negative amount."; return; }
    values[field.id] = value;
  }
  appState.logs[date] ??= {};
  appState.logs[date][id] = values;
  persistState();
  form.querySelector(".habit-details-error").textContent = "Details saved.";
  renderReview();
}

let editingHabitId = null;
function openHabitEditor(id = null) {
  editingHabitId = id;
  const habit = appState.settings.scheduleBlocks.find(b => b.id === id);
  document.getElementById("habit-name").value = habit?.name || "";
  document.getElementById("habit-time").value = habit?.time || "";
  const type = document.getElementById("habit-type");
  type.value = habit?.fields.some(f => f.type === "number") ? "number" : "checkbox";
  type.disabled = !!habit;
  updateHabitTrackingFields();
  document.getElementById("habit-unit-label").value = habit?.fields.find(f => f.type === "number")?.label || "Amount";
  document.getElementById("habit-northstar").innerHTML = '<option value="">Available, unlinked</option>' + appState.goals.northStar.map(n => `<option value="${n.id}">${escapeHtml(n.title)}</option>`).join("");
  document.getElementById("habit-northstar").value = appState.goals.linkedHabits.find(l => l.habitId === id)?.northStarId || "";
  document.getElementById("habit-delete").hidden = !habit;
  document.getElementById("habit-editor-error").textContent = "";
  showEditor("habit-editor-modal");
}
function updateHabitTrackingFields() {
  document.getElementById("habit-unit-label").closest("label").hidden = document.getElementById("habit-type").value !== "number";
}
function saveHabitDefinition() {
  const name = document.getElementById("habit-name").value.trim();
  if (!name) { document.getElementById("habit-editor-error").textContent = "Give this habit a name."; return; }
  const id = editingHabitId || "habit_" + Date.now();
  const existing = appState.settings.scheduleBlocks.find(b => b.id === id);
  const numeric = document.getElementById("habit-type").value === "number";
  const fields = existing?.fields || [{ id: numeric ? "amount" : "completed", type: numeric ? "number" : "checkbox", label: numeric ? document.getElementById("habit-unit-label").value.trim() || "Amount" : "Completed" }];
  if (existing && numeric) fields.find(f => f.type === "number").label = document.getElementById("habit-unit-label").value.trim() || "Amount";
  const definition = { id, name, time: document.getElementById("habit-time").value.trim(), fields };
  if (existing) Object.assign(existing, definition); else appState.settings.scheduleBlocks.push(definition);
  const northStarId = document.getElementById("habit-northstar").value;
  appState.goals.linkedHabits = appState.goals.linkedHabits.filter(l => l.habitId !== id);
  if (northStarId) appState.goals.linkedHabits.push({ habitId: id, northStarId });
  persistState(); closeEditor("habit-editor-modal"); renderAll();
}
function deleteHabitDefinition() {
  if (!editingHabitId || !confirm("Remove this habit from the plan? Historical logs will be kept in your backup.")) return;
  appState.settings.scheduleBlocks = appState.settings.scheduleBlocks.filter(b => b.id !== editingHabitId);
  appState.goals.linkedHabits = appState.goals.linkedHabits.filter(l => l.habitId !== editingHabitId);
  persistState(); closeEditor("habit-editor-modal"); renderAll();
}
function showEditor(id) { const modal = document.getElementById(id); modal.classList.remove("hidden"); modal.style.display = "flex"; }
function closeEditor(id) { const modal = document.getElementById(id); modal.classList.add("hidden"); modal.style.display = "none"; }

function renderPeriodReflection() {
  const container = document.getElementById("period-reflection");
  if (!container) return;
  const monthly = reviewMode === "monthly";
  const key = monthly ? `${reviewYear}-${String(reviewMonth + 1).padStart(2,"0")}` : reviewWeekId;
  const review = monthly ? appState.monthlyReviews[key] || {} : appState.weeklyReviews[key]?.reflection || {};
  const fields = monthly ? [["lesson","What this month taught you"],["goal","Goal for next month"],["change","What needs to change"]] : [["win","Top win this week"],["struggle","Biggest struggle"],["adjustment","One adjustment"]];
  container.innerHTML = `<h3 class="text-base font-bold mb-3">${monthly ? 'Monthly' : 'Weekly'} reflection · ${key}</h3>` + (monthly ? `<label class="editor-field">Are you on track?<select onchange="savePeriodReflection('onTrack',this.value)"><option value="">Choose</option>${["yes","partial","no"].map(v=>`<option value="${v}" ${review.onTrack === v ? 'selected' : ''}>${v === 'yes' ? 'On track' : v === 'no' ? 'Off track' : 'Partial'}</option>`).join('')}</select></label>` : '') + fields.map(([id,label]) => `<label class="editor-field">${label}<textarea oninput="savePeriodReflection('${id}',this.value)">${escapeHtml(review[id] || '')}</textarea></label>`).join("");
}
function savePeriodReflection(field, value) {
  if (reviewMode === "monthly") {
    const key = `${reviewYear}-${String(reviewMonth + 1).padStart(2,"0")}`;
    appState.monthlyReviews[key] ??= {};
    appState.monthlyReviews[key][field] = value;
  } else {
    appState.weeklyReviews[reviewWeekId] ??= { reflection: {} };
    appState.weeklyReviews[reviewWeekId].reflection ??= {};
    appState.weeklyReviews[reviewWeekId].reflection[field] = value;
  }
  persistState();
}

// Generic accessible behavior for the existing modal wrappers.
if (typeof document.addEventListener === "function") document.addEventListener("DOMContentLoaded", () => {
  let current = null, returnFocus = null;
  const modals = [...document.querySelectorAll('[id$="-modal"]')];
  const visible = modal => modal.style.display === "flex";
  const focusable = modal => [...modal.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(e => !e.disabled && !e.hidden && e.getClientRects().length);
  for (const modal of modals) {
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    const title = modal.querySelector("h3");
    if (title) { title.id ||= modal.id + "-heading"; modal.setAttribute("aria-labelledby", title.id); }
  }
  const observer = new MutationObserver(() => {
    const open = modals.find(visible) || null;
    if (open === current) return;
    if (current) current.dataset.open = "false";
    if (open) {
      if (!current) returnFocus = document.activeElement;
      current = open; open.dataset.open = "true";
      focusable(open)[0]?.focus();
    } else { current = null; if (returnFocus?.isConnected) returnFocus.focus(); }
  });
  modals.forEach(m => observer.observe(m, { attributes: true, attributeFilter: ["style","class"] }));
  document.addEventListener("keydown", event => {
    if (!current) return;
    if (event.key === "Escape") { event.preventDefault(); closeEditor(current.id); }
    if (event.key === "Tab") {
      const items = focusable(current), first = items[0], last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || !current.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !current.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    }
  });
});

// Reorder definitions, keeping IDs, links and historical logs intact.
function moveHabitBlock(habitId, direction) {
  if (direction !== -1 && direction !== 1) return;
  const visible = getLinkedBlocks();
  const position = visible.findIndex(block => block.id === habitId);
  const neighbor = visible[position + direction];
  if (position < 0 || !neighbor) return;
  const blocks = appState.settings.scheduleBlocks;
  const from = blocks.findIndex(block => block.id === habitId);
  const to = blocks.findIndex(block => block.id === neighbor.id);
  [blocks[from], blocks[to]] = [blocks[to], blocks[from]];
  persistState();
  renderAll();
}
