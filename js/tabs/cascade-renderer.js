// ============================================================
//  📊 Life OS — Cascade Impact Renderer
//  ============================================================
//  Extracted from progress.js to reduce file size.
//  Renders the North Star → Checkpoint → Habit cascade view.
// ============================================================

function getPeriodDates() {
  if (reviewMode === "weekly") return getWeekDates(getWeekStartDate(reviewWeekId));
  const daysInMonth = new Date(reviewYear, reviewMonth + 1, 0).getDate();
  const dates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(`${reviewYear}-${String(reviewMonth + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`);
  }
  return dates;
}

function getGoalsByNorthStar(northStarId) {
  const result = [];
  GOAL_LEVELS.forEach(l => {
    (appState.goals[l.key] || []).forEach(g => {
      if (g.northStarId === northStarId) {
        result.push({ ...g, levelKey: l.key, levelLabel: l.label });
      }
    });
  });
  return result;
}

function getConfiguredCheckpoints() {
  const checkpoints = [];
  GOAL_LEVELS.forEach(level => {
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

function getHabitCompletionInPeriod(blockId, dates) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (!block) return 0;
  let completed = 0;
  dates.forEach(dStr => {
    if (isBlockCompleted(block, appState.logs[dStr]?.[blockId])) completed++;
  });
  return completed;
}

function getCheckpointProgressColor(done, pct) {
  if (done) return { hex: "#22d3a0", cls: "text-green" };
  if (pct >= 50) return { hex: "#f59e0b", cls: "text-amber" };
  return { hex: "#f87171", cls: "text-red" };
}

function getAverageClass(pct) {
  if (pct >= 80) return "text-green";
  if (pct >= 50) return "text-amber";
  return "text-text-dim";
}

function dotColor(habitId, dStr) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === habitId);
  if (!block) return "bg-white/[0.04]";
  return isBlockCompleted(block, appState.logs[dStr]?.[habitId]) ? "bg-green" : "bg-white/[0.04]";
}

function renderCascadePillarCard(pillar, dates, daysInPeriod) {
  const goals = getGoalsByNorthStar(pillar.id);
  const linkedHabits = appState.goals.linkedHabits.filter(l => l.northStarId === pillar.id);
  const goalPcts = goals.map(g => g.completed ? 100 : (g.target > 0 ? Math.min(Math.round((g.progress / g.target) * 100), 100) : 0));
  const avgPct = goalPcts.length > 0 ? Math.round(goalPcts.reduce((a, b) => a + b, 0) / goalPcts.length) : 0;
  const avgCls = getAverageClass(avgPct);

  let html = `<div class="border border-border rounded-xl p-4 bg-[rgba(255,255,255,0.015)] space-y-4 min-h-[320px] flex flex-col ${pillar.completed ? 'border-green/30 bg-green/[0.02]' : ''}">`;

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
      const colors = getCheckpointProgressColor(done, pct);
      const days = calculateDaysRemaining(g.deadline);
      html += `<div class="flex items-center gap-3">
        <div class="relative w-[46px] h-[46px] rounded-full shrink-0 flex items-center justify-center" style="background:conic-gradient(${colors.hex} 0% ${pct}%, rgba(255,255,255,0.04) ${pct}% 100%)">
          <div class="w-[34px] h-[34px] rounded-full bg-surface flex items-center justify-center"><span class="text-[9px] font-bold ${colors.cls}">${pct}%</span></div>
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
  return html;
}

function renderConfiguredCheckpointsSection(checkpoints, completedCheckpoints) {
  if (checkpoints.length === 0) return "";

  let html = `<div class="border border-border rounded-2xl p-4 md:p-5 bg-[rgba(255,255,255,0.015)] space-y-4 mt-4">
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
  return html;
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

  const checkpoints = getConfiguredCheckpoints();
  const completedCheckpoints = checkpoints.filter(c => c.completed).length;

  let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">`;

  pillars.forEach(pillar => {
    html += renderCascadePillarCard(pillar, dates, daysInPeriod);
  });

  html += `</div>`;
  html += renderConfiguredCheckpointsSection(checkpoints, completedCheckpoints);

  container.innerHTML = html;
  lucide.createIcons();
}
