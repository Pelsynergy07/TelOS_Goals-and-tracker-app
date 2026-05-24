const aiQuestions = [
  { id: "vision", q: "What is your ultimate career vision? (role, industry, company you'd love to work for)", hint: "e.g. Google Interaction Designer by 27" },
  { id: "skills", q: "What skills or expertise do you want to be known for?", hint: "e.g. visual design, systems thinking, ML" },
  { id: "brand", q: "What kind of personal brand or public presence do you want to build?", hint: "e.g. YouTube design channel, writing, speaking" },
  { id: "identity", q: "Describe the person you want to become - habits, discipline, health, identity.", hint: "e.g. disciplined, great physique, focused" },
  { id: "routine", q: "What does your ideal daily routine look like?", hint: "e.g. wake 4am, deep work, gym, read, sleep early" },
  { id: "projects", q: "What creative or side projects excite you in the next 6 months?", hint: "e.g. portfolio projects, UI explorations, a video" },
  { id: "struggles", q: "What habits or behaviors do you want to change?", hint: "e.g. PMO, phone distractions, skipping gym" }
];

let aiStep = 0;
let aiAnswers = {};
let aiModalMode = "guided";
let aiIsListening = false;
let aiMediaRecorder = null;
let aiAudioChunks = [];
let aiAudioStream = null;

function openAIGoalGenerator() {
  aiStep = 0;
  aiAnswers = {};
  aiModalMode = "guided";
  stopAIListening();
  document.getElementById("ai-modal").style.display = "flex";
  renderAIStep();
}

function openAIGoalImport() {
  aiStep = 0;
  aiAnswers = {};
  aiModalMode = "import";
  stopAIListening();
  document.getElementById("ai-modal").style.display = "flex";
  renderAIImportMode();
}

function openChatGPTPlanner() {
  window.open("https://chatgpt.com", "_blank", "noopener,noreferrer");
}

function closeAIModal() {
  stopAIListening();
  document.getElementById("ai-modal").style.display = "none";
}

function renderAIModeTabs() {
  const guidedCls = aiModalMode === "guided"
    ? "bg-green/15 text-green border-green/30"
    : "bg-[rgba(255,255,255,0.02)] text-text-dim border-border hover:bg-white/5";
  const importCls = aiModalMode === "import"
    ? "bg-green/15 text-green border-green/30"
    : "bg-[rgba(255,255,255,0.02)] text-text-dim border-border hover:bg-white/5";

  return `
    <div class="flex items-center gap-2 mb-4">
      <button onclick="switchAIMode('guided')" class="text-[10px] font-bold px-3 py-1.5 rounded-full border ${guidedCls}">Guided Questions</button>
      <button onclick="switchAIMode('import')" class="text-[10px] font-bold px-3 py-1.5 rounded-full border ${importCls}">Paste JSON</button>
    </div>`;
}

function switchAIMode(mode) {
  aiModalMode = mode;
  stopAIListening();
  if (mode === "import") renderAIImportMode();
  else renderAIStep();
}

function supportsSpeechToText() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

function getAITranscriptionEndpoint() {
  const { aiEndpoint } = appState.settings;
  if (!aiEndpoint) throw new Error("Add an AI endpoint in Settings first.");
  const base = aiEndpoint.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
  return `${base}/audio/transcriptions`;
}

function getAITranscriptionModel() {
  return appState.settings.aiSpeechModel || appState.settings.aiModel;
}

async function transcribeAIAudio(blob) {
  const { aiApiKey } = appState.settings;
  const model = getAITranscriptionModel();
  if (!aiApiKey || !model) throw new Error("Add API key and model in Settings before using voice-to-text.");

  const endpoint = getAITranscriptionEndpoint();
  const formData = new FormData();
  formData.append("file", new File([blob], "life-os-voice.webm", { type: blob.type || "audio/webm" }));
  formData.append("model", model);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Authorization": "Bearer " + aiApiKey },
    body: formData
  });

  if (!res.ok) {
    const body = await res.clone().text();
    let detail = body;
    try { const j = JSON.parse(body); detail = j.error?.message || j.error || JSON.stringify(j); } catch {}
    throw new Error(`Voice transcription failed: ${res.status} ${detail.slice(0, 240)}`);
  }

  const data = await res.json();
  return (data.text || data.output_text || "").trim();
}

