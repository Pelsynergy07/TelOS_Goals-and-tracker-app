// ============================================================
//  🔎 Life OS — Insights
//  ============================================================
//  Pure computations behind the Progress page insights: period
//  stats, trends against the previous period, weekday patterns,
//  checkpoint pace, and plain-language focus suggestions.
// ============================================================

const WEEKDAY_NAMES = ["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"];
const MOOD_LABELS = { 5: "Great", 4: "Good", 3: "Okay", 2: "Rough", 1: "Tough" };
const CHECKPOINT_SPANS = { oneMonth: 30, threeMonth: 91, sixMonth: 182 };

// First day anything was logged; earlier days are not counted as misses.
function getTrackingStart() {
  const dates = [...Object.keys(appState.logs || {}), ...Object.keys(appState.todos || {})].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
  return dates.length ? dates.sort()[0] : null;
}

function getCountableDates(dates) {
  const today = getLocalDateString();
  const start = getTrackingStart();
  return dates.filter(d => d <= today && (!start || d >= start));
}

function getPeriodStats(dates) {
  const blocks = getLinkedBlocks();
  let done = 0, perfect = 0, moodSum = 0, moodCount = 0, todosDone = 0, todosTotal = 0;
  let possible = 0;
  dates.forEach(d => {
    const log = appState.logs[d] || {};
    const tally = getDayTally(d);
    done += tally.done;
    possible += tally.expected;
    if (tally.expected && tally.done === tally.expected) perfect++;
    if (typeof log.feelingScore === "number") { moodSum += log.feelingScore; moodCount++; }
    const todos = getTodos(d).filter(t => !t.movedTo);
    todosTotal += todos.length;
    todosDone += todos.filter(t => t.done).length;
  });
  const habits = blocks.map(b => {
    const { actual, days, skipped, pct } = getBlockRate(b.id, dates);
    return { id: b.id, name: b.name, actual, days, skipped, pct, bestStreak: getBestStreakIn(b, dates) };
  });
  return {
    days: dates.length, done, possible, perfect,
    overall: possible ? Math.round(done / possible * 100) : null,
    mood: moodCount ? moodSum / moodCount : null, moodCount,
    todosDone, todosTotal,
    habits
  };
}

function getBestStreakIn(block, dates) {
  let best = 0, run = 0;
  dates.forEach(d => {
    if (isBlockSkipped(block.id, d)) return;
    if (isBlockCompleted(block, appState.logs[d]?.[block.id])) { run++; best = Math.max(best, run); }
    else run = 0;
  });
  return best;
}

// Completion rate per weekday (0 = Sunday); null where there are no samples.
function getWeekdayRates(dates) {
  const blocks = getLinkedBlocks();
  const sums = Array(7).fill(0), counts = Array(7).fill(0);
  if (!blocks.length) return sums.map(() => null);
  dates.forEach(d => {
    const day = parseLocalDate(d).getDay();
    sums[day] += getLoggedCompletionRate(d);
    counts[day]++;
  });
  return sums.map((s, i) => counts[i] ? Math.round(s / counts[i] * 100) : null);
}

// Expected progress assumes a checkpoint starts one span before its deadline.
function getCheckpointPace(todayStr) {
  const result = [];
  Object.entries(CHECKPOINT_SPANS).forEach(([level, span]) => {
    (appState.goals[level] || []).forEach(g => {
      if (g.completed || !g.deadline || !(g.target > 0)) return;
      const actual = Math.min(Math.round((g.progress || 0) / g.target * 100), 100);
      const daysLeft = Math.round((parseLocalDate(g.deadline) - parseLocalDate(todayStr)) / 86400000);
      const elapsed = Math.min(Math.max(span - daysLeft, 0), span);
      const expected = Math.round(elapsed / span * 100);
      result.push({ ...g, level, actual, expected, daysLeft, gap: expected - actual });
    });
  });
  return result;
}

function moodLabel(score) {
  return score === null ? "—" : MOOD_LABELS[Math.round(score)] || score.toFixed(1);
}

function formatDelta(value, unit = " pts") {
  if (value === null || value === undefined) return "";
  if (value === 0) return `±0${unit}`;
  return `${value > 0 ? "+" : "−"}${Math.abs(value)}${unit}`;
}

// Mood on strong habit days vs weak habit days, when there is enough data.
function getMoodHabitLink(dates) {
  const high = [], low = [];
  dates.forEach(d => {
    const mood = appState.logs[d]?.feelingScore;
    if (typeof mood !== "number") return;
    const rate = getLoggedCompletionRate(d);
    if (rate >= 0.8) high.push(mood);
    else if (rate < 0.5) low.push(mood);
  });
  if (high.length < 3 || low.length < 3) return null;
  const avg = list => list.reduce((a, b) => a + b, 0) / list.length;
  const diff = avg(high) - avg(low);
  return Math.abs(diff) >= 0.5 ? { high: avg(high), low: avg(low), diff } : null;
}

const MIN_TREND_DAYS = 4;

