// ============================================================
//  📊 Life OS — Checkpoint & Deadline Management
//  ============================================================
//  Extracted from execution.js to reduce file size.
//  Handles deadline display and checkpoint completion flow.
// ============================================================

let pendingCheckpointCompletion = null;

function updateMetricCard(valueId, barId, count, target) {
  const valEl = document.getElementById(valueId);
  const barEl = document.getElementById(barId);
  if (valEl) valEl.textContent = `${count} / ${target}`;
  if (barEl) barEl.style.width = `${Math.min((count / target) * 100, 100)}%`;
}

function renderTodayDeadlines() {
  const container = document.getElementById("today-deadlines-container");
  if (!container) return;

  const dateStr = trackerDate;
  const due = getGoalsDueOnDate(dateStr);
  const upcoming = getUpcomingDeadlines(dateStr, 60);

  if (due.length === 0 && upcoming.length === 0) {
    container.classList.add("hidden");
    return;
  }

  if (due.length === 0 && appState.settings.upcomingHidden) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  container.className = "card space-y-3";

  let html = "";

  if (due.length > 0) {
    html += `<div class="flex items-center gap-2 text-amber text-xs font-bold mb-2"><i data-lucide="calendar-clock" class="w-3.5 h-3.5"></i>Due Today</div><div class="space-y-2">`;
    due.forEach(g => {
      const done = !!g.completed;
      html += makeCheckpointDeadlineRow(g, done, done ? "✓ Done" : "Due today");
    });
    html += `</div>`;
  }

  if (upcoming.length > 0 && !appState.settings.upcomingHidden) {
    if (due.length > 0) html += `<div class="border-t border-border pt-3 mt-1"></div>`;
    html += `<div class="flex items-center justify-between">
      <div class="card-header text-blue !border-0 !p-0 !m-0"><i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1"></i>Upcoming Checkpoints</div>
      <button onclick="dismissUpcoming()" class="text-text-dim/50 hover:text-text p-1" title="Hide"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    </div>
    <div class="space-y-2">`;
    upcoming.forEach(g => {
      const done = !!g.completed;
      const daysFromNow = Math.ceil((new Date(g.deadline) - new Date(dateStr)) / 86400000);
      const label = done ? "✓ Done" : `Due in ${daysFromNow}d`;
      html += makeCheckpointDeadlineRow(g, done, label);
    });
    html += `</div>`;
  }

  if (upcoming.length > 0 && appState.settings.upcomingHidden && due.length > 0) {
    html += `<button onclick="showUpcoming()" class="text-[9px] text-blue/60 hover:text-blue font-bold mt-1">Show upcoming checkpoints</button>`;
  }

  container.innerHTML = html;
  lucide.createIcons();
}

function makeCheckpointDeadlineRow(g, done, badge) {
  return `
    <div class="flex items-center justify-between gap-3 py-3 px-3 rounded-xl bg-[rgba(255,255,255,0.02)] border ${done ? 'border-green/30 bg-green/[0.04]' : 'border-border'}">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-full ${done ? 'bg-green/[0.16]' : 'bg-white/[0.04]'} border ${done ? 'border-green/30' : 'border-border'} flex items-center justify-center shrink-0">
          <i data-lucide="${done ? 'check-check' : 'flag'}" class="w-4 h-4 ${done ? 'text-green' : 'text-blue'}"></i>
        </div>
        <div>
          <span class="text-xs font-bold ${done ? 'text-green' : 'text-text'}">${g.name}</span>
          <span class="text-[9px] text-text-dim block">${g.progress}/${g.target} ${g.unit || ''} · ${g.typeLabel}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[9px] font-bold ${done ? 'text-green' : 'text-text-dim'}">${badge || (done ? '✓ Done' : 'Pending')}</span>
        <button onclick="${done ? `toggleGoalDeadline('${g.type}','${g.id}',false)` : `openCheckpointCompleteModal('${g.type}','${g.id}')`}" class="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors ${done ? 'bg-green/15 text-green border-green/30 hover:bg-green/20' : 'bg-blue/[0.08] text-blue border-blue/20 hover:bg-blue/[0.14]'}">
          ${done ? 'Completed' : 'Mark complete'}
        </button>
      </div>
    </div>`;
}

function getGoalsDueOnDate(dateStr) {
  const result = [];
  GOAL_LEVELS.forEach(level => {
    (appState.goals[level.key] || []).forEach(g => {
      if (g.deadline === dateStr) {
        result.push({ ...g, type: level.key, typeLabel: level.label });
      }
    });
  });
  return result;
}

function getUpcomingDeadlines(fromDate, daysAhead) {
  const result = [];
  const from = new Date(fromDate);
  const until = new Date(from);
  until.setDate(until.getDate() + daysAhead);
  GOAL_LEVELS.forEach(level => {
    (appState.goals[level.key] || []).forEach(g => {
      if (!g.deadline) return;
      const d = new Date(g.deadline);
      if (d > from && d <= until && g.deadline !== fromDate) {
        result.push({ ...g, type: level.key, typeLabel: level.label });
      }
    });
  });
  result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  return result;
}

function dismissUpcoming() {
  appState.settings.upcomingHidden = true;
  persistState();
  renderToday();
}

