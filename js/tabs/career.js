// ============================================================
//  🎯 Life OS — Career & Goals Tab
//  ============================================================
//  Goal cascade: North Star → 6-Month → 3-Month → Habits
//  Edit-mode toggle for managing all levels.
// ============================================================

let careerEditMode = false;

const cascadeLevels = [
  { key: "northStar",  label: "North Star",       icon: "star",       color: "blue",     isCardGrid: true },
  { key: "sixMonth",   label: "6-Month Goals",     icon: "calendar",   color: "amber",    isCardGrid: false },
  { key: "threeMonth", label: "3-Month Goals",     icon: "target",     color: "green",    isCardGrid: false },
];

const levelColors = { northStar: "blue", sixMonth: "amber", threeMonth: "green" };

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
  renderLinkedHabitsList();

  // Edit button
  const btn = document.getElementById("career-edit-btn");
  const label = document.getElementById("career-edit-label");
  const icon = document.getElementById("career-edit-icon");
  const iconEl = document.querySelector("#career-edit-btn i");
  if (btn) {
    if (careerEditMode) {
      btn.className = "btn btn-primary";
      label.textContent = "Done Editing";
      if (iconEl) iconEl.setAttribute("data-lucide", "check");
    } else {
      btn.className = "btn btn-outline";
      label.textContent = "Edit";
      if (iconEl) iconEl.setAttribute("data-lucide", "pencil");
    }
  }

  lucide.createIcons();
}