function setAIVoiceStatus(text, tone = "dim") {
  const el = document.getElementById("ai-voice-status");
  if (!el) return;
  const cls = tone === "red" ? "text-red" : tone === "green" ? "text-green" : "text-text-dim/70";
  el.className = `text-[10px] ${cls}`;
  el.textContent = text;
}

async function toggleAIListening() {
  if (!supportsSpeechToText()) return;
  if (aiIsListening) {
    if (aiMediaRecorder && aiMediaRecorder.state !== "inactive") aiMediaRecorder.stop();
    setAIVoiceStatus("Finishing recording...");
  } else {
    const { aiApiKey, aiEndpoint } = appState.settings;
    if (!aiApiKey || !aiEndpoint || !getAITranscriptionModel()) {
      setAIVoiceStatus("Add API key, endpoint, and speech-capable model in Settings first.", "red");
      return;
    }
    try {
      aiAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      aiAudioChunks = [];
      aiMediaRecorder = new MediaRecorder(aiAudioStream);
      aiMediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) aiAudioChunks.push(event.data);
      };
      aiMediaRecorder.onstop = async () => {
        const input = document.getElementById("ai-answer-input");
        const blob = new Blob(aiAudioChunks, { type: aiMediaRecorder?.mimeType || "audio/webm" });
        aiIsListening = false;
        updateAISpeechButton();
        if (aiAudioStream) {
          aiAudioStream.getTracks().forEach(track => track.stop());
          aiAudioStream = null;
        }
        setAIVoiceStatus("Transcribing with AI...");
        try {
          const transcript = await transcribeAIAudio(blob);
          if (input && transcript) {
            input.value = input.value ? `${input.value.trim()} ${transcript}`.trim() : transcript;
          }
          setAIVoiceStatus(transcript ? "Voice added." : "No speech detected.", transcript ? "green" : "red");
        } catch (err) {
          setAIVoiceStatus(err.message || "Voice transcription failed.", "red");
        }
      };
      aiMediaRecorder.start();
      aiIsListening = true;
      setAIVoiceStatus("Recording...");
    } catch (err) {
      setAIVoiceStatus(err.message || "Microphone access failed.", "red");
    }
    updateAISpeechButton();
  }
}

function stopAIListening() {
  if (aiMediaRecorder && aiIsListening && aiMediaRecorder.state !== "inactive") aiMediaRecorder.stop();
  if (aiAudioStream) {
    aiAudioStream.getTracks().forEach(track => track.stop());
    aiAudioStream = null;
  }
  aiIsListening = false;
  updateAISpeechButton();
}

function updateAISpeechButton() {
  const btn = document.getElementById("ai-voice-btn");
  if (!btn) return;
  btn.textContent = aiIsListening ? "Stop recording" : "Use mic";
  btn.className = `text-[10px] font-bold px-3 py-1.5 rounded-full border ${aiIsListening ? "bg-red/15 text-red border-red/30" : "bg-[rgba(255,255,255,0.02)] text-text-dim border-border hover:bg-white/5"}`;
}

function renderAIStep() {
  const container = document.getElementById("ai-question-container");
  if (!container) return;
  const q = aiQuestions[aiStep];
  if (!q) { submitAIAnswers(); return; }

  const prev = aiAnswers[q.id] || "";
  const speechBtn = supportsSpeechToText()
    ? `<button id="ai-voice-btn" onclick="toggleAIListening()" class="text-[10px] font-bold px-3 py-1.5 rounded-full border bg-[rgba(255,255,255,0.02)] text-text-dim border-border hover:bg-white/5">Use mic</button>`
    : `<span class="text-[10px] text-text-dim/60">Microphone recording depends on browser support.</span>`;

  container.innerHTML = `
    ${renderAIModeTabs()}
    <div class="text-[10px] text-text-dim font-bold uppercase tracking-wider mb-1">Question ${aiStep + 1} of ${aiQuestions.length}</div>
    <p class="text-sm font-bold text-text mb-3">${q.q}</p>
    <textarea id="ai-answer-input" rows="4" class="w-full text-xs" placeholder="${q.hint}">${prev}</textarea>
    <div id="ai-voice-status" class="text-[10px] text-text-dim/70 mt-2"></div>
    <div class="flex items-center justify-between gap-3 mt-4 flex-wrap">
      <div class="flex items-center gap-2">
        <button onclick="${aiStep > 0 ? 'aiStep--; renderAIStep();' : 'closeAIModal()'}" class="text-[10px] font-bold text-text-dim hover:text-text">${aiStep > 0 ? 'Back' : 'Cancel'}</button>
        ${speechBtn}
      </div>
      <button onclick="nextAIStep()" class="btn btn-primary text-[10px]">${aiStep < aiQuestions.length - 1 ? 'Next' : 'Generate Goals'}</button>
    </div>`;
  updateAISpeechButton();
}

