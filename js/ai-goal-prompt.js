let _cachedPrompt = null;

async function loadAIGoalPrompt() {
  if (_cachedPrompt) return _cachedPrompt;
  try {
    const res = await fetch("assets/ai-goal-prompt.md");
    _cachedPrompt = await res.text();
    return _cachedPrompt;
  } catch {
    _cachedPrompt = "AI Goal Import Prompt failed to load. Please check that assets/ai-goal-prompt.md exists.";
    return _cachedPrompt;
  }
}

async function getAIGoalImportPrompt() {
  const template = await loadAIGoalPrompt();
  return template
    .replace("{{TODAY}}", getLocalDateString())
    .replace("{{HABIT_IDS}}", JSON.stringify(appState.settings.scheduleBlocks.map(b => b.id)));
}