function renderLevelCard(level, idx) {
  const color = levelColors[level.key] || "text-dim";
  const addBtn = careerEditMode && level.key !== "northStar" ? `<button class="cascade-add-btn" onclick="openAddGoal('${level.key}')"><i data-lucide="plus" class="w-3 h-3"></i></button>` : "";

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
          <input type="text" value="${item.title}" onchange="updateNorthStar(${idx},'title',this.value)" class="text-xs font-bold bg-transparent text-text border-b border-transparent focus:border-blue py-0.5 flex-1 min-w-0">
          <button onclick="deleteNorthStar(${idx})" class="text-red hover:bg-red/10 p-1 rounded shrink-0"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
        <textarea rows="2" onchange="updateNorthStar(${idx},'description',this.value)" class="text-[10px] bg-transparent text-text-dim w-full min-w-0 resize-none border border-transparent focus:border-blue rounded px-1 py-0.5 mt-1">${item.description}</textarea>
      `;
    } else {
      const done = item.completed;
      card.className = "northstar-card" + (done ? " completed" : "");
      card.innerHTML = `
        <span class="text-xs font-bold ${done ? 'text-green' : 'text-text'}">${item.title}</span>
        <p class="text-[10px] text-text-dim mt-0.5">${item.description}</p>
      `;
    }
    list.appendChild(card);
  });

  if (careerEditMode) {
    const addBtn = document.createElement("button");
    addBtn.className = "northstar-card add-new";
    addBtn.innerHTML = '<span class="text-[10px] text-text-dim font-bold">+ Add Pillar</span>';
    addBtn.onclick = addNorthStar;
    list.appendChild(addBtn);
  }
  lucide.createIcons();
}

function addNorthStar() {
  appState.goals.northStar.push({ id: "ns_" + Date.now(), title: "New Pillar", description: "Describe this vision pillar", completed: false });
  saveStateLocally();
  renderGoalsHub();
}

function updateNorthStar(idx, field, val) {
  appState.goals.northStar[idx][field] = val;
  saveStateLocally();
}

function deleteNorthStar(idx) {
  if (!confirm(`Delete "${appState.goals.northStar[idx].title}"?`)) return;
  appState.goals.northStar.splice(idx, 1);
  saveStateLocally();
  renderGoalsHub();
}

// ─── Goal Lists (Yearly / 6-Month / 3-Month) ─────────────

function renderGoalList(containerId, goals, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (goals.length === 0 && !careerEditMode) {
    container.innerHTML = '<p class="text-[10px] text-text-dim italic py-2">No goals set yet. Tap Edit to add one.</p>';
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
          <input type="text" value="${goal.name}" onchange="updateGoalName(${idx},'${type}',this.value)" class="career-edit-name text-xs font-bold bg-transparent text-text border-b border-transparent focus:border-blue py-0.5">
          <button onclick="deleteGoal(${idx},'${type}')" class="text-red hover:bg-red/10 p-1 rounded shrink-0"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
        <div class="career-edit-grid mb-2 text-[9px]">
          <select onchange="updateGoalNorthStar(${idx},'${type}',this.value)" class="career-edit-select bg-transparent text-text-dim border border-border rounded py-1 px-1">
            <option value="">— North Star —</option>
            ${appState.goals.northStar.map(n => `<option value="${n.id}" ${n.id === goal.northStarId ? 'selected' : ''}>${n.title}</option>`).join("")}
          </select>
          <input type="date" value="${goal.deadline || ''}" onchange="updateGoalDeadline(${idx},'${type}',this.value)" class="career-edit-date bg-transparent text-text-dim border border-border rounded py-1 px-1" style="color-scheme:dark">
        </div>
        <div class="career-edit-progress text-xs">
          <span class="text-text-dim font-bold">Progress:</span>
          <input type="number" min="0" max="${goal.target}" value="${goal.progress}" onchange="updateGoalProgress(${idx},'${type}',this.value)" class="career-edit-number text-center font-bold bg-transparent text-text border border-border rounded py-1 px-1">
          <span class="text-text-dim">/ ${goal.target} ${goal.unit || ''}</span>
        </div>`;
    } else {
      item.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <span class="text-xs font-bold text-text block break-words leading-relaxed">${goal.name}</span>
            ${ns ? `<span class="text-[9px] text-blue/70 whitespace-nowrap">★ ${ns.title}</span>` : ''}
          </div>
          <span class="text-[9px] font-bold shrink-0 ${overdue ? 'text-red' : 'text-text-dim'}">${daysLeft}</span>
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
        <div class="cascade-card-title"><i data-lucide="activity" class="w-4 h-4 text-green"></i><span class="text-green">Daily Habits Supporting These Goals</span></div>
      </div>
      <div id="linked-habits-list" class="space-y-1.5"></div>
    </div>`;
}

function renderLinkedHabitsList() {
  const container = document.getElementById("linked-habits-list");
  if (!container) return;
  container.innerHTML = "";

  appState.settings.scheduleBlocks.forEach(block => {
    const link = appState.goals.linkedHabits.find(l => l.habitId === block.id);
    const linkedNsId = link?.northStarId || "";
    const ns = appState.goals.northStar.find(n => n.id === linkedNsId);
    const row = document.createElement("div");
    row.className = `career-habit-row py-1.5 px-2 rounded hover:bg-white/[0.02]${careerEditMode ? ' editing' : ''}`;

    let rightHtml = '<span class="text-[9px] text-text-dim/50 italic">Not linked</span>';
    if (ns) {
      rightHtml = `<span class="text-[9px] font-bold text-blue">★ ${ns.title}</span>`;
    }

    if (careerEditMode) {
      const nsOptions = appState.goals.northStar.map(n =>
        `<option value="${n.id}" ${n.id === linkedNsId ? 'selected' : ''}>${n.title}</option>`
      ).join("");
      rightHtml = `<input type="text" value="${block.time || ''}" placeholder="e.g. 04:00 AM" onchange="updateBlockTime('${block.id}', this.value)" class="career-habit-time text-[9px] bg-transparent text-text-dim border border-border rounded py-0.5 px-1">
        <select onchange="linkHabit('${block.id}', this.value)" class="career-habit-select text-[9px] bg-transparent border border-border rounded py-0.5 px-1">
          <option value="">— Not linked —</option>
          ${nsOptions}
        </select>`;
    }

    row.innerHTML = `<div class="career-habit-meta"><span class="text-xs text-text-dim block">${block.name}</span>${block.time && !careerEditMode ? `<span class="text-[9px] text-text-dim/60">${block.time}</span>` : ''}</div><div class="career-habit-controls">${rightHtml}</div>`;
    container.appendChild(row);
  });
}

function updateBlockTime(blockId, val) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (block) { block.time = val; saveStateLocally(); pushToCloud(); }
}

function linkHabit(habitId, northStarId) {
  const existing = appState.goals.linkedHabits.findIndex(l => l.habitId === habitId);
  if (existing >= 0) {
    if (northStarId) appState.goals.linkedHabits[existing].northStarId = northStarId;
    else appState.goals.linkedHabits.splice(existing, 1);
  } else if (northStarId) {
    appState.goals.linkedHabits.push({ habitId, northStarId });
  }
  saveStateLocally();
}

// ─── Goal CRUD ────────────────────────────────────────────

function openAddGoal(level) {
  const nsSelect = document.getElementById("goal-form-northstar");
  nsSelect.innerHTML = '<option value="">— Not linked —</option>' + appState.goals.northStar.map(n => `<option value="${n.id}">${n.title}</option>`).join("");
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
  const valid = name && target && deadline;
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
  if (!name || !deadline) return;

  const goal = { id: "g_" + Date.now(), name, progress: 0, target, unit, deadline, northStarId, completed: false };
  if (type === "yearly") appState.goals.yearly.push(goal);
  else if (type === "sixMonth") appState.goals.sixMonth.push(goal);
  else if (type === "threeMonth") appState.goals.threeMonth.push(goal);

  saveStateLocally();
  pushToCloud();
  closeAddGoalModal();
  renderGoalsHub();
}

function updateGoalProgress(idx, type, val) {
  const goals = type === "yearly" ? appState.goals.yearly : type === "sixMonth" ? appState.goals.sixMonth : appState.goals.threeMonth;
  const prev = goals[idx].progress;
  goals[idx].progress = Number(val);
  if (prev < goals[idx].target && goals[idx].progress >= goals[idx].target) celebrate();
  saveStateLocally();
  pushToCloud();
}

function updateGoalName(idx, type, val) {
  const goals = type === "yearly" ? appState.goals.yearly : type === "sixMonth" ? appState.goals.sixMonth : appState.goals.threeMonth;
  goals[idx].name = val;
  saveStateLocally();
}

function updateGoalDeadline(idx, type, val) {
  const goals = type === "yearly" ? appState.goals.yearly : type === "sixMonth" ? appState.goals.sixMonth : appState.goals.threeMonth;
  goals[idx].deadline = val;
  saveStateLocally();
}

function updateGoalNorthStar(idx, type, val) {
  const goals = type === "yearly" ? appState.goals.yearly : type === "sixMonth" ? appState.goals.sixMonth : appState.goals.threeMonth;
  goals[idx].northStarId = val;
  saveStateLocally();
}

function deleteGoal(idx, type) {
  const goals = type === "yearly" ? appState.goals.yearly : type === "sixMonth" ? appState.goals.sixMonth : appState.goals.threeMonth;
  if (!confirm(`Delete "${goals[idx].name}"?`)) return;
  goals.splice(idx, 1);
  saveStateLocally();
  pushToCloud();
  renderGoalsHub();
}
