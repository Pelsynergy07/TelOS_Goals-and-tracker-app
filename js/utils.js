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
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()] + " " + d.getDate();
}

function getLoggedCompletionRate(dateStr) {
  const dayLog = appState.logs[dateStr];
  if (!dayLog) return 0;
  let totalItems = 0, completedItems = 0;
  appState.settings.scheduleBlocks.forEach(block => {
    totalItems++;
    const blockVal = dayLog[block.id];
    if (blockVal) {
      if (block.id === "deep_learning" || block.id === "youtube") {
        const mins = blockVal.minutes || 0;
        if (block.id === "deep_learning" && mins >= 60) completedItems++;
        else if (block.id === "youtube" && mins <= 90 && mins > 0) completedItems++;
      } else { if (blockVal.completed) completedItems++; }
    }
  });
  return totalItems > 0 ? completedItems / totalItems : 0;
}

function calculateStreaks() {
  const sortedDates = Object.keys(appState.logs).sort();
  if (sortedDates.length === 0) { updateStreakUI(0); return; }
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString(today);
  let overallStreak = 0;
  let checkDate = today;
  if (!appState.logs[today] || getLoggedCompletionRate(today) < 0.6) checkDate = yesterday;
  while (appState.logs[checkDate] && getLoggedCompletionRate(checkDate) >= 0.6) {
    overallStreak++;
    checkDate = getYesterdayDateString(checkDate);
  }
  updateStreakUI(overallStreak);
}

function getBlockStreak(blockId) {
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString(today);
  let checkDate = today;
  function isBlockLogDone(dateStr) {
    const log = appState.logs[dateStr];
    if (!log) return false;
    if (blockId === "deep_learning") return (log[blockId]?.minutes || 0) > 0;
    if (blockId === "youtube") return (log[blockId]?.minutes || 0) <= 90;
    return !!log[blockId]?.completed;
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
  let daysLogCount = 0, gymSessions = 0, dlDays = 0, readingDays = 0, sleepOnTimeDays = 0, youtubeAdherentDays = 0;
  Object.keys(appState.logs).forEach(dateStr => {
    if (getWeekID(dateStr) === weekID) {
      daysLogCount++;
      const log = appState.logs[dateStr];
      if (log.gym?.completed) gymSessions++;
      if ((log.deep_learning?.minutes || 0) > 0) dlDays++;
      if (log.reading?.completed) readingDays++;
      if (log.sleep?.completed) sleepOnTimeDays++;
      if ((log.youtube?.minutes || 0) <= 90) youtubeAdherentDays++;
    }
  });
  if (daysLogCount === 0) return 0;
  const gymScore = Math.min((gymSessions / 4) * 25, 25);
  const dlScore = Math.min((dlDays / 5) * 25, 25);
  const ytScore = Math.min((youtubeAdherentDays / 5) * 15, 15);
  const readingScore = Math.min((readingDays / 7) * 15, 15);
  const sleepScore = Math.min((sleepOnTimeDays / 7) * 20, 20);
  return Math.round(gymScore + dlScore + ytScore + readingScore + sleepScore);
}

function getBlockWeeklyTarget(blockId) {
  const targets = { gym: 4, deep_learning: 600, reading: 7, sleep: 7, youtube: 5 };
  return targets[blockId] || 7;
}

function getBlockActual(blockId, dates) {
  let total = 0;
  dates.forEach(dStr => {
    const log = appState.logs[dStr];
    if (!log) return;
    if (blockId === "deep_learning") total += log.deep_learning?.minutes || 0;
    else if (blockId === "youtube") { if ((log.youtube?.minutes || 0) <= 90 && (log.youtube?.minutes || 0) > 0) total++; }
    else if (log[blockId]?.completed) total++;
  });
  return total;
}

function formatBlockActual(blockId, val) {
  if (blockId === "deep_learning") return `${(val / 60).toFixed(1)}h`;
  return val;
}

function formatBlockTarget(blockId, target) {
  if (blockId === "deep_learning") return `${(target / 60).toFixed(1)}h`;
  return target;
}

function calculateDaysRemaining(deadlineStr) {
  if (!deadlineStr) return "";
  const today = new Date(getLocalDateString());
  const target = new Date(deadlineStr);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return "Deadline today";
  return `${diff}d left`;
}

function getDeadlinesForDate(dateStr) {
  const result = [];
  appState.goals.yearly.forEach(g => { if (g.deadline === dateStr) result.push(g); });
  (appState.goals.sixMonth || []).forEach(g => { if (g.deadline === dateStr) result.push(g); });
  (appState.goals.threeMonth || []).forEach(g => { if (g.deadline === dateStr) result.push(g); });
  return result;
}
