let constitutionEditMode = false;

function toggleConstitutionEdit() {
  constitutionEditMode = !constitutionEditMode;
  renderConstitution();
}

function renderConstitution() {
  const container = document.getElementById("constitution-container");
  if (!container) return;

  let html = "";

  // Identity Statement Hero
  html += renderIdentityHero();

  // Danger Areas
  html += renderDangerSection();

  // Rules
  html += renderRulesSection();

  container.innerHTML = html;

  // Update edit button
  const btn = document.getElementById("constitution-edit-btn");
  if (btn) {
    if (constitutionEditMode) {
      btn.className = "btn btn-primary";
      btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> Done Editing';
    } else {
      btn.className = "btn btn-outline";
      btn.innerHTML = '<i data-lucide="pencil" class="w-3.5 h-3.5"></i> Edit';
    }
  }

  lucide.createIcons();
}

function renderIdentityHero() {
  const stmt = appState.identityStatement;
  if (constitutionEditMode) {
    return `
      <div class="card identity-hero">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-dim">Identity Statement</span>
        </div>
        <input type="text" value="${escapeHtml(stmt.title)}" onchange="updateIdentityField('title', this.value)" class="text-lg font-bold bg-transparent text-green border-b border-transparent focus:border-green w-full py-1 mb-2 font-display" style="font-family:'Newsreader',serif" placeholder="Who I Am Becoming">
        <textarea rows="3" onchange="updateIdentityField('description', this.value)" class="w-full text-sm bg-transparent text-text leading-relaxed border border-transparent focus:border-blue rounded px-2 py-1 resize-none" placeholder="I am a...">${escapeHtml(stmt.description)}</textarea>
      </div>`;
  }
  if (!stmt.description) return "";
  return `
    <div class="card identity-hero !bg-gradient-to-br !from-green/[0.04] !to-transparent !border-green/20">
      <span class="text-[10px] font-bold uppercase tracking-wider text-green mb-2 block">${escapeHtml(stmt.title)}</span>
      <p class="text-base md:text-lg font-display text-text leading-relaxed" style="font-family:'Newsreader',serif">${escapeHtml(stmt.description)}</p>
    </div>`;
}

function renderDangerSection() {
  const areas = appState.dangerAreas || [];
  let itemsHtml = "";

  areas.forEach((area, idx) => {
    if (constitutionEditMode) {
      itemsHtml += `
        <div class="danger-card editing">
          <div class="flex items-center justify-between gap-2 mb-2">
            <input type="text" value="${escapeHtml(area.title)}" onchange="updateDangerField(${idx},'title',this.value)" class="text-xs font-bold bg-transparent text-amber border-b border-transparent focus:border-amber flex-1 py-0.5 min-w-0" placeholder="Danger area title">
            <button onclick="deleteDangerArea(${idx})" class="text-red hover:bg-red/10 p-1 rounded shrink-0"><i data-lucide="x" class="w-3 h-3"></i></button>
          </div>
          <textarea rows="2" onchange="updateDangerField(${idx},'reality',this.value)" class="w-full text-[11px] bg-transparent text-text-dim border border-transparent focus:border-amber rounded px-1 py-0.5 mb-1 resize-none" placeholder="What does this pattern look like?">${escapeHtml(area.reality)}</textarea>
          <textarea rows="2" onchange="updateDangerField(${idx},'reminder',this.value)" class="w-full text-[11px] bg-transparent text-amber/80 border border-transparent focus:border-amber rounded px-1 py-0.5 resize-none font-bold" placeholder="What reminder counters this?">${escapeHtml(area.reminder)}</textarea>
        </div>`;
    } else {
      itemsHtml += `
        <div class="danger-card">
          <div class="danger-card-header" onclick="toggleDangerCollapse(this)">
            <div class="flex items-center gap-2 min-w-0">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber shrink-0"></i>
              <span class="text-xs font-bold text-text">${escapeHtml(area.title)}</span>
            </div>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-text-dim shrink-0 danger-chevron"></i>
          </div>
          <div class="danger-card-body">
            <p class="text-[11px] text-text-dim leading-relaxed"><span class="text-text-dim/60 font-bold">Reality: </span>${escapeHtml(area.reality)}</p>
            <p class="text-[11px] text-amber/80 leading-relaxed mt-1 font-semibold"><span class="text-amber/60 font-bold">Reminder: </span>${escapeHtml(area.reminder)}</p>
          </div>
        </div>`;
    }
  });

  const addBtn = constitutionEditMode
    ? `<button onclick="addDangerArea()" class="w-full border-2 border-dashed border-red/20 hover:border-red/40 rounded py-3 text-[11px] font-bold text-text-dim hover:text-red transition-colors"><i data-lucide="plus" class="w-3.5 h-3.5 inline mr-1"></i> Add Danger Area</button>`
    : "";

  return `
    <div class="card">
      <div class="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div class="card-header border-0 p-0 m-0"><i data-lucide="shield-alert" class="w-3.5 h-3.5 text-amber inline mr-1.5"></i>Danger Areas</div>
        ${areas.length > 0 && !constitutionEditMode ? `<span class="text-[10px] text-text-dim/60">${areas.length} patterns</span>` : ""}
      </div>
      <div class="space-y-2">${itemsHtml}</div>
      ${addBtn}
      ${areas.length === 0 && !constitutionEditMode ? `<p class="text-[11px] text-text-dim italic">No danger areas defined yet. Tap Edit to add your self-sabotage patterns.</p>` : ""}
    </div>`;
}

