// ============================================================
//  🎯 Life OS — Career & Goals Tab
//  ============================================================
//  Goal cascade: North Star → 6-Month → 3-Month → Habits
//  Edit-mode toggle for managing all levels.
// ============================================================

let careerEditMode = false;

const cascadeLevels = [
  { key: "northStar",  label: "North Star",            icon: "star",     color: "blue",   isCardGrid: true },
  { key: "sixMonth",   label: "6-Month Checkpoints",   icon: "calendar",  color: "amber",  isCardGrid: false },
  { key: "threeMonth", label: "3-Month Checkpoints",   icon: "target",    color: "green",  isCardGrid: false },
  { key: "oneMonth",   label: "1-Month Checkpoints",   icon: "flag",   color: "purple", isCardGrid: false },
];

const levelColors = { northStar: "blue", sixMonth: "amber", threeMonth: "green", oneMonth: "purple" };

function toggleCareerEdit() {
  careerEditMode = !careerEditMode;
  renderGoalsHub();
}

function renderGoalsHub() {
  const container = document.getElementById("cascade-container");
  if (!container) return;

  let html = "";

  // North Star (full width)
  html += renderLevelCard(cascadeLevels[0], 0);

  // Divider
  html += `<div class="border-t border-border"></div>`;

  // Give the checkpoint columns more room and move habits below them.
  html += `<div class="career-blueprint-grid">`;
  for (let i = 1; i < cascadeLevels.length; i++) {
    html += renderLevelCard(cascadeLevels[i], i);
  }
  html += `<div class="career-blueprint-habits">`;
  html += renderLinkedHabits();
  html += `</div>`;
  html += `</div>`;

  container.innerHTML = html;

  // Now populate the dynamic containers
  renderNorthStar();
  renderGoalList("goals-sixMonth-list", appState.goals.sixMonth, "sixMonth");
  renderGoalList("goals-threeMonth-list", appState.goals.threeMonth, "threeMonth");
  renderGoalList("goals-oneMonth-list", appState.goals.oneMonth, "oneMonth");
  renderLinkedHabitsList();

  // Edit button (hide if nothing exists to edit)
  const btn = document.getElementById("career-edit-btn");
  const hasContent = appState.goals.northStar.length > 0
    || appState.goals.sixMonth.length > 0
    || appState.goals.threeMonth.length > 0
    || appState.goals.oneMonth.length > 0
    || appState.goals.linkedHabits.length > 0;
  if (btn) {
    btn.style.display = "";
    if (careerEditMode) {
      btn.className = "btn btn-primary";
      document.getElementById("career-edit-label").textContent = "Done Editing";
      const iconEl = document.querySelector("#career-edit-btn i");
      if (iconEl) iconEl.setAttribute("data-lucide", "check");
    } else {
      btn.className = "btn btn-outline";
      document.getElementById("career-edit-label").textContent = "Edit";
      const iconEl = document.querySelector("#career-edit-btn i");
      if (iconEl) iconEl.setAttribute("data-lucide", "pencil");
    }
  }

  if (typeof renderEmptyStateBanner === "function") renderEmptyStateBanner();
  lucide.createIcons();
}

function renderLevelCard(level, idx) {
  const color = levelColors[level.key] || "text-dim";
  const addBtn = careerEditMode && level.key !== "northStar" ? `<button aria-label="Add checkpoint" class="cascade-add-btn" onclick="openAddGoal('${level.key}')"><i data-lucide="plus" class="w-3 h-3"></i></button>` : "";

  if (level.isCardGrid) {
    return `
      <div class="cascade-card">
        <div class="cascade-card-header">
          <div class="cascade-card-title"><i data-lucide="${level.icon}" class="w-4 h-4 text-${color}"></i><span class="text-${color}">${level.label}</span></div>
          ${addBtn}
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" id="northstar-list"></div>
      </div>`;
  }

  return `
    <div class="cascade-card">
      <div class="cascade-card-header">
        <div class="cascade-card-title"><i data-lucide="${level.icon}" class="w-4 h-4 text-${color}"></i><span class="text-${color}">${level.label}</span></div>
        ${addBtn}
      </div>
      <div class="space-y-2" id="goals-${level.key}-list"></div>
    </div>`;
}

// ─── North Star ───────────────────────────────────────────

const northStarIcons = {
  dream_role: "target", visual_cap: "palette",
  brand_channel: "youtube", identity: "user"
};

