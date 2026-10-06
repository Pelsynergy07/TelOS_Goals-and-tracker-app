// ============================================================
//  🎯 Life OS — Career & Goals Tab
//  ============================================================
//  Goal cascade: North Star → 6-Month → 3-Month → Habits
//  Edit-mode toggle for managing all levels.
// ============================================================

let careerEditMode = false;

const checkpointLevels = [
  { key: "sixMonth",   label: "6-Month",  icon: "calendar", color: "amber" },
  { key: "threeMonth", label: "3-Month",  icon: "target",   color: "green" },
  { key: "oneMonth",   label: "1-Month",  icon: "flag",     color: "purple" },
];

function toggleCareerEdit() {
  careerEditMode = !careerEditMode;
  renderGoalsHub();
}

function renderGoalsHub() {
  const container = document.getElementById("cascade-container");
  if (!container) return;
  container.classList.toggle("bp-editing", careerEditMode);

  container.innerHTML = `
    <section class="bp-section" aria-labelledby="bp-ns-title">
      <header class="bp-section-head">
        <h3 id="bp-ns-title" class="bp-section-title"><i data-lucide="star" class="text-blue"></i>North Stars<span class="bp-count">${appState.goals.northStar.length}</span></h3>
        ${careerEditMode ? `<button type="button" class="btn btn-outline" onclick="addNorthStar()"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Add North Star</button>` : ""}
      </header>
      <div class="bp-ns-grid" id="northstar-list"></div>
    </section>

    <section class="bp-section" aria-labelledby="bp-cp-title">
      <header class="bp-section-head">
        <h3 id="bp-cp-title" class="bp-section-title"><i data-lucide="milestone" class="text-text-dim"></i>Checkpoints</h3>
      </header>
      <div class="bp-checkpoint-grid">
        ${checkpointLevels.map(level => `
          <div class="bp-column">
            <div class="bp-column-head">
              <span class="bp-column-title text-${level.color}"><i data-lucide="${level.icon}"></i>${level.label}</span>
              <span class="bp-count">${(appState.goals[level.key] || []).length}</span>
            </div>
            <div class="bp-goal-list" id="goals-${level.key}-list"></div>
            ${careerEditMode ? `<button type="button" class="bp-add-row" onclick="openAddGoal('${level.key}')"><i data-lucide="plus"></i>Add ${level.label.toLowerCase()} checkpoint</button>` : ""}
          </div>`).join("")}
      </div>
    </section>

    <section class="bp-section" aria-labelledby="bp-habit-title">
      <header class="bp-section-head">
        <h3 id="bp-habit-title" class="bp-section-title"><i data-lucide="activity" class="text-green"></i>Daily habits</h3>
        <button type="button" class="btn btn-outline" onclick="openHabitEditor()"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Add habit</button>
      </header>
      <div id="linked-habits-list" class="bp-habit-grid"></div>
    </section>`;

  renderNorthStar();
  checkpointLevels.forEach(level => renderGoalList(`goals-${level.key}-list`, appState.goals[level.key] || [], level.key));
  renderLinkedHabitsList();

  const btn = document.getElementById("career-edit-btn");
  if (btn) {
    btn.style.display = "";
    btn.className = careerEditMode ? "btn btn-primary shrink-0" : "btn btn-outline shrink-0";
    const label = document.getElementById("career-edit-label");
    if (label) label.textContent = careerEditMode ? "Done editing" : "Edit";
    const iconEl = btn.querySelector("i, svg");
    if (iconEl) iconEl.outerHTML = `<i data-lucide="${careerEditMode ? "check" : "pencil"}" class="w-3.5 h-3.5" id="career-edit-icon"></i>`;
  }

  if (typeof renderEmptyStateBanner === "function") renderEmptyStateBanner();
  lucide.createIcons();
}

// ─── North Star ───────────────────────────────────────────