function renderAIImportMode() {
  const container = document.getElementById("ai-question-container");
  if (!container) return;
  container.innerHTML = `
    ${renderAIModeTabs()}
    <div class="space-y-3">
      <div>
        <p class="text-sm font-bold text-text">Use ChatGPT as your planner</p>
        <p class="text-xs text-text-dim mt-1">Copy the prompt below into ChatGPT, answer the curated questions there, then paste the final JSON back here.</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="openChatGPTPlanner()" class="btn btn-outline text-[10px]">Open ChatGPT</button>
        <button onclick="copyAIGoalPrompt()" class="btn btn-primary text-[10px]">Copy ChatGPT Prompt</button>
        <span id="ai-import-msg" class="text-xs font-semibold text-text-dim"></span>
      </div>
      <div class="space-y-2">
        <label class="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Paste generated JSON</label>
        <textarea id="ai-import-json" rows="12" class="w-full text-xs" placeholder='{"northStar":[...],"sixMonth":[...],"threeMonth":[...],"oneMonth":[...],"linkedHabits":[...]}'></textarea>
      </div>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <button onclick="closeAIModal()" class="text-[10px] font-bold text-text-dim hover:text-text">Cancel</button>
        <button onclick="importAIGoalsFromTextarea()" class="btn btn-primary text-[10px]">Import JSON</button>
      </div>
    </div>`;
}

function nextAIStep() {
  const input = document.getElementById("ai-answer-input");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  aiAnswers[aiQuestions[aiStep].id] = val;
  stopAIListening();
  aiStep++;
  renderAIStep();
}

function getAIGoalImportPrompt() {
  return AI_GOAL_IMPORT_PROMPT_TEMPLATE
    .replace("{{TODAY}}", getLocalDateString())
    .replace("{{HABIT_IDS}}", JSON.stringify(appState.settings.scheduleBlocks.map(b => b.id)));
}

async function copyAIGoalPrompt() {
  const msgEl = document.getElementById("ai-import-msg");
  try {
    await navigator.clipboard.writeText(getAIGoalImportPrompt());
    if (msgEl) {
      msgEl.className = "text-xs font-semibold text-green";
      msgEl.textContent = "Prompt copied.";
    }
  } catch {
    if (msgEl) {
      msgEl.className = "text-xs font-semibold text-red";
      msgEl.textContent = "Clipboard copy failed. Open the prompt file directly.";
    }
  }
}