function renderNorthStar() {
  const list = document.getElementById("northstar-list");
  if (!list) return;
  list.innerHTML = "";

  appState.goals.northStar.forEach((item, idx) => {
    const card = document.createElement("div");
    if (careerEditMode) {
      card.className = "northstar-card editing";
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <input aria-label="North Star title" type="text" value="${escapeHtml(item.title)}" onchange="updateNorthStar(${idx},'title',this.value)" class="text-xs font-bold bg-transparent text-text border-b border-transparent focus:border-blue py-0.5 flex-1 min-w-0">
          <button aria-label="Close or remove" onclick="deleteNorthStar(${idx})" class="text-red hover:bg-red/10 p-1 rounded shrink-0"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
        <textarea aria-label="North Star description" rows="2" onchange="updateNorthStar(${idx},'description',this.value)" class="text-caption bg-transparent text-text-dim w-full min-w-0 resize-none border border-transparent focus:border-blue rounded px-1 py-0.5 mt-1">${escapeHtml(item.description)}</textarea>
      `;
    } else {
      const done = item.completed;
      card.className = "northstar-card" + (done ? " completed" : "");
      card.innerHTML = `
        <span class="item-heading text-xs font-bold ${done ? 'text-green' : 'text-text'}">${escapeHtml(item.title)}</span>
        <p class="text-caption text-text-dim mt-0.5">${escapeHtml(item.description)}</p>
      `;
    }
    list.appendChild(card);
  });

  if (careerEditMode) {
    const addBtn = document.createElement("button");
    addBtn.className = "northstar-card add-new";
    addBtn.innerHTML = '<span class="text-caption text-text-dim font-bold">+ Add Pillar</span>';
    addBtn.onclick = addNorthStar;
    list.appendChild(addBtn);
  }
  lucide.createIcons();
}

function addNorthStar() {
  appState.goals.northStar.push({ id: "ns_" + Date.now(), title: "New Pillar", description: "Describe this vision pillar", completed: false });
  persistState();
  renderGoalsHub();
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

// ─── Goal Lists (Yearly / 6-Month / 3-Month) ─────────────

function renderGoalList(containerId, goals, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (goals.length === 0 && !careerEditMode) {
    container.innerHTML = '<p class="text-caption text-text-dim italic py-2">No checkpoints set yet. Tap Edit to add one.</p>';
    return;
  }

  goals.forEach((goal, idx) => {
    const daysLeft = calculateDaysRemaining(goal.deadline);
    const overdue = daysLeft.startsWith("Overdue");

    const ns = appState.goals.northStar.find(n => n.id === goal.northStarId);

    const item = document.createElement("div");
    item.className = "cascade-goal-item";

    if (careerEditMode) {
      item.innerHTML = `
        <div class="career-edit-row career-edit-row-top">
          <input aria-label="Checkpoint name" type="text" value="${escapeHtml(goal.name)}" onchange="updateGoalName(${idx},'${type}',this.value)" class="career-edit-name text-xs font-bold bg-transparent text-text border-b border-transparent focus:border-blue py-0.5">
          <button aria-label="Delete" onclick="deleteGoal(${idx},'${type}')" class="text-red hover:bg-red/10 p-1 rounded shrink-0"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
        <div class="career-edit-grid mb-2 text-caption">
          <select aria-label="Checkpoint North Star" onchange="updateGoalNorthStar(${idx},'${type}',this.value)" class="career-edit-select bg-transparent text-text-dim border border-border rounded py-1 px-1">
            <option value="">— North Star —</option>
            ${appState.goals.northStar.map(n => `<option value="${n.id}" ${n.id === goal.northStarId ? 'selected' : ''}>${escapeHtml(n.title)}</option>`).join("")}
          </select>
          <input aria-label="Checkpoint deadline" type="date" value="${escapeHtml(goal.deadline || '')}" onchange="updateGoalDeadline(${idx},'${type}',this.value)" class="career-edit-date bg-transparent text-text-dim border border-border rounded py-1 px-1" style="color-scheme:dark">
        </div>
        <div class="career-edit-progress text-xs">
          <span class="text-text-dim font-bold">Progress:</span>
          <input aria-label="Checkpoint progress" type="number" min="0" max="${goal.target}" value="${goal.progress}" onchange="updateGoalProgress(${idx},'${type}',this.value)" class="career-edit-number text-center font-bold bg-transparent text-text border border-border rounded py-1 px-1">
          <span class="text-text-dim">/ ${goal.target} ${escapeHtml(goal.unit || '')}</span>
        </div>`;
    } else {
      item.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <span class="text-xs font-bold text-text block break-words leading-relaxed">${escapeHtml(goal.name)}</span>
            ${ns ? `<span class="text-caption text-blue/70 whitespace-nowrap">★ ${escapeHtml(ns.title)}</span>` : ''}
          </div>
          <span class="text-caption font-bold shrink-0 ${overdue ? 'text-red' : 'text-text-dim'}">${daysLeft}</span>
        </div>`;
    }
    container.appendChild(item);
  });
}

// ─── Linked Habits ────────────────────────────────────────