function renderNorthStar() {
  const list = document.getElementById("northstar-list");
  if (!list) return;

  if (appState.goals.northStar.length === 0) {
    list.innerHTML = `<p class="bp-empty">No North Stars yet. ${careerEditMode ? "Add one to start your cascade." : "Tap Edit to add one, or use Plan with ChatGPT."}</p>`;
    return;
  }

  list.innerHTML = appState.goals.northStar.map((item, idx) => {
    const checkpoints = checkpointLevels.reduce((n, l) => n + (appState.goals[l.key] || []).filter(g => g.northStarId === item.id).length, 0);
    const habits = appState.goals.linkedHabits.filter(l => l.northStarId === item.id).length;
    if (careerEditMode) {
      return `<div class="bp-ns-card is-editing">
        <div class="bp-field-row">
          <label class="bp-field bp-grow"><span>Title</span><input type="text" value="${escapeHtml(item.title)}" onchange="updateNorthStar(${idx},'title',this.value)"></label>
          <button type="button" aria-label="Delete ${escapeHtml(item.title)}" onclick="deleteNorthStar(${idx})" class="icon-button text-red bp-delete"><i data-lucide="trash-2"></i></button>
        </div>
        <label class="bp-field"><span>Description</span><textarea rows="3" onchange="updateNorthStar(${idx},'description',this.value)">${escapeHtml(item.description || "")}</textarea></label>
      </div>`;
    }
    return `<article class="bp-ns-card${item.completed ? " is-complete" : ""}">
      <h4 class="bp-ns-title">${item.completed ? '<i data-lucide="check-circle-2" class="text-green"></i>' : ""}${escapeHtml(item.title)}</h4>
      ${item.description ? `<p class="bp-ns-desc">${escapeHtml(item.description)}</p>` : ""}
      <p class="bp-ns-meta">${checkpoints} checkpoint${checkpoints === 1 ? "" : "s"} · ${habits} habit${habits === 1 ? "" : "s"}</p>
    </article>`;
  }).join("");
}

function addNorthStar() {
  appState.goals.northStar.push({ id: "ns_" + Date.now(), title: "New North Star", description: "", completed: false });
  persistState();
  renderGoalsHub();
  const inputs = document.querySelectorAll("#northstar-list input[type=text]");
  inputs[inputs.length - 1]?.select();
}

function updateNorthStar(idx, field, val) {
  appState.goals.northStar[idx][field] = val;
  persistState();
}

function deleteNorthStar(idx) {
  if (!confirm(`Delete "${appState.goals.northStar[idx].title}"? Its habits and checkpoints will be unlinked, and their data will be kept.`)) return;
  const id = appState.goals.northStar[idx].id;
  appState.goals.linkedHabits = appState.goals.linkedHabits.filter(l => l.northStarId !== id);
  for (const level of ["yearly","sixMonth","threeMonth","oneMonth"]) {
    (appState.goals[level] || []).forEach(g => { if (g.northStarId === id) g.northStarId = ""; });
  }
  appState.goals.northStar.splice(idx, 1);
  persistState();
  renderGoalsHub();
}

// ─── Checkpoint lists ─────────────────────────────────────

function renderGoalList(containerId, goals, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (goals.length === 0) {
    container.innerHTML = `<p class="bp-empty">No checkpoints yet.${careerEditMode ? "" : " Tap Edit to add one."}</p>`;
    return;
  }

  container.innerHTML = goals.map((goal, idx) => {
    const ns = appState.goals.northStar.find(n => n.id === goal.northStarId);
    const pct = goal.completed ? 100 : goal.target > 0 ? Math.min(Math.round(goal.progress / goal.target * 100), 100) : 0;
    if (careerEditMode) {
      return `<div class="bp-goal is-editing">
        <div class="bp-field-row">
          <label class="bp-field bp-grow"><span>Checkpoint</span><textarea rows="2" class="bp-name-input" onchange="updateGoalName(${idx},'${type}',this.value)">${escapeHtml(goal.name)}</textarea></label>
          <button type="button" aria-label="Delete ${escapeHtml(goal.name)}" onclick="deleteGoal(${idx},'${type}')" class="icon-button text-red bp-delete"><i data-lucide="trash-2"></i></button>
        </div>
        <label class="bp-field"><span>North Star</span><select onchange="updateGoalNorthStar(${idx},'${type}',this.value)">
          <option value="">Not linked</option>
          ${appState.goals.northStar.map(n => `<option value="${n.id}" ${n.id === goal.northStarId ? "selected" : ""}>${escapeHtml(n.title)}</option>`).join("")}
        </select></label>
        <div class="bp-field-grid">
          <label class="bp-field"><span>Deadline</span><input type="date" value="${escapeHtml(goal.deadline || "")}" onchange="updateGoalDeadline(${idx},'${type}',this.value)"></label>
          <label class="bp-field"><span>Progress</span><input type="number" min="0" max="${goal.target}" value="${goal.progress}" onchange="updateGoalProgress(${idx},'${type}',this.value)"></label>
          <label class="bp-field"><span>Target${goal.unit ? ` (${escapeHtml(goal.unit)})` : ""}</span><input type="number" min="1" value="${goal.target}" onchange="updateGoalTarget(${idx},'${type}',this.value)"></label>
        </div>
      </div>`;
    }
    const daysLeft = calculateDaysRemaining(goal.deadline);
    const overdue = daysLeft.startsWith("Overdue") && !goal.completed;
    return `<article class="bp-goal${goal.completed ? " is-complete" : ""}">
      <div class="bp-goal-top">
        <h4 class="bp-goal-name">${escapeHtml(goal.name)}</h4>
        ${goal.completed ? '<span class="bp-chip is-done">Done</span>' : daysLeft ? `<span class="bp-chip${overdue ? " is-overdue" : ""}">${daysLeft}</span>` : ""}
      </div>
      ${ns ? `<p class="bp-goal-ns"><i data-lucide="star"></i><span>${escapeHtml(ns.title)}</span></p>` : '<p class="bp-goal-ns is-unlinked">Not linked to a North Star</p>'}
      <div class="bp-goal-progress"><span class="bp-bar"><span style="width:${pct}%"></span></span><span class="bp-goal-count">${goal.progress}/${goal.target}${goal.unit ? " " + escapeHtml(goal.unit) : ""}</span></div>
    </article>`;
  }).join("");
}

