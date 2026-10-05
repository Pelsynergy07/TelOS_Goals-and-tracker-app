// ============================================================
//  📅 Life OS — Today Tab
//  ============================================================
//  Daily view: habit month grids, mood, reflection fields
//  (daily always + weekly/monthly extras).
// ============================================================

function renderToday() {
  const picker = document.getElementById("execution-date");
  if (picker) { picker.value = trackerDate; picker.max = getLocalDateString(); }
  const todayButton = document.getElementById("execution-today-button");
  if (todayButton) todayButton.hidden = trackerDate === getLocalDateString();
  updateTodayDateHeader();
  calculateStreaks();
  renderHabitMonthGrids();
  renderTodayDeadlines();
  renderAllGoalsCountdown();
  renderCheckpointDisclosure();
  loadDailyReflection();
}

let pendingCheckpointCompletion = null;
function updateTodayDateHeader() {
  const d = parseLocalDate(trackerDate);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const h1 = document.getElementById("today-day-header");
  const h2 = document.getElementById("today-date-header");
  if (h1) h1.textContent = days[d.getDay()];
  if (h2) h2.textContent = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function renderHabitMonthGrids() {
  const container = document.getElementById("today-habit-cards-container");
  if (!container) return;
  container.innerHTML = "";
  const todayStr = getLocalDateString();
  const today = parseLocalDate(trackerDate || todayStr);

  const blocks = getLinkedBlocks();
  if (blocks.length === 0) {
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

  blocks.forEach(block => {
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

      const cell = document.createElement("button");
      cell.type = "button";
      cell.textContent = i % 5 === 0 ? i : "";
      cell.disabled = isFuture;
      cell.setAttribute("aria-label", `${block.name}, ${dStr}`);
      cell.setAttribute("aria-pressed", String(checked));
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
    card.className = "card habit-sort-card !p-3";
    card.dataset.habitId = block.id;
    const header = document.createElement("div");
    header.className = "flex items-center justify-between mb-2";
    const streak = getBlockStreak(block.id);
    header.innerHTML = `
      <div>
        <p class="item-heading text-caption font-bold text-text leading-tight">${escapeHtml(block.name)}</p>
        <span class="text-caption text-text-dim">${escapeHtml(block.time || '')}</span>
      </div>
      <span class="flex items-center gap-1.5 text-sm font-bold"><i data-lucide="flame" class="w-4 h-4 text-text-dim"></i>${streak}</span>
    `;
    card.appendChild(header);
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "habit-drag-handle";
    handle.dataset.habitHandle = block.id;
    handle.innerHTML = '<i data-lucide="grip-vertical" aria-hidden="true"></i>';
    handle.setAttribute("aria-label", `Drag to reorder ${block.name}. Keyboard: hold Alt and press an arrow key.`);
    handle.title = "Drag to reorder";
    header.prepend(handle);
    bindHabitDrag(handle, card, container);
    card.appendChild(grid);
    if (block.fields.some(f => f.type !== "checkbox")) {
      const details = document.createElement("details");
      details.className = "habit-details";
      const values = appState.logs[trackerDate]?.[block.id] || {};
      details.innerHTML = `<summary>Optional details · ${formatDateLabelShort(trackerDate)}</summary><form class="habit-details-form">${block.fields.filter(f => f.type !== "checkbox").map(f => `<label class="editor-field">${escapeHtml(f.label || f.id)}<input data-detail-field="${f.id}" type="${f.type}" ${f.type === 'number' ? 'min="0" step="any"' : ''} value="${escapeHtml(values[f.id] ?? '')}"></label>`).join('')}<p class="habit-details-error" role="status"></p><button type="submit" class="btn btn-outline">Save details</button></form>`;
      details.querySelector("form").onsubmit = event => { event.preventDefault(); saveInlineHabitDetails(trackerDate, block.id, event.currentTarget); };
      card.appendChild(details);
    }
    container.appendChild(card);
  });
  lucide.createIcons();
}

// Pointer events support mouse, pen and touch without making calendar cells draggable.
function bindHabitDrag(handle, card, container) {
  let drag = null;
  const cards = () => [...container.querySelectorAll(".habit-sort-card")];
  const announce = () => {
    const status = document.getElementById("habit-order-status");
    if (status) status.textContent = `Order saved. ${card.querySelector(".item-heading").textContent} is position ${cards().indexOf(card) + 1} of ${cards().length}.`;
  };
  const place = () => {
    if (!drag?.active) return;
    drag.ghost.style.left = `${drag.x - drag.offsetX}px`;
    drag.ghost.style.top = `${drag.y - drag.offsetY}px`;
    const candidates = cards().filter(c => c !== card);
    let nearest = null, distance = Infinity;
    candidates.forEach(c => {
      const rect = c.getBoundingClientRect();
      const d = Math.hypot(drag.x - (rect.left + rect.width / 2), drag.y - (rect.top + rect.height / 2));
      if (d < distance) { distance = d; nearest = c; }
    });
    if (!nearest) return;
    const rect = nearest.getBoundingClientRect();
    // Drop before/after the nearest tile in the grid's reading order.
    const insideRow = drag.y >= rect.top && drag.y <= rect.bottom;
    const before = insideRow ? drag.x < rect.left + rect.width / 2 : drag.y < rect.top + rect.height / 2;
    container.insertBefore(card, before ? nearest : nearest.nextSibling);
  };
  const scrollFrame = () => {
    if (!drag?.active) return;
    const scroller = container.closest(".app-content");
    const rect = scroller?.getBoundingClientRect();
    const top = rect?.top ?? 0, bottom = rect?.bottom ?? window.innerHeight;
    const delta = drag.y < top + 60 ? -12 : drag.y > bottom - 60 ? 12 : 0;
    if (delta) {
      if (scroller && scroller.scrollHeight > scroller.clientHeight) scroller.scrollTop += delta;
      else window.scrollBy(0, delta);
      place();
    }
    drag.frame = requestAnimationFrame(scrollFrame);
  };
  handle.onpointerdown = event => {
    if (!event.isPrimary || event.button !== 0 || cards().length < 2) return;
    const rect = card.getBoundingClientRect();
    drag = { id:event.pointerId, startX:event.clientX, startY:event.clientY,
      x:event.clientX, y:event.clientY, offsetX:event.clientX-rect.left,
      offsetY:event.clientY-rect.top, original:cards(), active:false };
    // Listen outside the tile: moving a DOM node can release pointer capture.
    window.addEventListener("pointermove", onMove, {passive:false});
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onBlur);
  };
  const onMove = event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.x = event.clientX; drag.y = event.clientY;
    if (!drag.active && Math.hypot(drag.x-drag.startX, drag.y-drag.startY) < 6) return;
    event.preventDefault();
    if (!drag.active) {
      drag.active = true;
      const rect = card.getBoundingClientRect();
      drag.ghost = card.cloneNode(true);
      drag.ghost.classList.add("habit-drag-ghost");
      drag.ghost.setAttribute("aria-hidden", "true");
      drag.ghost.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      drag.ghost.style.width = `${rect.width}px`;
      document.body.appendChild(drag.ghost);
      card.classList.add("habit-drag-placeholder");
      document.body.classList.add("habit-dragging");
      drag.frame = requestAnimationFrame(scrollFrame);
    }
    place();
  };
  const finish = cancelled => {
    if (!drag) return;
    const previous = drag;
    drag = null;
    cancelAnimationFrame(previous.frame);
    previous.ghost?.remove();
    card.classList.remove("habit-drag-placeholder");
    document.body.classList.remove("habit-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("blur", onBlur);
    if (cancelled) previous.original.forEach(c => container.appendChild(c));
    else if (previous.active) {
      saveHabitBlockOrder(cards().map(c => c.dataset.habitId));
      announce();
    }
    handle.focus({preventScroll:true});
  };
  const onBlur = () => finish(true);
  const onEnd = event => { if (event.pointerId === drag?.id) finish(false); };
  const onCancel = event => { if (event.pointerId === drag?.id) finish(true); };
  handle.onkeydown = event => {
    if (event.key === "Escape" && drag) { event.preventDefault(); finish(true); return; }
    if (!event.altKey || !["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const ordered = cards(), index = ordered.indexOf(card);
    const direction = ["ArrowLeft","ArrowUp"].includes(event.key) ? -1 : 1;
    const neighbor = ordered[index+direction];
    if (!neighbor) return;
    container.insertBefore(card, direction < 0 ? neighbor : neighbor.nextSibling);
    saveHabitBlockOrder(cards().map(c => c.dataset.habitId));
    announce(); handle.focus();
  };
}

function toggleBlockQuickCompletion(dateStr, blockId, checked) {
  if (dateStr > getLocalDateString()) return;
  const block = appState.settings.scheduleBlocks.find(b => b.id === blockId);
  if (!block) return;
  appState.logs[dateStr] ??= {};
  appState.logs[dateStr][blockId] ??= {};
  appState.logs[dateStr][blockId].completed = checked;
  block.fields.filter(f => f.type === "checkbox").forEach(f => { appState.logs[dateStr][blockId][f.id] = checked; });
  if (checked) playTapSound();
  persistState(); renderAll();
}

// ─── Reflection ──────────────────────────────────────────

function getReflectionType() {
  const d = parseLocalDate(trackerDate);
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
  {
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
  const monthKey = `${parseLocalDate(trackerDate).getFullYear()}-${String(parseLocalDate(trackerDate).getMonth() + 1).padStart(2, "0")}`;
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
  const monthKey = `${parseLocalDate(trackerDate).getFullYear()}-${String(parseLocalDate(trackerDate).getMonth() + 1).padStart(2, "0")}`;
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

function updateMetricCard(valueId, barId, count, target) {
  const valEl = document.getElementById(valueId);
  const barEl = document.getElementById(barId);
  if (valEl) valEl.textContent = `${count} / ${target}`;
  if (barEl) barEl.style.width = `${Math.min((count / target) * 100, 100)}%`;
}

// ─── Today's Goal Deadlines ──────────────────────────────

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
    container.classList.remove("hidden");
    container.innerHTML = `<button class="btn btn-outline" onclick="showUpcoming()">Show upcoming checkpoints</button>`;
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
      <button aria-label="Close or remove" onclick="dismissUpcoming()" class="text-text-dim/50 hover:text-text p-1" title="Hide"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
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
    html += `<button onclick="showUpcoming()" class="text-caption text-blue/60 hover:text-blue font-bold mt-1">Show upcoming checkpoints</button>`;
  }

  container.innerHTML = html;
  lucide.createIcons();
}

function makeCheckpointDeadlineRow(g, done, badge) {
  return `
    <div class="checkpoint-deadline-row flex items-center justify-between gap-3 py-3 px-3 rounded-xl bg-[rgba(255,255,255,0.02)] border ${done ? 'border-green/30 bg-green/[0.04]' : 'border-border'}">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-full ${done ? 'bg-green/[0.16]' : 'bg-white/[0.04]'} border ${done ? 'border-green/30' : 'border-border'} flex items-center justify-center shrink-0">
          <i data-lucide="${done ? 'check-check' : 'flag'}" class="w-4 h-4 ${done ? 'text-green' : 'text-blue'}"></i>
        </div>
        <div>
          <span class="item-heading text-xs font-bold ${done ? 'text-green' : 'text-text'}">${escapeHtml(g.name)}</span>
          <span class="text-caption text-text-dim block">${g.progress}/${g.target} ${escapeHtml(g.unit || '')} · ${g.typeLabel}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-caption font-bold ${done ? 'text-green' : 'text-text-dim'}">${badge || (done ? '✓ Done' : 'Pending')}</span>
        <button onclick="${done ? `toggleGoalDeadline('${g.type}','${g.id}',false)` : `openCheckpointCompleteModal('${g.type}','${g.id}')`}" class="text-caption font-bold px-3 py-1.5 rounded-full border transition-colors ${done ? 'bg-green/15 text-green border-green/30 hover:bg-green/20' : 'bg-blue/[0.08] text-blue border-blue/20 hover:bg-blue/[0.14]'}">
          ${done ? 'Completed' : 'Mark complete'}
        </button>
      </div>
    </div>`;
}

function getGoalsDueOnDate(dateStr) {
  const result = [];
  const levels = [
    { key: "sixMonth", label: "6-Month" },
    { key: "threeMonth", label: "3-Month" },
    { key: "oneMonth", label: "1-Month" }
  ];
  levels.forEach(level => {
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
  const levels = [
    { key: "sixMonth", label: "6-Month" },
    { key: "threeMonth", label: "3-Month" },
    { key: "oneMonth", label: "1-Month" }
  ];
  const until = addDateDays(fromDate, daysAhead);
  levels.forEach(level => {
    (appState.goals[level.key] || []).forEach(g => {
      if (!g.deadline) return;
      if (g.deadline > fromDate && g.deadline <= until) {
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
  if (checked && goal.target > 0) goal.progress = goal.target;
  if (!checked && goal.progress >= goal.target) goal.progress = 0;
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
  const levels = [{ key: "sixMonth", label: "6-Month" }, { key: "threeMonth", label: "3-Month" }, { key: "oneMonth", label: "1-Month" }];

  const all = [];
  levels.forEach(l => {
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
    return !g.completed && diff <= 20;
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
          <span class="text-caption uppercase tracking-[0.18em] font-bold ${done ? 'text-green/80' : 'text-text-dim/60'}">${g.type === 'sixMonth' ? '6-Month' : g.type === 'threeMonth' ? '3-Month' : '1-Month'}</span>
          <span class="text-caption ${accent}/80 font-bold">${done ? 'Completed' : diff < 0 ? Math.abs(diff) + 'd overdue' : diff + 'd left'}</span>
        </div>
        <div class="item-heading text-sm font-bold ${done ? 'text-green' : 'text-text'} leading-snug">${escapeHtml(g.name)}</div>
        <div class="text-caption text-text-dim">${g.progress}/${g.target} ${escapeHtml(g.unit || '')}</div>
      </div>
      <button onclick="${done ? `toggleGoalDeadline('${g.type}','${g.id}',false)` : `openCheckpointCompleteModal('${g.type}','${g.id}')`}" class="w-full text-caption font-bold px-3 py-2 rounded-full border transition-colors ${done ? 'bg-green/15 text-green border-green/30 hover:bg-green/20' : 'bg-blue/[0.08] text-blue border-blue/20 hover:bg-blue/[0.14]'}">
        ${done ? 'Completed checkpoint' : 'Complete checkpoint'}
      </button>
    </div>`;
  });

  body.innerHTML = html || '<p class="text-sm text-text-dim col-span-full">No overdue checkpoints or deadlines in the next 20 days.</p>';
}

function toggleAllGoals() {
  appState.settings.goalsCountdownCollapsed = !appState.settings.goalsCountdownCollapsed;
  persistState();
  renderAllGoalsCountdown();
}

function renderCheckpointDisclosure() {
  const disclosure = document.getElementById("execution-checkpoints");
  if (!disclosure) return;
  const goals = ["yearly","sixMonth","threeMonth","oneMonth"].flatMap(level => appState.goals[level] || []);
  disclosure.hidden = goals.length === 0;
  disclosure.open = appState.settings.checkpointsExpanded === true;
  const due = goals.filter(g => !g.completed && g.deadline === trackerDate).length;
  const summary = document.getElementById("execution-checkpoint-summary");
  if (summary) summary.textContent = `${goals.length} ${goals.length === 1 ? 'goal' : 'goals'}${due ? ` · ${due} due on this day` : ''}`;
}
function saveCheckpointDisclosure(open) {
  if (!!appState.settings.checkpointsExpanded === open) return;
  appState.settings.checkpointsExpanded = open;
  persistState({ sync: false });
}
function openExecutionDatePicker() {
  const picker = document.getElementById("execution-date");
  if (!picker) return;
  try { if (typeof picker.showPicker === "function") { picker.showPicker(); return; } } catch {}
  picker.focus();
}
