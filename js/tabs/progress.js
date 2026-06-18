// ============================================================
//  📊 Life OS — Review Tab
//  ============================================================
//  Combined weekly & monthly review: period selector, calendar
//  grid, day details panel, goal-vs-actual metric cards.
// ============================================================

function setReviewTab(tab) {
  reviewTab = tab;
  if (tab === "weekly" || tab === "monthly") reviewMode = tab;
  ["weekly", "monthly", "cascade"].forEach(t => {
    const btn = document.getElementById("review-tab-" + t);
    if (btn) btn.className = `text-[10px] px-3 py-1.5 rounded font-bold ${t === tab ? "bg-green/15 text-green" : "text-text-dim hover:text-text"}`;
  });
  renderReview();
}

function shiftReviewWeek(dir) {
  const d = new Date(getWeekStartDate(reviewWeekId));
  d.setDate(d.getDate() + dir * 7);
  reviewWeekId = getWeekID(d.toISOString().split('T')[0]);
  reviewMonth = d.getMonth();
  reviewYear = d.getFullYear();
  renderReview();
}

function shiftReviewMonth(dir) {
  reviewMonth += dir;
  if (reviewMonth > 11) { reviewMonth = 0; reviewYear++; }
  else if (reviewMonth < 0) { reviewMonth = 11; reviewYear--; }
  const firstOfMonth = `${reviewYear}-${String(reviewMonth + 1).padStart(2,'0')}-01`;
  reviewWeekId = getWeekID(firstOfMonth);
  renderReview();
}