// Plain-language "what's working" and "focus next" lists. Each habit is named at most once per list.
function buildInsights({ current, previous, unit, patternDates, todayStr }) {
  const working = [], focus = [];
  const named = { working: new Set(), focus: new Set() };
  const say = (list, key, id, item) => { if (id && named[key].has(id)) return; if (id) named[key].add(id); list.push(item); };
  const enoughDays = current.days >= MIN_TREND_DAYS;
  const prevById = new Map((previous?.habits || []).map(h => [h.id, h]));
  const ranked = current.habits.filter(h => h.pct !== null).sort((a, b) => a.pct - b.pct);

  const weakest = ranked[0];
  if (weakest && weakest.pct < 60 && ranked.length > 1 && current.days >= 3) {
    const missed = weakest.days - weakest.actual;
    say(focus, "focus", weakest.id, { icon: "crosshair", text: `${weakest.name} is your weakest habit at ${weakest.pct}%, missed ${missed} of ${weakest.days} days. Make it the first thing you protect this ${unit === "year" ? "month" : "week"}.` });
  }

  if (enoughDays && previous && current.overall !== null && previous.overall !== null) {
    const delta = current.overall - previous.overall;
    if (delta >= 5) working.push({ icon: "trending-up", text: `Overall completion is up ${delta} pts on last ${unit} (${previous.overall}% → ${current.overall}%).` });
    else if (delta <= -5) focus.push({ icon: "trending-down", text: `Overall completion is down ${Math.abs(delta)} pts on last ${unit} (${previous.overall}% → ${current.overall}%).` });
  }

  if (enoughDays) current.habits.forEach(h => {
    const prev = prevById.get(h.id);
    if (!prev || prev.pct === null || h.pct === null) return;
    const delta = h.pct - prev.pct;
    if (delta >= 15) say(working, "working", h.id, { icon: "arrow-up-right", text: `${h.name} improved from ${prev.pct}% to ${h.pct}%.` });
    if (delta <= -15) say(focus, "focus", h.id, { icon: "arrow-down-right", text: `${h.name} slipped from ${prev.pct}% to ${h.pct}%. Get it back before it becomes the new normal.` });
  });

  if (enoughDays) ranked.slice().reverse().filter(h => h.pct >= 80).slice(0, 2).forEach(h => {
    say(working, "working", h.id, { icon: "badge-check", text: `${h.name} is locked in at ${h.pct}% of days${h.bestStreak >= 3 ? `, best run ${h.bestStreak} days` : ""}.` });
  });

  if (current.perfect > 0) working.push({ icon: "sparkles", text: `${current.perfect} perfect ${current.perfect === 1 ? "day" : "days"} with every habit done.` });

  const streaks = getLinkedBlocks().map(b => ({ name: b.name, streak: getBlockStreak(b.id) })).sort((a, b) => b.streak - a.streak);
  if (streaks[0]?.streak >= 5) working.push({ icon: "flame", text: `${streaks[0].name} is on a ${streaks[0].streak}-day streak.` });

  if (patternDates.length >= 14) {
    const rates = getWeekdayRates(patternDates);
    const known = rates.map((r, i) => ({ r, i })).filter(x => x.r !== null);
    if (known.length >= 5) {
      const avg = Math.round(known.reduce((a, x) => a + x.r, 0) / known.length);
      const low = known.reduce((a, x) => x.r < a.r ? x : a);
      const high = known.reduce((a, x) => x.r > a.r ? x : a);
      if (avg - low.r >= 15) focus.push({ icon: "calendar-x", text: `${WEEKDAY_NAMES[low.i]} are your weakest day (${low.r}% vs ${avg}% average). Plan them the night before.` });
      if (high.r - avg >= 10 && high.r >= 70) working.push({ icon: "calendar-check", text: `${WEEKDAY_NAMES[high.i]} are your strongest day at ${high.r}%.` });
    }
  }

  getCheckpointPace(todayStr).forEach(c => {
    if (c.daysLeft < 0) focus.push({ icon: "alarm-clock", text: `${c.name} is ${Math.abs(c.daysLeft)}d overdue at ${c.actual}%. Finish it or move the deadline on Blueprint.` });
    else if (c.gap >= 15) focus.push({ icon: "gauge", text: `${c.name} is ${c.actual}% done with ${c.daysLeft}d left, about ${c.expected}% would be on pace.` });
  });

  if (current.todosTotal >= 5) {
    const rate = Math.round(current.todosDone / current.todosTotal * 100);
    if (rate >= 80) working.push({ icon: "list-checks", text: `You finished ${current.todosDone} of ${current.todosTotal} to-dos (${rate}%).` });
    else if (rate < 60) focus.push({ icon: "list-todo", text: `Only ${current.todosDone} of ${current.todosTotal} to-dos got done (${rate}%). Try fewer, smaller tasks each day.` });
  }

  if (previous?.mood != null && current.mood !== null && current.mood - previous.mood <= -0.5) {
    focus.push({ icon: "cloud", text: `Mood dipped from ${moodLabel(previous.mood)} to ${moodLabel(current.mood)} on average.` });
  }
  const link = getMoodHabitLink(patternDates);
  if (link && link.diff > 0) working.push({ icon: "heart", text: `On days you hit 80%+ of habits your mood averages ${moodLabel(link.high)}, vs ${moodLabel(link.low)} on low days.` });

  return { working: working.slice(0, 5), focus: focus.slice(0, 5) };
}
