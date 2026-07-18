// ============================================================
//  📅 Life OS — Today Tab
//  ============================================================
//  Daily view: habit month grids, mood, reflection fields
//  (daily always + weekly/monthly extras).
// ============================================================

function renderToday() {
  updateTodayDateHeader();
  calculateStreaks();
  renderHabitMonthGrids();
  renderTodayDeadlines();
  renderAllGoalsCountdown();
  loadDailyReflection();
}

function updateTodayDateHeader() {
  const d = new Date(trackerDate);
  const h1 = document.getElementById("today-day-header");
  const h2 = document.getElementById("today-date-header");
  if (h1) h1.textContent = DAY_NAMES[d.getDay()];
  if (h2) h2.textContent = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function renderHabitMonthGrids() {
  const container = document.getElementById("today-habit-cards-container");
  if (!container) return;
  container.innerHTML = "";
  const todayStr = getLocalDateString();
  const today = new Date(todayStr);

  if (getLinkedBlocks().length === 0) {
    container.innerHTML = `
      <div class="card flex flex-col items-center justify-center py-12 text-center">
        <i data-lucide="map" class="w-10 h-10 text-text-dim/30 mb-3"></i>
        <p class="text-sm font-bold text-text-dim mb-1">No habits set up yet</p>
        <p class="text-xs text-text-dim/60 mb-4">Link habits to your North Stars in the Blueprint page.</p>
        <button onclick="switchTab('career')" class="btn btn-green text-xs">Set up your goals</button>
      </div>`;
    lucide.createIcons();
    return;
  }

  getLinkedBlocks().forEach(block => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const grid = document.createElement("div");
    grid.className = "habit-month-grid";

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      grid.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const log = appState.logs[dStr];
      let checked = isBlockCompleted(block, log?.[block.id]);
      const isToday = dStr === todayStr;
      const isFuture = dStr > todayStr;

      const cell = document.createElement("div");
      cell.className = `habit-month-cell${checked ? ' checked' : ''}${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`;
      cell.title = isFuture ? `${block.name}: ${dStr} (future dates cannot be marked complete yet)` : `${block.name}: ${dStr}`;
      if (!isFuture) {
        cell.onclick = () => {
          toggleBlockQuickCompletion(dStr, block.id, !checked);
        };
      }
      grid.appendChild(cell);
    }

    const card = document.createElement("div");
    card.className = "card !p-3";
    const header = document.createElement("div");
    header.className = "flex items-center justify-between mb-2";
    const streak = getBlockStreak(block.id);
    header.innerHTML = `
      <div>
        <p class="text-[11px] font-bold text-text leading-tight">${block.name}</p>
        <span class="text-[9px] text-text-dim">${block.time || ''}</span>
      </div>
      <span class="flex items-center gap-1.5 text-sm font-bold"><i data-lucide="flame" class="w-4 h-4 text-text-dim"></i>${streak}</span>
    `;
    card.appendChild(header);
    card.appendChild(grid);
    container.appendChild(card);
  });
  lucide.createIcons();
}

function toggleBlockQuickCompletion(dateStr, blockId, checked) {
  if (dateStr > getLocalDateString()) return;
  if (!appState.logs[dateStr]) appState.logs[dateStr] = {};
  if (checked) playTapSound();
  const log = appState.logs[dateStr];
  log[blockId] = log[blockId] || {};
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  const numberField = block?.fields.find(f => f.type === "number");
  if (numberField) {
    log[blockId][numberField.id] = checked ? 60 : 0;
  } else {
    log[blockId].completed = checked;
  }
  persistState();
  calculateStreaks();
  renderToday();
}

// ─── Reflection ──────────────────────────────────────────

function getReflectionType() {
  const d = new Date(trackerDate);
  const isFriday = d.getDay() === 5;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const isLastDayOfMonth = d.getDate() === lastDay;
  if (isLastDayOfMonth) return "monthly";
  if (isFriday) return "weekly";
  return "daily";
}