function renderReview() {
  const container = document.getElementById("review-calendar-days-container");
  const periodSelector = document.getElementById("review-period-selector");
  if (!periodSelector) return;

  const isPeriodView = reviewTab === "weekly" || reviewTab === "monthly";

  // Period selector visibility
  periodSelector.style.display = isPeriodView ? "" : "none";

  // Show/hide sections
  const metricsSection = document.getElementById("review-metrics-section");
  const calendarSection = document.getElementById("review-calendar-section");
  const cascadeCard = document.getElementById("review-cascade-card");

  if (metricsSection) metricsSection.classList.toggle("hidden", !isPeriodView);
  if (calendarSection) calendarSection.classList.toggle("hidden", !isPeriodView);
  if (cascadeCard) cascadeCard.classList.toggle("hidden", isPeriodView);

  if (isPeriodView) {
    if (!container) return;

    if (reviewTab === "weekly") {
      const monday = new Date(getWeekStartDate(reviewWeekId));
      const weekLabel = `${formatDateLabelShort(monday.toISOString().split('T')[0])} - ${formatDateLabelShort(getWeekDates(monday.toISOString().split('T')[0])[6])}`;
      periodSelector.innerHTML = `
        <button onclick="shiftReviewWeek(-1)" class="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
        <span class="text-[11px] font-bold px-2 text-center w-32 select-none">${weekLabel}</span>
        <button onclick="shiftReviewWeek(1)" class="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
      `;
    } else {
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      periodSelector.innerHTML = `
        <button onclick="shiftReviewMonth(-1)" class="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
        <span class="text-[11px] font-bold px-2 text-center w-28 select-none">${months[reviewMonth]} ${reviewYear}</span>
        <button onclick="shiftReviewMonth(1)" class="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
      `;
    }
    lucide.createIcons();

    const todayStr = getLocalDateString();
    container.innerHTML = "";

    if (reviewTab === "weekly") {
      const weekDates = getWeekDates(getWeekStartDate(reviewWeekId));
      weekDates.forEach(dStr => {
        const dayNum = new Date(dStr).getDate();
        const completionRate = getLoggedCompletionRate(dStr);
        const cell = document.createElement("div");
        cell.className = "calendar-day-cell";
        if (dStr === todayStr) cell.classList.add("today");

        let bgStyle = "";
        if (completionRate > 0) {
          if (completionRate >= 0.75) bgStyle = "background:rgba(34,211,160,0.2);border-color:rgba(34,211,160,0.4)";
          else bgStyle = "background:rgba(34,211,160,0.08);border-color:rgba(34,211,160,0.2)";
        }
        cell.innerHTML = `<span class="day-number ${dStr === todayStr ? 'text-blue' : ''}">${dayNum}</span>`;
        if (bgStyle) cell.setAttribute("style", bgStyle);
        cell.onclick = () => {
          renderReviewDayDetails(dStr);
          document.querySelectorAll("#review-calendar-days-container .calendar-day-cell").forEach(c => c.classList.remove("selected"));
          cell.classList.add("selected");
        };
        container.appendChild(cell);
      });
    } else {
      const year = reviewYear, month = reviewMonth;
      const firstDay = new Date(year, month, 1).getDay();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const prevMonthTotalDays = new Date(year, month, 0).getDate();

      for (let i = firstDay - 1; i >= 0; i--) {
        const cell = document.createElement("div");
        cell.className = "calendar-day-cell inactive";
        cell.innerHTML = `<span class="text-[9px] text-text-dim/40">${prevMonthTotalDays - i}</span>`;
        container.appendChild(cell);
      }

      for (let i = 1; i <= totalDays; i++) {
        const cellDateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const completionRate = getLoggedCompletionRate(cellDateStr);
        const cell = document.createElement("div");
        cell.className = "calendar-day-cell";
        if (cellDateStr === todayStr) cell.classList.add("today");

        let bgStyle = "";
        if (completionRate > 0) {
          if (completionRate >= 0.75) bgStyle = "background:rgba(34,211,160,0.2);border-color:rgba(34,211,160,0.4)";
          else bgStyle = "background:rgba(34,211,160,0.08);border-color:rgba(34,211,160,0.2)";
        }

        const deadlinesCount = getDeadlinesForDate(cellDateStr).length;
        cell.innerHTML = `<div class="flex justify-between items-start w-full"><span class="day-number ${cellDateStr === todayStr ? 'text-blue' : ''}">${i}</span>${deadlinesCount > 0 ? '<span class="w-1.5 h-1.5 rounded-full bg-red mt-1" title="Checkpoint due"></span>' : ''}</div>`;
        if (bgStyle) cell.setAttribute("style", bgStyle);

        cell.onclick = () => {
          renderReviewDayDetails(cellDateStr);
          document.querySelectorAll("#review-calendar-days-container .calendar-day-cell").forEach(c => c.classList.remove("selected"));
          cell.classList.add("selected");
        };
        container.appendChild(cell);
      }
    }

    renderReviewDayDetails(trackerDate);
    renderReviewMetrics();
  }

  renderCascadeImpact();
}

