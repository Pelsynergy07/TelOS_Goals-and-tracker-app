// ============================================================
//  📊 Life OS — Review Tab
//  ============================================================
//  Weekly & monthly review: period summary, habit matrix,
//  compact calendar with day details, and the goal cascade.
// ============================================================

const REVIEW_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function setReviewTab(tab) {
  reviewTab = tab;
  if (tab === "weekly" || tab === "monthly") reviewMode = tab;
  ["weekly", "monthly", "cascade"].forEach(t => {
    const btn = document.getElementById("review-tab-" + t);
    if (btn) {
      btn.className = `segment-button${t === tab ? " is-active" : ""}`;
      btn.setAttribute("aria-pressed", String(t === tab));
    }
  });
  renderReview();
}

function shiftReviewWeek(dir) {
  const next = addDateDays(getWeekStartDate(reviewWeekId), dir * 7);
  const d = parseLocalDate(next);
  reviewWeekId = getWeekID(next);
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

function getPeriodLabel() {
  if (reviewMode === "weekly") {
    const start = getWeekStartDate(reviewWeekId);
    return `${formatDateLabelShort(start)} – ${formatDateLabelShort(getWeekDates(start)[6])}`;
  }
  return `${REVIEW_MONTHS[reviewMonth]} ${reviewYear}`;
}

// Rate colour: judged against days that have actually elapsed, not the whole period.
function rateClass(pct) {
  if (pct === null) return "text-text-dim";
  return pct >= 80 ? "text-green" : pct >= 50 ? "text-amber" : "text-red";
}

function renderReview() {
  const periodSelector = document.getElementById("review-period-selector");
  if (!periodSelector) return;

  const isPeriodView = reviewTab === "weekly" || reviewTab === "monthly";
  const shift = reviewMode === "weekly" ? "shiftReviewWeek" : "shiftReviewMonth";
  periodSelector.innerHTML = `
    <button aria-label="Previous period" onclick="${shift}(-1)" class="icon-button"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
    <span class="period-label">${getPeriodLabel()}</span>
    <button aria-label="Next period" onclick="${shift}(1)" class="icon-button"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>`;

  ["review-summary", "review-calendar-section", "period-reflection"].forEach(id => {
    document.getElementById(id)?.classList.toggle("hidden", !isPeriodView);
  });
  document.getElementById("review-cascade-card")?.classList.toggle("hidden", isPeriodView);

  if (isPeriodView) {
    const period = getPeriodDates();
    if (!period.includes(selectedReviewDate)) selectedReviewDate = period.includes(getLocalDateString()) ? getLocalDateString() : period[0];
    renderReviewSummary();
    renderReviewMetrics();
    renderReviewCalendar();
    renderReviewDayDetails(selectedReviewDate);
    renderPeriodReflection();
  } else {
    renderCascadeImpact();
  }
  lucide.createIcons();
}

function getElapsedPeriodDates() {
  const todayStr = getLocalDateString();
  return getPeriodDates().filter(d => d <= todayStr);
}

function renderReviewSummary() {
  const container = document.getElementById("review-summary");
  if (!container) return;
  const blocks = getLinkedBlocks();
  if (blocks.length === 0) { container.innerHTML = ""; container.classList.add("hidden"); return; }

  const elapsed = getElapsedPeriodDates();
  const possible = blocks.length * elapsed.length;
  let done = 0, perfect = 0;
  elapsed.forEach(d => {
    const dayDone = blocks.filter(b => isBlockCompleted(b, appState.logs[d]?.[b.id])).length;
    done += dayDone;
    if (dayDone === blocks.length) perfect++;
  });
  const rates = blocks.map(b => ({ name: b.name, pct: elapsed.length ? Math.round(getBlockActual(b.id, elapsed) / elapsed.length * 100) : null }));
  const ranked = rates.filter(r => r.pct !== null).sort((a, b) => b.pct - a.pct);
  const overall = possible ? Math.round(done / possible * 100) : null;

  const tile = (label, value, sub, cls = "") => `<div class="summary-tile"><span class="summary-label">${label}</span><span class="summary-value ${cls}">${value}</span><span class="summary-sub">${sub}</span></div>`;
  container.innerHTML = [
    tile("Completion", overall === null ? "—" : overall + "%", overall === null ? "Period hasn't started" : `${done} of ${possible} check-ins`, rateClass(overall)),
    tile("Perfect days", elapsed.length ? `${perfect}/${elapsed.length}` : "—", "All habits done"),
    tile("Strongest", ranked[0] ? escapeHtml(ranked[0].name) : "—", ranked[0] ? `${ranked[0].pct}% of days` : "No data yet"),
    tile("Needs focus", ranked.length > 1 ? escapeHtml(ranked.at(-1).name) : "—", ranked.length > 1 ? `${ranked.at(-1).pct}% of days` : "No data yet", ranked.length > 1 ? rateClass(ranked.at(-1).pct) : "")
  ].join("");
}

// Habit × day matrix: replaces the old "Goal vs Actual" tiles.
function renderReviewMetrics() {
  const container = document.getElementById("review-metrics-container");
  if (!container) return;
  const blocks = getLinkedBlocks();
  if (blocks.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <i data-lucide="map" class="w-8 h-8 text-text-dim/30 mb-2"></i>
        <p class="text-xs font-bold text-text-dim mb-1">No habits linked yet</p>
        <p class="text-caption text-text-dim/60">Link habits to your North Stars on the Blueprint page.</p>
      </div>`;
    return;
  }

  const todayStr = getLocalDateString();
  const dates = getPeriodDates();
  const elapsed = dates.filter(d => d <= todayStr);
  const weekly = reviewMode === "weekly";
  container.classList.toggle("is-monthly", !weekly);
  container.style.setProperty("--matrix-days", dates.length);

  const dayHead = weekly
    ? `<div class="matrix-row matrix-head" aria-hidden="true"><span></span><span class="matrix-dots">${dates.map(d => `<span class="matrix-day${d === todayStr ? " is-today" : ""}">${["S","M","T","W","T","F","S"][parseLocalDate(d).getDay()]}</span>`).join("")}</span><span></span></div>`
    : "";

  container.innerHTML = dayHead + blocks.map(b => {
    const actual = getBlockActual(b.id, elapsed);
    const pct = elapsed.length ? Math.round(actual / elapsed.length * 100) : null;
    const dots = dates.map(d => {
      const done = isBlockCompleted(b, appState.logs[d]?.[b.id]);
      const state = done ? " is-done" : d > todayStr ? " is-future" : "";
      return `<span class="matrix-dot${state}${d === selectedReviewDate ? " is-selected" : ""}" title="${formatDateLabelShort(d)}: ${done ? "done" : d > todayStr ? "upcoming" : "missed"}"></span>`;
    }).join("");
    return `<div class="matrix-row">
      <span class="matrix-name" title="${escapeHtml(b.name)}">${escapeHtml(b.name)}</span>
      <span class="matrix-dots" role="img" aria-label="${escapeHtml(b.name)}: done ${actual} of ${elapsed.length} days so far">${dots}</span>
      <span class="matrix-score"><strong class="${rateClass(pct)}">${pct === null ? "—" : pct + "%"}</strong><span>${actual}/${elapsed.length}</span></span>
    </div>`;
  }).join("");
}

function renderReviewCalendar() {
  const container = document.getElementById("review-calendar-days-container");
  const weekdays = document.getElementById("review-weekday-labels");
  if (!container) return;
  const todayStr = getLocalDateString();
  const weekly = reviewMode === "weekly";
  const labels = weekly ? ["M","T","W","T","F","S","S"] : ["S","M","T","W","T","F","S"];
  if (weekdays) weekdays.innerHTML = labels.map(d => `<span>${d}</span>`).join("");

  let html = "";
  if (!weekly) {
    const firstDay = new Date(reviewYear, reviewMonth, 1).getDay();
    for (let i = 0; i < firstDay; i++) html += `<span class="mini-day is-blank"></span>`;
  }
  getPeriodDates().forEach(d => {
    const rate = getLoggedCompletionRate(d);
    const level = rate >= 1 ? 3 : rate >= 0.5 ? 2 : rate > 0 ? 1 : 0;
    const due = getDeadlinesForDate(d).length > 0;
    html += `<button type="button" class="mini-day heat-${level}${d === todayStr ? " is-today" : ""}${d === selectedReviewDate ? " is-selected" : ""}${d > todayStr ? " is-future" : ""}" onclick="selectReviewDay('${d}')" aria-label="${formatDateLabelShort(d)}, ${Math.round(rate * 100)}% done${due ? ", checkpoint due" : ""}" aria-pressed="${d === selectedReviewDate}">${parseLocalDate(d).getDate()}${due ? '<span class="mini-day-flag"></span>' : ""}</button>`;
  });
  container.innerHTML = html;
}

function selectReviewDay(dateStr) {
  selectedReviewDate = dateStr;
  renderReviewCalendar();
  renderReviewMetrics();
  renderReviewDayDetails(dateStr);
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
        levelKey: level.key,
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
  if (!input || !pendingNorthStarReviewCompletion) return;
  toggleNorthStarReviewComplete(pendingNorthStarReviewCompletion, true);
  closeNorthStarReviewModal();
  celebrate();
}

// One card per North Star: checkpoints (with inline complete) and linked habit rates.
function renderCascadeImpact() {
  const container = document.getElementById("review-cascade-container");
  if (!container) return;

  const pillars = appState.goals.northStar;
  if (pillars.length === 0) {
    container.innerHTML = '<div class="card"><p class="text-xs text-text-dim">No North Stars defined yet. Set them up on the Blueprint page.</p></div>';
    return;
  }

  const elapsed = getElapsedPeriodDates();
  const checkpoints = getConfiguredCheckpoints();
  const completedCheckpoints = checkpoints.filter(c => c.completed).length;
  const completedPillars = pillars.filter(p => p.completed).length;

  let html = `<div class="cascade-overview">
    <span><strong>${completedPillars}/${pillars.length}</strong> North Stars complete</span>
    <span><strong>${completedCheckpoints}/${checkpoints.length}</strong> checkpoints complete</span>
    <span>Habit rates for <strong>${getPeriodLabel()}</strong></span>
  </div><div class="cascade-review-grid">`;

  pillars.forEach(pillar => {
    const goals = getGoalsByNorthStar(pillar.id);
    const linkedHabits = appState.goals.linkedHabits.filter(l => l.northStarId === pillar.id);
    const goalPcts = goals.map(g => g.completed ? 100 : (g.target > 0 ? Math.min(Math.round((g.progress / g.target) * 100), 100) : 0));
    const avgPct = goalPcts.length > 0 ? Math.round(goalPcts.reduce((a, b) => a + b, 0) / goalPcts.length) : 0;

    html += `<article class="card cascade-review-card${pillar.completed ? " is-complete" : ""}">
      <header class="cascade-review-head">
        <span class="cascade-review-icon">${pillar.completed ? '<i data-lucide="check"></i>' : '<i data-lucide="star"></i>'}</span>
        <h3>${escapeHtml(pillar.title)}</h3>
        <span class="cascade-review-pct ${pillar.completed ? "text-green" : "text-text-dim"}">${pillar.completed ? "Done" : goals.length ? avgPct + "%" : ""}</span>
      </header>`;

    if (goals.length === 0 && linkedHabits.length === 0) {
      html += '<p class="text-caption text-text-dim">Nothing linked yet.</p>';
    }

    if (goals.length > 0) {
      html += `<ul class="cascade-goal-list">`;
      goals.forEach(g => {
        const done = !!g.completed;
        const pct = done ? 100 : (g.target > 0 ? Math.min(Math.round((g.progress / g.target) * 100), 100) : 0);
        html += `<li class="cascade-goal${done ? " is-done" : ""}">
          <button type="button" class="cascade-goal-check" role="checkbox" aria-checked="${done}" aria-label="${done ? "Reopen" : "Complete"} ${escapeHtml(g.name)}" onclick="${done ? `toggleGoalDeadline('${g.levelKey}','${g.id}',false)` : `openCheckpointCompleteModal('${g.levelKey}','${g.id}')`}"><i data-lucide="check"></i></button>
          <div class="cascade-goal-body">
            <span class="cascade-goal-name">${escapeHtml(g.name)}</span>
            <span class="cascade-goal-meta">${g.levelLabel} · ${g.progress}/${g.target}${g.unit ? " " + escapeHtml(g.unit) : ""}${g.deadline ? " · " + calculateDaysRemaining(g.deadline) : ""}</span>
            <span class="cascade-goal-bar"><span style="width:${pct}%"></span></span>
          </div>
        </li>`;
      });
      html += `</ul>`;
    }

    if (linkedHabits.length > 0) {
      html += `<div class="cascade-habits"><span class="cascade-section-label">Daily habits</span>`;
      linkedHabits.forEach(lh => {
        const block = appState.settings.scheduleBlocks.find(b => b.id === lh.habitId);
        if (!block) return;
        const completed = getHabitCompletionInPeriod(lh.habitId, elapsed);
        const pct = elapsed.length ? Math.round(completed / elapsed.length * 100) : null;
        html += `<div class="cascade-habit"><span>${escapeHtml(block.name)}</span><span class="${rateClass(pct)}">${completed}/${elapsed.length}</span></div>`;
      });
      html += `</div>`;
    }

    html += `<button onclick="${pillar.completed ? `toggleNorthStarReviewComplete('${pillar.id}',false)` : `openNorthStarReviewModal('${pillar.id}')`}" class="btn btn-outline w-full mt-auto ${pillar.completed ? "is-complete" : ""}">
        ${pillar.completed ? "Completed · reopen" : "Complete North Star"}
      </button>
    </article>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderReviewDayDetails(dateStr) {
  const container = document.getElementById("review-selected-day-details");
  if (!container) return;
  selectedReviewDate = dateStr;
  const log = appState.logs[dateStr] || {};
  const deadlines = getDeadlinesForDate(dateStr);
  const blocks = getLinkedBlocks();
  const isFuture = dateStr > getLocalDateString();
  const doneCount = blocks.filter(b => isBlockCompleted(b, log[b.id])).length;
  const moodLabel = {5:"Great",4:"Good",3:"Okay",2:"Rough",1:"Tough"};

  const rows = blocks.map(b => {
    const logData = log[b.id] || {};
    const ok = isBlockCompleted(b, logData);
    const amounts = b.fields.filter(f => f.type === "number" && logData[f.id] !== undefined && logData[f.id] !== "").map(f => `${logData[f.id]} ${escapeHtml(f.label || f.id)}`).join(", ");
    return `<li class="day-habit${ok ? " is-done" : ""}"><i data-lucide="${ok ? "check-circle-2" : "circle"}" aria-hidden="true"></i><span>${escapeHtml(b.name)}</span>${amounts ? `<span class="day-habit-amount">${amounts}</span>` : ""}</li>`;
  }).join("");

  const notes = [
    log.feelingScore ? `<div><dt>Mood</dt><dd>${moodLabel[log.feelingScore] || log.feelingScore}</dd></div>` : "",
    log.biggestWin ? `<div><dt>Win</dt><dd>${escapeHtml(log.biggestWin)}</dd></div>` : "",
    log.biggestLearning ? `<div><dt>Learning</dt><dd>${escapeHtml(log.biggestLearning)}</dd></div>` : ""
  ].join("");

  container.innerHTML = `
    <div class="day-details-head">
      <div><h4>${formattedDayLabel(dateStr)}</h4><span>${isFuture ? "Upcoming" : blocks.length ? `${doneCount} of ${blocks.length} habits done` : ""}</span></div>
      ${isFuture ? "" : `<button onclick="editExecutionDate('${dateStr}')" class="btn btn-outline"><i data-lucide="pencil" class="w-3.5 h-3.5"></i> Edit</button>`}
    </div>
    ${blocks.length ? `<ul class="day-habit-list">${rows}</ul>` : '<p class="text-caption text-text-dim">No habits linked yet.</p>'}
    ${notes ? `<dl class="day-notes">${notes}</dl>` : ""}
    ${deadlines.length ? `<div class="day-deadlines"><span class="cascade-section-label text-red">Checkpoints due</span><ul>${deadlines.map(d => `<li>${escapeHtml(d.name)} (${d.target} ${escapeHtml(d.unit || "")})</li>`).join("")}</ul></div>` : ""}`;
}

function formattedDayLabel(dateStr) {
  const d = parseLocalDate(dateStr);
  return `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}, ${formatDateLabelShort(dateStr)}`;
}