function loadDailyReflection() {
  const container = document.getElementById("reflection-container");
  const dailyEl = document.getElementById("reflection-daily");
  const weeklyEl = document.getElementById("reflection-weekly");
  const monthlyEl = document.getElementById("reflection-monthly");
  if (!container) return;
  const type = getReflectionType();
  const showWeekly = type === "weekly";
  const showMonthly = type === "monthly";

  dailyEl.style.display = "block";
  loadDailyFields();

  if (showWeekly) {
    weeklyEl.style.display = "block";
    loadWeeklyReflection();
  } else {
    weeklyEl.style.display = "none";
  }

  if (showMonthly) {
    monthlyEl.style.display = "block";
    loadMonthlyReflection();
  } else {
    monthlyEl.style.display = "none";
  }

  lucide.createIcons();
}

function loadDailyFields() {
  const dateLog = appState.logs[trackerDate] || {};

  const savedFeeling = dateLog.feelingScore;
  if (savedFeeling !== undefined) {
    const btns = document.querySelectorAll("#mood-selector button");
    btns.forEach(b => {
      b.classList.remove("bg-green/20", "border-green", "text-green");
      if (Number(b.dataset.value) === savedFeeling) {
        b.classList.add("bg-green/20", "border-green", "text-green");
      }
    });
  }

  const biggestWin = document.getElementById("field-biggestWin");
  const biggestLearning = document.getElementById("field-biggestLearning");
  if (biggestWin) biggestWin.value = dateLog.biggestWin || "";
  if (biggestLearning) biggestLearning.value = dateLog.biggestLearning || "";
}

function setFeeling(val, btn) {
  const btns = document.querySelectorAll("#mood-selector button");
  btns.forEach(b => b.classList.remove("bg-green/20", "border-green", "text-green"));
  btn.classList.add("bg-green/20", "border-green", "text-green");
  autoSaveField("feelingScore", val);
}

function autoSaveField(fieldKey, value) {
  if (!appState.logs[trackerDate]) appState.logs[trackerDate] = {};
  appState.logs[trackerDate][fieldKey] = value;
  persistState();
  calculateStreaks();
}

function loadWeeklyReflection() {
  const wId = getWeekID(trackerDate);
  const review = appState.weeklyReviews[wId] || { reflection: {} };
  const r = review.reflection;
  const q = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
  q("weekly-win", r.win);
  q("weekly-struggle", r.struggle);
  q("weekly-adjustment", r.adjustment);
}

function saveWeeklyReflectionField(key, val) {
  const wId = getWeekID(trackerDate);
  if (!appState.weeklyReviews[wId]) appState.weeklyReviews[wId] = { score: 0, reflection: {} };
  appState.weeklyReviews[wId].reflection[key] = val;
  persistState();
}

function loadMonthlyReflection() {
  const monthKey = `${new Date(trackerDate).getFullYear()}-${String(new Date(trackerDate).getMonth() + 1).padStart(2, "0")}`;
  const review = appState.monthlyReviews[monthKey] || {};
  const q = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
  q("monthly-lesson", review.lesson);
  q("monthly-goal", review.goal);
  q("monthly-change", review.change);

  const trackBtns = document.querySelectorAll("#monthly-track-selector button");
  trackBtns.forEach(b => {
    b.classList.remove("bg-green/20", "border-green", "text-green");
    if (b.dataset.value === review.onTrack) {
      b.classList.add("bg-green/20", "border-green", "text-green");
    }
  });
}

function saveMonthlyReflectionField(key, val) {
  const monthKey = `${new Date(trackerDate).getFullYear()}-${String(new Date(trackerDate).getMonth() + 1).padStart(2, "0")}`;
  if (!appState.monthlyReviews[monthKey]) appState.monthlyReviews[monthKey] = {};
  appState.monthlyReviews[monthKey][key] = val;
  persistState();
}

function setMonthlyTrack(val, btn) {
  const btns = document.querySelectorAll("#monthly-track-selector button");
  btns.forEach(b => b.classList.remove("bg-green/20", "border-green", "text-green"));
  btn.classList.add("bg-green/20", "border-green", "text-green");
  saveMonthlyReflectionField("onTrack", val);
}

// Deadline & checkpoint management is in js/tabs/checkpoints.js