function showUpcoming() {
  appState.settings.upcomingHidden = false;
  persistState();
  renderToday();
}

function toggleGoalDeadline(type, id, checked) {
  const goals = appState.goals[type];
  if (!goals) return;
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  goal.completed = checked;
  persistState();
  renderToday();
  if (typeof renderGoalsHub === "function") renderGoalsHub();
  if (typeof renderReview === "function") renderReview();
}

function openCheckpointCompleteModal(type, id) {
  pendingCheckpointCompletion = { type, id };
  const modal = document.getElementById("checkpoint-complete-modal");
  const input = document.getElementById("checkpoint-complete-input");
  const msg = document.getElementById("checkpoint-complete-msg");
  const title = document.getElementById("checkpoint-complete-title");
  const goal = (appState.goals[type] || []).find(g => g.id === id);
  if (!modal || !input) return;
  if (title) title.textContent = goal ? goal.name : "Complete Checkpoint";
  input.value = "";
  if (msg) msg.textContent = "";
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  setTimeout(() => input.focus(), 0);
}

function closeCheckpointCompleteModal() {
  pendingCheckpointCompletion = null;
  const modal = document.getElementById("checkpoint-complete-modal");
  const input = document.getElementById("checkpoint-complete-input");
  const msg = document.getElementById("checkpoint-complete-msg");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
  if (input) input.value = "";
  if (msg) msg.textContent = "";
}

function submitCheckpointComplete() {
  const input = document.getElementById("checkpoint-complete-input");
  const msg = document.getElementById("checkpoint-complete-msg");
  if (!input || !pendingCheckpointCompletion) return;
      const normalized = input.value.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized !== CHECKPOINT_CONFIRM_TEXT) {
    if (msg) {
      msg.className = "text-xs font-semibold text-red";
      msg.textContent = `Type "${CHECKPOINT_CONFIRM_TEXT}" exactly to continue.`;
    }
    return;
  }
  toggleGoalDeadline(pendingCheckpointCompletion.type, pendingCheckpointCompletion.id, true);
  closeCheckpointCompleteModal();
  celebrate();
}

function renderAllGoalsCountdown() {
  const container = document.getElementById("today-goals-countdown");
  const body = document.getElementById("goals-countdown-body");
  const toggleBtn = document.getElementById("toggle-all-goals-btn");
  if (!container || !body) return;

  const dateStr = trackerDate || getLocalDateString();
  const today = new Date(dateStr);

  const all = [];
  GOAL_LEVELS.forEach(l => {
    (appState.goals[l.key] || []).forEach(g => {
      if (g.deadline) all.push({ ...g, type: l.key });
    });
  });
  if (!all.length) { container.classList.add("hidden"); return; }
  container.classList.remove("hidden");

  all.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const showAll = appState.settings.goalsCountdownCollapsed;
  const filtered = showAll ? all : all.filter(g => {
    const diff = Math.ceil((new Date(g.deadline) - today) / 86400000);
    return diff >= 0 && diff <= 20;
  });

  if (toggleBtn) {
    toggleBtn.textContent = showAll ? "Show less" : "View all goals";
  }

  let html = "";
  filtered.forEach(g => {
    const diff = Math.ceil((new Date(g.deadline) - today) / 86400000);
    const done = !!g.completed;
    let accent;
    if (done) accent = "text-green";
    else if (diff < 0) accent = "text-red";
    else if (diff <= 7) accent = "text-amber";
    else accent = "text-text-dim";

    html += `<div class="border ${done ? 'border-green/30 bg-green/[0.04]' : 'border-border bg-[rgba(255,255,255,0.02)]'} rounded-[14px] px-[14px] py-5 flex flex-col justify-between gap-3 min-h-[148px]">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[9px] uppercase tracking-[0.18em] font-bold ${done ? 'text-green/80' : 'text-text-dim/60'}">${g.type === 'sixMonth' ? '6-Month' : g.type === 'threeMonth' ? '3-Month' : '1-Month'}</span>
          <span class="text-[11px] ${accent}/80 font-bold">${done ? 'Completed' : diff < 0 ? Math.abs(diff) + 'd overdue' : diff + 'd left'}</span>
        </div>
        <div class="text-sm font-bold ${done ? 'text-green' : 'text-text'} leading-snug">${g.name}</div>
        <div class="text-[11px] text-text-dim">${g.progress}/${g.target} ${g.unit || ''}</div>
      </div>
      <button onclick="${done ? `toggleGoalDeadline('${g.type}','${g.id}',false)` : `openCheckpointCompleteModal('${g.type}','${g.id}')`}" class="w-full text-[10px] font-bold px-3 py-2 rounded-full border transition-colors ${done ? 'bg-green/15 text-green border-green/30 hover:bg-green/20' : 'bg-blue/[0.08] text-blue border-blue/20 hover:bg-blue/[0.14]'}">
        ${done ? 'Completed checkpoint' : 'Complete checkpoint'}
      </button>
    </div>`;
  });

  body.innerHTML = html;
}

function toggleAllGoals() {
  appState.settings.goalsCountdownCollapsed = !appState.settings.goalsCountdownCollapsed;
  persistState();
  renderAllGoalsCountdown();
}