// ─── Linked Habits ────────────────────────────────────────

function renderLinkedHabitsList() {
  const container = document.getElementById("linked-habits-list");
  if (!container) return;

  const blocks = appState.settings.scheduleBlocks;
  const linkOf = id => appState.goals.linkedHabits.find(l => l.habitId === id && appState.goals.northStar.some(n => n.id === l.northStarId));
  const habitRow = block => {
    const link = linkOf(block.id);
    if (!careerEditMode) {
      return `<li class="bp-habit"><span class="bp-habit-name">${escapeHtml(block.name)}</span>${block.time ? `<span class="bp-habit-time">${escapeHtml(block.time)}</span>` : ""}</li>`;
    }
    return `<li class="bp-habit is-editing">
      <div class="bp-habit-line">
        <span class="bp-habit-name">${escapeHtml(block.name)}</span>
        <button type="button" class="icon-button" aria-label="Edit ${escapeHtml(block.name)}" title="Edit habit" onclick="openHabitEditor('${block.id}')"><i data-lucide="pencil"></i></button>
      </div>
      <select aria-label="North Star for ${escapeHtml(block.name)}" onchange="linkHabit('${block.id}', this.value);renderGoalsHub()">
        <option value="">Not linked</option>
        ${appState.goals.northStar.map(n => `<option value="${n.id}" ${link?.northStarId === n.id ? "selected" : ""}>${escapeHtml(n.title)}</option>`).join("")}
      </select>
    </li>`;
  };

  const groups = appState.goals.northStar.map(ns => ({
    title: ns.title, unlinked: false,
    habits: blocks.filter(b => linkOf(b.id)?.northStarId === ns.id)
  }));
  const unlinked = blocks.filter(b => !linkOf(b.id));
  if (careerEditMode && unlinked.length) groups.push({ title: "Not linked", unlinked: true, habits: unlinked });

  const visible = groups.filter(g => g.habits.length || careerEditMode);
  if (!visible.length) {
    container.innerHTML = '<p class="bp-empty">No habits linked yet. Add a habit and link it to a North Star.</p>';
    return;
  }
  container.innerHTML = visible.map(g => `<div class="bp-habit-group${g.unlinked ? " is-unlinked" : ""}">
    <h4 class="bp-habit-group-title">${g.unlinked ? "" : '<i data-lucide="star"></i>'}<span>${escapeHtml(g.title)}</span><span class="bp-count">${g.habits.length}</span></h4>
    ${g.habits.length ? `<ul class="bp-habit-list">${g.habits.map(habitRow).join("")}</ul>` : '<p class="bp-empty">No habits linked.</p>'}
  </div>`).join("");
}

function updateBlockTime(blockId, val) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (block) { block.time = val; persistState(); }
}

function linkHabit(habitId, northStarId) {
  const existing = appState.goals.linkedHabits.findIndex(l => l.habitId === habitId);
  if (existing >= 0) {
    if (northStarId) appState.goals.linkedHabits[existing].northStarId = northStarId;
    else appState.goals.linkedHabits.splice(existing, 1);
  } else if (northStarId) {
    appState.goals.linkedHabits.push({ habitId, northStarId });
  }
  persistState();
}