function renderReviewMetrics() {
  const container = document.getElementById("review-metrics-container");
  if (!container) return;
  container.innerHTML = "";

  let dates = [];
  if (reviewMode === "weekly") {
    dates = getWeekDates(getWeekStartDate(reviewWeekId));
  } else {
    const daysInMonth = new Date(reviewYear, reviewMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(`${reviewYear}-${String(reviewMonth + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`);
    }
  }

  const multiplier = reviewMode === "monthly" ? Math.ceil(dates.length / 7) : 1;

  if (getLinkedBlocks().length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-center col-span-full">
        <i data-lucide="map" class="w-8 h-8 text-text-dim/30 mb-2"></i>
        <p class="text-xs font-bold text-text-dim mb-1">No habits linked yet</p>
        <p class="text-[10px] text-text-dim/60">Link habits to your North Stars on the Blueprint page.</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  getLinkedBlocks().forEach(b => {
    const target = getBlockWeeklyTarget(b.id) * multiplier;
    const actual = getBlockActual(b.id, dates);
    const pct = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <i data-lucide="activity" class="w-3.5 h-3.5 text-text-dim shrink-0"></i>
        <span class="label">${b.name}</span>
      </div>
      <div class="value ${pct >= 100 ? 'text-green' : pct >= 50 ? 'text-amber' : 'text-red'}">${formatBlockActual(b.id, actual)} / ${formatBlockTarget(b.id, target)}</div>
      <div class="progress-bar mt-1.5">
        <div class="progress-bar-fill ${pct >= 100 ? 'bg-green' : pct >= 50 ? 'bg-amber' : 'bg-red'}" style="width:${pct}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
  lucide.createIcons();
}

function getPeriodDates() {
  if (reviewMode === "weekly") return getWeekDates(getWeekStartDate(reviewWeekId));
  const daysInMonth = new Date(reviewYear, reviewMonth + 1, 0).getDate();
  const dates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(`${reviewYear}-${String(reviewMonth + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`);
  }
  return dates;
}

function getHabitCompletionInPeriod(blockId, dates) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (!block) return 0;
  let completed = 0;
  dates.forEach(dStr => {
    if (isBlockCompleted(block, appState.logs[dStr]?.[blockId])) completed++;
  });
  return completed;
}

function getGoalsByNorthStar(northStarId) {
  const levels = [
    { key: "sixMonth", label: "6-Month" },
    { key: "threeMonth", label: "3-Month" },
    { key: "oneMonth", label: "1-Month" }
  ];
  const result = [];
  levels.forEach(l => {
    (appState.goals[l.key] || []).forEach(g => {
      if (g.northStarId === northStarId) {
        result.push({ ...g, levelKey: l.key, levelLabel: l.label });
      }
    });
  });
  return result;
}

function getConfiguredCheckpoints() {
  const levels = [
    { key: "sixMonth", label: "6-Month" },
    { key: "threeMonth", label: "3-Month" },
    { key: "oneMonth", label: "1-Month" }
  ];
  const checkpoints = [];
  levels.forEach(level => {
    (appState.goals[level.key] || []).forEach(goal => {
      const northStar = appState.goals.northStar.find(n => n.id === goal.northStarId);
      checkpoints.push({
        ...goal,
        levelLabel: level.label,
        northStarTitle: northStar?.title || "Unlinked"
      });
    });
  });
  return checkpoints.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

let pendingNorthStarReviewCompletion = null;

function openNorthStarReviewModal(id) {
  pendingNorthStarReviewCompletion = id;
  const modal = document.getElementById("northstar-review-complete-modal");
  const input = document.getElementById("northstar-review-complete-input");
  const msg = document.getElementById("northstar-review-complete-msg");
  const title = document.getElementById("northstar-review-complete-title");
  const northStar = appState.goals.northStar.find(n => n.id === id);
  if (!modal || !input) return;
  if (title) title.textContent = northStar ? northStar.title : "Complete North Star";
  input.value = "";
  if (msg) msg.textContent = "";
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  setTimeout(() => input.focus(), 0);
}

function closeNorthStarReviewModal() {
  pendingNorthStarReviewCompletion = null;
  const modal = document.getElementById("northstar-review-complete-modal");
  const input = document.getElementById("northstar-review-complete-input");
  const msg = document.getElementById("northstar-review-complete-msg");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
  if (input) input.value = "";
  if (msg) msg.textContent = "";
}

function toggleNorthStarReviewComplete(id, completed) {
  const northStar = appState.goals.northStar.find(n => n.id === id);
  if (!northStar) return;
  northStar.completed = completed;
  persistState();
  renderReview();
  if (typeof renderGoalsHub === "function") renderGoalsHub();
}

function submitNorthStarReviewComplete() {
  const input = document.getElementById("northstar-review-complete-input");
  const msg = document.getElementById("northstar-review-complete-msg");
  if (!input || !pendingNorthStarReviewCompletion) return;
  const normalized = input.value.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized !== "yea boi") {
    if (msg) {
      msg.className = "text-xs font-semibold text-red";
      msg.textContent = 'Type "yea boi" exactly to continue.';
    }
    return;
  }
  toggleNorthStarReviewComplete(pendingNorthStarReviewCompletion, true);
  closeNorthStarReviewModal();
  celebrate();
}

function renderCascadeImpact() {
  const container = document.getElementById("review-cascade-container");
  if (!container) return;
  container.innerHTML = "";

  const dates = getPeriodDates();
  const daysInPeriod = dates.length;
  const pillars = appState.goals.northStar;

  if (pillars.length === 0) {
    container.innerHTML = '<p class="text-xs text-text-dim italic">No North Star pillars defined. Set them up in Career tab.</p>';
    return;
  }

  function dotColor(habitId, dStr) {
    const block = appState.settings.scheduleBlocks.find(b => b.id === habitId);
    if (!block) return "bg-white/[0.04]";
    return isBlockCompleted(block, appState.logs[dStr]?.[habitId]) ? "bg-green" : "bg-white/[0.04]";
  }

  const checkpoints = getConfiguredCheckpoints();
  const completedCheckpoints = checkpoints.filter(c => c.completed).length;

  let html = "";
  html += `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">`;

  pillars.forEach(pillar => {
    const goals = getGoalsByNorthStar(pillar.id);
    const linkedHabits = appState.goals.linkedHabits.filter(l => l.northStarId === pillar.id);
    const goalPcts = goals.map(g => g.completed ? 100 : (g.target > 0 ? Math.min(Math.round((g.progress / g.target) * 100), 100) : 0));
    const avgPct = goalPcts.length > 0 ? Math.round(goalPcts.reduce((a, b) => a + b, 0) / goalPcts.length) : 0;
    const avgCls = avgPct >= 80 ? "text-green" : avgPct >= 50 ? "text-amber" : "text-text-dim";

    html += `<div class="border border-border rounded-xl p-4 bg-[rgba(255,255,255,0.015)] space-y-4 min-h-[320px] flex flex-col ${pillar.completed ? 'border-green/30 bg-green/[0.02]' : ''}">`;

    html += `<div class="flex items-center justify-between border-b border-border pb-3">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full ${pillar.completed ? 'bg-green/[0.15]' : 'bg-blue/[0.12]'} flex items-center justify-center">${pillar.completed ? '<i data-lucide="check" class="w-3.5 h-3.5 text-green"></i>' : '<i data-lucide="star" class="w-3.5 h-3.5 text-blue"></i>'}</div>
        <span class="text-[11px] font-bold ${pillar.completed ? 'text-green' : 'text-text'}">${pillar.title}</span>
      </div>
      <span class="text-[8px] font-bold ${pillar.completed ? 'text-green' : avgCls}">${pillar.completed ? '✓ Done' : avgPct + '%'}</span>
    </div>`;

    if (goals.length === 0 && linkedHabits.length === 0) {
      html += '<p class="text-[10px] text-text-dim italic flex-1">No links yet.</p>';
    }

    if (goals.length > 0) {
      html += `<div class="flex-1 space-y-3">`;
      goals.forEach(g => {
        const done = !!g.completed;
        const pct = done ? 100 : (g.target > 0 ? Math.min(Math.round((g.progress / g.target) * 100), 100) : 0);
        const hexClr = done ? "#22d3a0" : pct >= 50 ? "#f59e0b" : "#f87171";
        const txtCls = done ? "text-green" : pct >= 50 ? "text-amber" : "text-red";
        const days = calculateDaysRemaining(g.deadline);
        html += `<div class="flex items-center gap-3">
          <div class="relative w-[46px] h-[46px] rounded-full shrink-0 flex items-center justify-center" style="background:conic-gradient(${hexClr} 0% ${pct}%, rgba(255,255,255,0.04) ${pct}% 100%)">
            <div class="w-[34px] h-[34px] rounded-full bg-surface flex items-center justify-center"><span class="text-[9px] font-bold ${txtCls}">${pct}%</span></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[9px] font-bold ${done ? 'text-green' : 'text-text'} truncate">${g.name}</div>
            <div class="text-[8px] text-text-dim/60">${g.levelLabel} · ${done ? 'Checkpoint completed' : `${g.progress}/${g.target}${g.unit ? ' ' + g.unit : ''}`}${g.deadline ? ' · ' + days : ''}</div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    if (linkedHabits.length > 0) {
      html += `<div class="border-t border-border pt-3 mt-auto space-y-2.5">
        <div class="text-[7px] font-bold text-text-dim/50 uppercase tracking-widest">Daily Habits</div>`;
      linkedHabits.forEach(lh => {
        const block = appState.settings.scheduleBlocks.find(b => b.id === lh.habitId);
        if (!block) return;
        let dots = "";
        dates.forEach(dStr => { dots += `<div class="w-[7px] h-[7px] rounded-full ${dotColor(lh.habitId, dStr)}"></div>`; });
        const completed = getHabitCompletionInPeriod(lh.habitId, dates);
        html += `<div class="flex items-center justify-between gap-2">
          <span class="text-[9px] text-text-dim shrink-0 min-w-[48px]">${block.name}</span>
          <div class="flex items-center gap-[3px] flex-wrap justify-end">${dots}</div>
          <span class="text-[8px] font-bold text-text-dim shrink-0 w-[32px] text-right">${completed}/${daysInPeriod}</span>
        </div>`;
      });
      html += `</div>`;
    }

    html += `<div class="mt-auto pt-3">
      <button onclick="${pillar.completed ? `toggleNorthStarReviewComplete('${pillar.id}',false)` : `openNorthStarReviewModal('${pillar.id}')`}" class="w-full text-[10px] font-bold px-3 py-2 rounded-full border transition-colors ${pillar.completed ? 'bg-green/15 text-green border-green/30 hover:bg-green/20' : 'bg-blue/[0.08] text-blue border-blue/20 hover:bg-blue/[0.14]'}">
        ${pillar.completed ? 'Completed' : 'Checkpoint Achieved'}
      </button>
    </div>`;

    html += `</div>`;
  });

  html += `</div>`;

  if (checkpoints.length > 0) {
    html += `<div class="border border-border rounded-2xl p-4 md:p-5 bg-[rgba(255,255,255,0.015)] space-y-4 mt-4">
      <div class="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim/70">Configured Checkpoints</div>
          <p class="text-xs text-text-dim mt-1">All milestones defined on the Blueprint page.</p>
        </div>
        <div class="text-right shrink-0">
          <div class="text-lg font-bold text-text">${completedCheckpoints}/${checkpoints.length}</div>
          <div class="text-[10px] uppercase tracking-[0.16em] text-text-dim/60">Completed</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">`;

    checkpoints.forEach(goal => {
      const done = !!goal.completed;
      const pct = goal.target > 0 ? Math.min(Math.round((goal.progress / goal.target) * 100), 100) : 0;
      const days = calculateDaysRemaining(goal.deadline);
      html += `<div class="rounded-xl border ${done ? 'border-green/30 bg-green/[0.04]' : 'border-border bg-[rgba(255,255,255,0.02)]'} px-4 py-3 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-[9px] uppercase tracking-[0.16em] font-bold ${done ? 'text-green/80' : 'text-text-dim/60'}">${goal.levelLabel}</div>
            <div class="text-xs font-bold ${done ? 'text-green' : 'text-text'} mt-1">${goal.name}</div>
          </div>
          <span class="text-[9px] font-bold px-2 py-1 rounded-full border ${done ? 'bg-green/15 text-green border-green/30' : 'bg-white/[0.03] text-text-dim border-border'}">${done ? 'Completed' : 'Active'}</span>
        </div>
        <div class="text-[10px] text-text-dim">${goal.northStarTitle}</div>
        <div class="flex items-center justify-between text-[10px] text-text-dim">
          <span>${goal.progress}/${goal.target}${goal.unit ? ' ' + goal.unit : ''}</span>
          <span>${days}</span>
        </div>
        <div class="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
          <div class="h-full ${done ? 'bg-green' : 'bg-blue'}" style="width:${done ? 100 : pct}%"></div>
        </div>
        <button onclick="${done ? `toggleGoalDeadline('${goal.levelKey}','${goal.id}',false)` : `openCheckpointCompleteModal('${goal.levelKey}','${goal.id}')`}" class="w-full text-[10px] font-bold px-3 py-2 rounded-full border transition-colors ${done ? 'bg-green/15 text-green border-green/30 hover:bg-green/20' : 'bg-blue/[0.08] text-blue border-blue/20 hover:bg-blue/[0.14]'}">
          ${done ? 'Completed checkpoint' : 'Complete checkpoint'}
        </button>
      </div>`;
    });

    html += `</div></div>`;
  }

  container.innerHTML = html;
  lucide.createIcons();
}

function renderReviewDayDetails(dateStr) {
  const container = document.getElementById("review-selected-day-details");
  if (!container) return;
  const log = appState.logs[dateStr] || {};
  const deadlines = getDeadlinesForDate(dateStr);
  const formattedDate = formatDateLabelShort(dateStr);

  let deadlinesHtml = "";
  if (deadlines.length > 0) {
    deadlinesHtml = `<div class="border-t border-border pt-2 mt-2"><p class="text-[10px] text-red font-bold uppercase tracking-wider">Checkpoint Deadlines</p><ul class="list-disc list-inside text-xs mt-1 text-text space-y-1">${deadlines.map(d => `<li>${d.name} (${d.target} ${d.unit || ''})</li>`).join('')}</ul></div>`;
  }

  let blocksHtml = "";
  if (getLinkedBlocks().length === 0) {
    blocksHtml = '<p class="text-[10px] text-text-dim/50 italic py-2">No habits linked yet.</p>';
  } else {
  getLinkedBlocks().forEach(b => {
    const logData = log[b.id] || {};
    let ok = isBlockCompleted(b, logData);
    blocksHtml += `<div class="flex items-center justify-between text-xs py-1.5 px-2 rounded ${ok ? 'bg-green/[0.06]' : 'bg-[rgba(255,255,255,0.015)]'}">
      <span class="${ok ? 'text-text font-bold' : 'text-text-dim/40'}">${b.name}</span>
      <span class="${ok ? 'text-green' : 'text-text-dim/30'}">${ok ? '✓' : '—'}</span>
    </div>`;
  });
  }

  const moodLabel = {5:"Great",4:"Good",3:"Okay",2:"Rough",1:"Tough"};

  container.innerHTML = `
    <div class="flex items-center justify-between border-b border-border pb-2.5">
      <h4 class="font-bold text-xs text-text">${formattedDate}</h4>
      <button onclick="switchTab('today')" class="text-[10px] bg-white/5 border border-border px-2 py-1 rounded hover:bg-white/10 text-text font-bold flex items-center gap-1"><i data-lucide="edit" class="w-3 h-3"></i> Edit</button>
    </div>
    <div class="space-y-3 pt-2">
      <div class="space-y-0.5">${blocksHtml}</div>
      <div class="border-t border-border pt-2 space-y-1.5 text-xs">
        ${log.feelingScore ? `<div><span class="text-text-dim">Mood:</span> <strong class="text-text">${moodLabel[log.feelingScore] || log.feelingScore}</strong></div>` : ''}
        ${log.biggestWin ? `<div><span class="text-text-dim">Win:</span> <strong class="text-text">"${log.biggestWin}"</strong></div>` : ''}
        ${log.biggestLearning ? `<div><span class="text-text-dim">Learning:</span> <strong class="text-text">"${log.biggestLearning}"</strong></div>` : ''}
      </div>
      ${deadlinesHtml}
    </div>`;
  lucide.createIcons();
}