function renderRulesSection() {
  const rules = appState.rules || [];
  let itemsHtml = "";

  if (constitutionEditMode) {
    rules.forEach((rule, idx) => {
      itemsHtml += `
        <div class="rule-item editing">
          <span class="rule-number">${idx + 1}</span>
          <input type="text" value="${escapeHtml(rule.text)}" onchange="updateRuleField(${idx}, this.value)" class="flex-1 text-xs bg-transparent text-text border-b border-transparent focus:border-blue py-0.5 min-w-0" placeholder="Your personal law...">
          <button onclick="deleteRule(${idx})" class="text-red hover:bg-red/10 p-1 rounded shrink-0"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>`;
    });
  } else {
    rules.forEach((rule, idx) => {
      itemsHtml += `
        <div class="rule-item">
          <span class="rule-number">${idx + 1}</span>
          <span class="text-xs text-text leading-relaxed">${escapeHtml(rule.text)}</span>
        </div>`;
    });
  }

  const addBtn = constitutionEditMode
    ? `<button onclick="addRule()" class="w-full border-2 border-dashed border-green/20 hover:border-green/40 rounded py-3 text-[11px] font-bold text-text-dim hover:text-green transition-colors mt-2"><i data-lucide="plus" class="w-3.5 h-3.5 inline mr-1"></i> Add Rule</button>`
    : "";

  return `
    <div class="card">
      <div class="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div class="card-header border-0 p-0 m-0"><i data-lucide="scroll-text" class="w-3.5 h-3.5 text-green inline mr-1.5"></i>Personal Rules</div>
        ${rules.length > 0 && !constitutionEditMode ? `<span class="text-[10px] text-text-dim/60">${rules.length} laws</span>` : ""}
      </div>
      <div class="rules-list">${itemsHtml}</div>
      ${addBtn}
      ${rules.length === 0 && !constitutionEditMode ? `<p class="text-[11px] text-text-dim italic">No personal rules defined yet. Tap Edit to add your non-negotiable laws.</p>` : ""}
    </div>`;
}

// ─── Identity Statement CRUD ──────────────────────────────

function updateIdentityField(field, val) {
  appState.identityStatement[field] = val;
  persistState();
}

// ─── Danger Areas CRUD ────────────────────────────────────

function addDangerArea() {
  appState.dangerAreas.push({
    id: "da_" + Date.now(),
    title: "New Danger Area",
    reality: "Describe the pattern...",
    reminder: "Your counter-reminder..."
  });
  persistState();
  renderConstitution();
}

function updateDangerField(idx, field, val) {
  if (appState.dangerAreas[idx]) {
    appState.dangerAreas[idx][field] = val;
    persistState();
  }
}

function deleteDangerArea(idx) {
  if (!confirm(`Delete "${appState.dangerAreas[idx]?.title || 'this danger area'}"?`)) return;
  appState.dangerAreas.splice(idx, 1);
  persistState();
  renderConstitution();
}

function toggleDangerCollapse(headerEl) {
  const card = headerEl.closest(".danger-card");
  if (!card) return;
  card.classList.toggle("collapsed");
}

// ─── Rules CRUD ───────────────────────────────────────────

function addRule() {
  appState.rules.push({ id: "rule_" + Date.now(), text: "New personal law..." });
  persistState();
  renderConstitution();
}

function updateRuleField(idx, val) {
  if (appState.rules[idx]) {
    appState.rules[idx].text = val;
    persistState();
  }
}

function deleteRule(idx) {
  if (!confirm(`Delete rule "${appState.rules[idx]?.text || 'this rule'}"?`)) return;
  appState.rules.splice(idx, 1);
  persistState();
  renderConstitution();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