function normalizeGoalItems(items, prefix) {
  return (items || []).map(item => ({
    ...item,
    id: item.id || `${prefix}_${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    completed: !!item.completed
  }));
}

function validateGoalCascade(content) {
  if (!content || typeof content !== "object") throw new Error("Imported JSON must be an object.");
  if (!Array.isArray(content.northStar) || !Array.isArray(content.sixMonth) || !Array.isArray(content.threeMonth) || !Array.isArray(content.linkedHabits)) {
    throw new Error("JSON must include northStar, sixMonth, threeMonth, and linkedHabits arrays.");
  }
}

function applyGeneratedGoalCascade(content) {
  validateGoalCascade(content);

  const northStar = normalizeGoalItems(content.northStar, "ns").map(item => ({
    id: item.id,
    title: item.title || "Untitled North Star",
    description: item.description || "",
    completed: !!item.completed
  }));

  const validNorthStarIds = new Set(northStar.map(n => n.id));
  const mapGoal = (goal) => ({
    id: goal.id,
    name: goal.name || "Untitled Goal",
    progress: Number(goal.progress || 0),
    target: Number(goal.target || 0),
    unit: goal.unit || "",
    deadline: goal.deadline || "",
    northStarId: validNorthStarIds.has(goal.northStarId) ? goal.northStarId : "",
    completed: !!goal.completed
  });

  appState.goals.northStar = northStar;
  appState.goals.sixMonth = normalizeGoalItems(content.sixMonth, "g").map(mapGoal);
  appState.goals.threeMonth = normalizeGoalItems(content.threeMonth, "g").map(mapGoal);
  appState.goals.oneMonth = (content.oneMonth || []).map(mapGoal);
  appState.goals.linkedHabits = (content.linkedHabits || []).filter(link => link?.habitId && validNorthStarIds.has(link.northStarId));

  persistState();
  closeAIModal();
  renderGoalsHub();
  if (typeof renderReview === "function") renderReview();
  if (typeof renderToday === "function") renderToday();
  celebrate();
}

function importAIGoalsFromTextarea() {
  const input = document.getElementById("ai-import-json");
  const msgEl = document.getElementById("ai-import-msg");
  if (!input) return;
  try {
    const raw = input.value.trim();
    if (!raw) throw new Error("Paste the generated JSON first.");
    const content = JSON.parse(raw.replace(/```json|```/g, "").trim());
    applyGeneratedGoalCascade(content);
  } catch (err) {
    if (msgEl) {
      msgEl.className = "text-xs font-semibold text-red";
      msgEl.textContent = err.message || "Invalid JSON.";
    }
  }
}

async function submitAIAnswers() {
  const container = document.getElementById("ai-question-container");
  container.innerHTML = `${renderAIModeTabs()}<p class="text-xs text-text-dim animate-pulse">Generating your goal cascade...</p>`;

  const systemPrompt = `You are a life/goal coach. Based on the user's answers, generate a complete goal cascade in JSON format.

Rules:
- northStar: Array of 3-5 pillar objects { id: string, title: string, description: string, completed: false }
- sixMonth: Array of 3-6 goals { id: string, name: string, progress: 0, target: number, unit: string, deadline: string (YYYY-MM-DD, ~6 months from now), northStarId: string (match a northStar id), completed: false }
- threeMonth: Array of 3-6 goals { id: string, name: string, progress: 0, target: number, unit: string, deadline: string (YYYY-MM-DD, ~3 months from now), northStarId: string (match a northStar id), completed: false }
- oneMonth: Array of 2-4 goals { id: string, name: string, progress: 0, target: number, unit: string, deadline: string (YYYY-MM-DD, ~1 month from now), northStarId: string (match a northStar id), completed: false }
- linkedHabits: For each north star, link 2-4 daily habits from this list by id: ${JSON.stringify(appState.settings.scheduleBlocks.map(b => b.id))}. Array of { habitId: string, northStarId: string }
- Use realistic targets (e.g. 6 videos, 80%, 12 books, 90 days).
- Deadlines should be future dates relative to ${getLocalDateString()}.`;

  const userPrompt = `Here are my answers:\n${aiQuestions.map(q => `${q.q}\n${aiAnswers[q.id] || "(skipped)"}`).join("\n\n")}\n\nGenerate the goal cascade JSON. Respond with ONLY valid JSON, no markdown.`;

  try {
    if (location.protocol === "file:") throw new Error("Browsers block API calls from local files. Use the Paste JSON tab instead, or run a local server with start.bat.");

    const { aiApiKey, aiEndpoint, aiModel } = appState.settings;
    if (!aiApiKey || !aiEndpoint || !aiModel) {
      throw new Error("No AI API setup found. Use the Paste JSON tab or add API settings first.");
    }

    let endpoint = aiEndpoint.replace(/\/+$/, "");
    if (!endpoint.endsWith("/chat/completions")) endpoint += "/chat/completions";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + aiApiKey },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const body = await res.clone().text();
      let detail = body;
      try { const j = JSON.parse(body); detail = j.error?.message || j.error || JSON.stringify(j); } catch {}
      throw new Error(`${res.status}: ${detail.slice(0, 500)}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const content = JSON.parse(raw.replace(/```json|```/g, "").trim());
    applyGeneratedGoalCascade(content);
  } catch (err) {
    const msg = (err.name === "TypeError" || (err.message || "").includes("fetch"))
      ? 'Network error. Use the Paste JSON tab, or run <code class="text-[10px] bg-white/10 px-1 rounded">start.bat</code>.'
      : err.message;
    container.innerHTML = `${renderAIModeTabs()}<p class="text-xs text-red font-bold">${msg}</p>
      <div class="flex items-center justify-between mt-3">
        <button onclick="switchAIMode('import')" class="btn btn-outline text-[10px]">Use Paste JSON Instead</button>
        <button onclick="renderAIStep()" class="btn btn-primary text-[10px]">Try again</button>
      </div>`;
  }
}
