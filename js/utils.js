// ============================================================
//  🛠️ Life OS — Utility Functions
//  ============================================================
//  Pure computations: dates, streaks, scores, formatting.
//  No side-effects (no DOM, no state mutation).
// ============================================================

function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0];
}

function getYesterdayDateString(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getWeekID(dateString) {
  const date = new Date(dateString);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getWeekStartDate(weekId) {
  const [year, weekNum] = weekId.split('-W');
  const jan1 = new Date(+year, 0, 1);
  const days = (+weekNum - 1) * 7;
  const d = new Date(jan1.getTime() + days * 86400000);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekDates(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dayVal = new Date(monday);
    dayVal.setDate(monday.getDate() + i);
    dates.push(dayVal.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDateLabelShort(dateStr) {
  const d = new Date(dateStr);
  return MONTH_ABBREVS[d.getMonth()] + " " + d.getDate();
}

function getLoggedCompletionRate(dateStr) {
  const dayLog = appState.logs[dateStr];
  if (!dayLog) return 0;
  let totalItems = 0, completedItems = 0;
  const blocks = getLinkedBlocks();
  const checkBlocks = blocks.length > 0 ? blocks : appState.settings.scheduleBlocks;
  checkBlocks.forEach(block => {
    totalItems++;
    if (isBlockCompleted(block, dayLog[block.id])) completedItems++;
  });
  return totalItems > 0 ? completedItems / totalItems : 0;
}

function isBlockCompleted(block, val) {
  if (!val) return false;
  return block.fields.some(f => {
    if (f.type === "checkbox") return val.completed === true;
    if (f.type === "number") return (val[f.id] || 0) > 0;
    return false;
  });
}

function hadAnyCompletion(dateStr) {
  const dayLog = appState.logs[dateStr];
  if (!dayLog) return false;
  const blocks = getLinkedBlocks();
  const checkBlocks = blocks.length > 0 ? blocks : appState.settings.scheduleBlocks;
  return checkBlocks.some(block => isBlockCompleted(block, dayLog[block.id]));
}

function calculateStreaks() {
  const sortedDates = Object.keys(appState.logs).sort();
  if (sortedDates.length === 0) { updateStreakUI(0); return; }
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString(today);
  let overallStreak = 0;
  let checkDate = hadAnyCompletion(today) ? today : yesterday;
  while (hadAnyCompletion(checkDate)) {
    overallStreak++;
    checkDate = getYesterdayDateString(checkDate);
  }
  updateStreakUI(overallStreak);
}

function getBlockStreak(blockId) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (!block) return 0;
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString(today);
  let checkDate = today;
  function isBlockLogDone(dateStr) {
    return isBlockCompleted(block, appState.logs[dateStr]?.[blockId]);
  }
  if (!isBlockLogDone(today)) checkDate = yesterday;
  let streak = 0;
  while (true) {
    if (!isBlockLogDone(checkDate)) break;
    streak++;
    checkDate = getYesterdayDateString(checkDate);
    if (streak > 365) break;
  }
  return streak;
}

function updateStreakUI(overall) {
  const sidebarVal = document.getElementById("sidebar-streak-val");
  const mobileVal = document.getElementById("mobile-streak-val");
  if (sidebarVal) sidebarVal.textContent = overall;
  if (mobileVal) mobileVal.textContent = overall;
}

function calculateWeeklyScore(weekID) {
  const blocks = getLinkedBlocks();
  if (blocks.length === 0) return 0;
  const weightPerBlock = 100 / blocks.length;
  const weekDates = Object.keys(appState.logs).filter(d => getWeekID(d) === weekID);
  if (weekDates.length === 0) return 0;
  let totalScore = 0;
  blocks.forEach(block => {
    let doneDays = 0;
    weekDates.forEach(d => { if (isBlockCompleted(block, appState.logs[d]?.[block.id])) doneDays++; });
    totalScore += Math.min((doneDays / 7) * weightPerBlock, weightPerBlock);
  });
  return Math.round(totalScore);
}

function getBlockWeeklyTarget(blockId) {
  return 7;
}

function getBlockActual(blockId, dates) {
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (!block) return 0;
  let count = 0;
  dates.forEach(dStr => { if (isBlockCompleted(block, appState.logs[dStr]?.[blockId])) count++; });
  return count;
}

function formatBlockActual(blockId, val) { return val; }
function formatBlockTarget(blockId, target) { return target; }
// TODO: Remove formatBlockActual/formatBlockTarget once renderReviewMetrics is updated

function calculateDaysRemaining(deadlineStr) {
  if (!deadlineStr) return "";
  const today = new Date(getLocalDateString());
  const target = new Date(deadlineStr);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return "Deadline today";
  return `${diff}d left`;
}

function getLinkedBlocks() {
  const linkedIds = new Set(appState.goals.linkedHabits.map(l => l.habitId));
  return appState.settings.scheduleBlocks.filter(b => linkedIds.has(b.id));
}

function playTapSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) { /* audio not supported */ }
}

function getDeadlinesForDate(dateStr) {
  const result = [];
  (appState.goals.sixMonth || []).forEach(g => { if (g.deadline === dateStr) result.push(g); });
  (appState.goals.threeMonth || []).forEach(g => { if (g.deadline === dateStr) result.push(g); });
  (appState.goals.oneMonth || []).forEach(g => { if (g.deadline === dateStr) result.push(g); });
  return result;
}