// ─── Goal CRUD ────────────────────────────────────────────

function openAddGoal(level) {
  const nsSelect = document.getElementById("goal-form-northstar");
  nsSelect.innerHTML = '<option value="">— Not linked —</option>' + appState.goals.northStar.map(n => `<option value="${n.id}">${escapeHtml(n.title)}</option>`).join("");
  document.getElementById("goal-form-type").value = level;
  document.getElementById("goal-form-name").value = "";
  document.getElementById("goal-form-target").value = "";
  document.getElementById("goal-form-unit").value = "";
  document.getElementById("goal-form-deadline").value = "";
  document.getElementById("add-goal-modal").classList.remove("hidden");
  document.getElementById("add-goal-modal").style.display = "flex";
  setTimeout(() => { document.getElementById("goal-form-name").focus(); validateGoalForm(); }, 100);
}

function validateGoalForm() {
  const name = document.getElementById("goal-form-name").value.trim();
  const target = document.getElementById("goal-form-target").value;
  const deadline = document.getElementById("goal-form-deadline").value;
  const btn = document.getElementById("goal-add-btn");
  const valid = name && Number.isFinite(Number(target)) && Number(target) > 0 && deadline && ["sixMonth","threeMonth","oneMonth"].includes(document.getElementById("goal-form-type").value);
  btn.disabled = !valid;
  btn.classList.toggle("opacity-50", !valid);
}

function closeAddGoalModal() {
  document.getElementById("add-goal-modal").classList.add("hidden");
  document.getElementById("add-goal-modal").style.display = "none";
}

function addNewGoal() {
  const name = document.getElementById("goal-form-name").value.trim();
  const type = document.getElementById("goal-form-type").value;
  const target = Number(document.getElementById("goal-form-target").value);
  const unit = document.getElementById("goal-form-unit").value.trim();
  const deadline = document.getElementById("goal-form-deadline").value;
  const northStarId = document.getElementById("goal-form-northstar").value || "";
  if (!name || !deadline || !Number.isFinite(target) || target <= 0 || !["sixMonth","threeMonth","oneMonth"].includes(type)) return;

  const goal = { id: "g_" + Date.now(), name, progress: 0, target, unit, deadline, northStarId, completed: false };
  if (type === "yearly") appState.goals.yearly.push(goal);
  else if (type === "sixMonth") appState.goals.sixMonth.push(goal);
  else if (type === "threeMonth") appState.goals.threeMonth.push(goal);
  else if (type === "oneMonth") appState.goals.oneMonth.push(goal);

  persistState();
  closeAddGoalModal();
  renderGoalsHub();
}

function getGoalsByType(type) {
  if (type === "yearly") return appState.goals.yearly;
  if (type === "sixMonth") return appState.goals.sixMonth;
  if (type === "threeMonth") return appState.goals.threeMonth;
  return appState.goals.oneMonth;
}

function updateGoalProgress(idx, type, val) {
  const goals = getGoalsByType(type);
  const prev = goals[idx].progress;
  const progress = Number(val);
  if (!Number.isFinite(progress) || progress < 0) return;
  goals[idx].progress = Math.min(progress, goals[idx].target);
  goals[idx].completed = goals[idx].target > 0 && goals[idx].progress >= goals[idx].target;
  if (prev < goals[idx].target && goals[idx].progress >= goals[idx].target) celebrate();
  persistState();
}

function updateGoalTarget(idx, type, val) {
  const goal = getGoalsByType(type)[idx];
  const target = Number(val);
  if (!Number.isFinite(target) || target <= 0) { renderGoalsHub(); return; }
  goal.target = target;
  goal.progress = Math.min(goal.progress, target);
  goal.completed = goal.progress >= target;
  persistState();
  renderGoalsHub();
}

function updateGoalName(idx, type, val) {
  getGoalsByType(type)[idx].name = val;
  persistState();
}

function updateGoalDeadline(idx, type, val) {
  getGoalsByType(type)[idx].deadline = val;
  persistState();
}

function updateGoalNorthStar(idx, type, val) {
  getGoalsByType(type)[idx].northStarId = val;
  persistState();
}

function deleteGoal(idx, type) {
  const goals = getGoalsByType(type);
  if (!confirm(`Delete "${goals[idx].name}"?`)) return;
  goals.splice(idx, 1);
  persistState();
  renderGoalsHub();
}
