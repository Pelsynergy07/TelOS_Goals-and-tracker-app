// ============================================================
//  ✅ Life OS — Daily To-dos
//  ============================================================
//  A minimal task list per day, saved under appState.todos[date]
//  so it can be reviewed later on the Progress page.
// ============================================================

const TODO_MAX_LENGTH = 200;
const TODO_CARRY_LOOKBACK_DAYS = 7;

function getTodos(dateStr) {
  const list = appState.todos?.[dateStr];
  return Array.isArray(list) ? list : [];
}

// Tasks moved forward to another day are counted on the day they landed.
function getCountedTodos(dateStr) {
  return getTodos(dateStr).filter(t => !t.movedTo);
}

function makeTodoId() {
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function addTodo(dateStr, text) {
  const clean = String(text || "").trim().slice(0, TODO_MAX_LENGTH);
  if (!clean || dateStr > getLocalDateString()) return false;
  appState.todos ??= {};
  (appState.todos[dateStr] ??= []).push({ id: makeTodoId(), text: clean, done: false });
  persistState();
  return true;
}

function toggleTodo(dateStr, id) {
  const todo = getTodos(dateStr).find(t => t.id === id);
  if (!todo || todo.movedTo) return;
  todo.done = !todo.done;
  if (todo.done) { todo.doneAt = new Date().toISOString(); playTapSound(); }
  else delete todo.doneAt;
  persistState();
  renderTodos();
}

function deleteTodo(dateStr, id) {
  const list = getTodos(dateStr).filter(t => t.id !== id);
  if (list.length) appState.todos[dateStr] = list;
  else delete appState.todos?.[dateStr];
  persistState();
  renderTodos();
}

// Open tasks from the most recent earlier day (within a week) that had any tasks.
function getCarryOverSource(dateStr) {
  for (let i = 1; i <= TODO_CARRY_LOOKBACK_DAYS; i++) {
    const day = addDateDays(dateStr, -i);
    const todos = getTodos(day);
    if (!todos.length) continue;
    const open = todos.filter(t => !t.done && !t.movedTo);
    return open.length ? { date: day, items: open } : null;
  }
  return null;
}

function carryOverTodos(dateStr) {
  const source = getCarryOverSource(dateStr);
  if (!source || dateStr > getLocalDateString()) return;
  appState.todos[dateStr] ??= [];
  source.items.forEach(t => {
    t.movedTo = dateStr;
    appState.todos[dateStr].push({ id: makeTodoId(), text: t.text, done: false, carriedFrom: source.date });
  });
  persistState();
  renderTodos();
}

function submitTodo(event) {
  event.preventDefault();
  const input = document.getElementById("todo-input");
  if (!input) return;
  if (addTodo(trackerDate, input.value)) {
    input.value = "";
    renderTodos();
    input.focus();
  }
}

function renderTodos() {
  const list = document.getElementById("todo-list");
  if (!list) return;
  const todos = getTodos(trackerDate);
  const counted = todos.filter(t => !t.movedTo);
  const done = counted.filter(t => t.done).length;

  const summary = document.getElementById("todo-summary");
  if (summary) summary.textContent = counted.length ? `${done} of ${counted.length} done` : formatDateLabelShort(trackerDate);

  list.innerHTML = todos.map(t => {
    const moved = !!t.movedTo;
    const label = moved ? `Moved to ${formatDateLabelShort(t.movedTo)}` : t.carriedFrom ? `From ${formatDateLabelShort(t.carriedFrom)}` : "";
    return `<li class="todo-item${t.done ? " is-done" : ""}${moved ? " is-moved" : ""}">
      <button type="button" class="todo-toggle" role="checkbox" aria-checked="${!!t.done}" ${moved ? "disabled" : ""} onclick="toggleTodo('${trackerDate}','${t.id}')">
        <span class="habit-row-box" aria-hidden="true"><i data-lucide="${moved ? "arrow-right" : "check"}"></i></span>
        <span class="todo-text">${escapeHtml(t.text)}${label ? `<span class="todo-meta">${label}</span>` : ""}</span>
      </button>
      <button type="button" class="icon-button todo-delete" aria-label="Delete ${escapeHtml(t.text)}" onclick="deleteTodo('${trackerDate}','${t.id}')"><i data-lucide="x" aria-hidden="true"></i></button>
    </li>`;
  }).join("");
  list.hidden = todos.length === 0;

  const carry = document.getElementById("todo-carry");
  if (carry) {
    const source = trackerDate === getLocalDateString() ? getCarryOverSource(trackerDate) : null;
    carry.hidden = !source;
    carry.innerHTML = source ? `<span>${source.items.length} unfinished from ${formattedDayLabel(source.date)}</span><button type="button" class="btn btn-outline" onclick="carryOverTodos('${trackerDate}')"><i data-lucide="arrow-down-to-line" aria-hidden="true"></i>Move to today</button>` : "";
  }

  const input = document.getElementById("todo-input");
  if (input) input.placeholder = trackerDate === getLocalDateString() ? "Add a task for today…" : `Add a task for ${formatDateLabelShort(trackerDate)}…`;
  lucide.createIcons();
}