function renderLinkedHabits() {
  return `
    <div class="cascade-card">
      <div class="cascade-card-header">
        <div class="cascade-card-title"><i data-lucide="activity" class="w-4 h-4 text-green"></i><span class="text-green">Daily Habits</span></div>
      </div>
      <button class="btn btn-outline mb-3" onclick="openHabitEditor()">Add daily habit</button><div id="linked-habits-list" class="space-y-1.5"></div>
    </div>`;
}

function renderLinkedHabitsList() {
  const container = document.getElementById("linked-habits-list");
  if (!container) return;
  container.innerHTML = "";

  const linkedBlocks = appState.goals.linkedHabits.map(l => {
    const block = appState.settings.scheduleBlocks.find(b => b.id === l.habitId);
    const ns = appState.goals.northStar.find(n => n.id === l.northStarId);
    return { ...l, block, ns };
  }).filter(l => l.block && l.ns);

  if (linkedBlocks.length === 0 && !careerEditMode) {
    container.innerHTML = '<p class="text-caption text-text-dim italic py-2">Link habits to your North Star goals to see them here.</p>';
    return;
  }

  appState.goals.northStar.forEach(ns => {
    const nsLinked = linkedBlocks.filter(l => l.ns.id === ns.id);
    if (nsLinked.length === 0 && !careerEditMode) return;

    const section = document.createElement("div");
    section.className = "mb-3";
    const header = document.createElement("div");
    header.className = "flex items-center gap-1.5 mb-1.5";
    header.innerHTML = `<i data-lucide="star" class="w-3 h-3 text-blue"></i><span class="text-caption font-bold text-blue">${escapeHtml(ns.title)}</span>`;
    section.appendChild(header);

    if (nsLinked.length === 0) {
      const empty = document.createElement("p");
      empty.className = "text-caption text-text-dim/50 italic pl-5";
      empty.textContent = "No habits linked yet.";
      section.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "space-y-1";
      nsLinked.forEach(l => {
        const row = document.createElement("div");
        row.className = `career-habit-row py-1 px-2 rounded hover:bg-white/[0.02]${careerEditMode ? ' editing' : ''}`;
        if (careerEditMode) {
          const nsOptions = appState.goals.northStar.map(n =>
            `<option value="${n.id}" ${n.id === l.northStarId ? 'selected' : ''}>${escapeHtml(n.title)}</option>`
          ).join("");
          row.innerHTML = `<div class="career-habit-meta"><span class="text-xs text-text-dim block">${escapeHtml(l.block.name)}</span><button class="btn btn-outline" onclick="openHabitEditor('${l.block.id}')">Edit habit</button></div>
            <div class="career-habit-controls">
              <select aria-label="Habit North Star" onchange="linkHabit('${l.block.id}', this.value);renderLinkedHabitsList()" class="career-habit-select text-caption bg-transparent border border-border rounded py-0.5 px-1">
                <option value="">— Not linked —</option>
                ${nsOptions}
              </select>
            </div>`;
        } else {
          row.innerHTML = `<div class="career-habit-meta"><span class="text-xs text-text-dim block">${escapeHtml(l.block.name)}</span>${l.block.time ? `<span class="text-caption text-text-dim/60">${escapeHtml(l.block.time)}</span>` : ''}</div>`;
        }
        list.appendChild(row);
      });
      section.appendChild(list);
    }
    container.appendChild(section);
  });

  if (careerEditMode) {
    const unlinked = appState.settings.scheduleBlocks.filter(b =>
      !appState.goals.linkedHabits.some(l => l.habitId === b.id)
    );
    if (unlinked.length > 0) {
      const section = document.createElement("div");
      section.className = "mt-3 pt-2 border-t border-border/50";
      const header = document.createElement("div");
      header.className = "flex items-center gap-1.5 mb-1.5";
      header.innerHTML = `<span class="text-caption font-bold text-text-dim/60">Available Habits</span>`;
      section.appendChild(header);
      unlinked.forEach(block => {
        const row = document.createElement("div");
        row.className = "career-habit-row py-1.5 px-2 rounded hover:bg-white/[0.02] editing";
        const nsOptions = appState.goals.northStar.map(n =>
          `<option value="${n.id}">${escapeHtml(n.title)}</option>`
        ).join("");
        row.innerHTML = `<div class="career-habit-meta"><span class="text-xs text-text-dim block">${escapeHtml(block.name)}</span><button class="btn btn-outline" onclick="openHabitEditor('${block.id}')">Edit habit</button></div>
          <div class="career-habit-controls">
            <select aria-label="Habit North Star" onchange="linkHabit('${block.id}', this.value);renderLinkedHabitsList()" class="career-habit-select text-caption bg-transparent border border-border rounded py-0.5 px-1">
              <option value="">— Link to North Star —</option>
              ${nsOptions}
            </select>
          </div>`;
        section.appendChild(row);
      });
      container.appendChild(section);
    }
  }

  lucide.createIcons();
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
