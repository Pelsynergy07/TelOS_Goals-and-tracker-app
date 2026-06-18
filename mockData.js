// Default starter state for a fresh TelOS dashboard.
// Keeps the tracking structure in place without shipping sample progress data.

const initialMockData = {
  logs: {},
  weeklyReviews: {},
  monthlyReviews: {},

  identityStatement: {
    title: "Who I Am Becoming",
    description: ""
  },
  dangerAreas: [],
  rules: [],

  goals: {
    northStar: [],
    yearly: [],
    sixMonth: [],
    threeMonth: [],
    oneMonth: [],
    linkedHabits: []
  },

  settings: {
    scheduleBlocks: [
      {
        id: "wake_up",
        name: "Wake Up",
        time: "04:00 AM",
        fields: [
          { id: "completed", type: "checkbox", label: "Woke up on time" },
          { id: "actual_time", type: "time", label: "Actual wake time" }
        ]
      },
      {
        id: "deep_learning",
        name: "Deep Work Block",
        time: "04:30 AM - 06:30 AM",
        fields: [
          { id: "minutes", type: "number", label: "Minutes completed", placeholder: "e.g. 120" },
          { id: "notes", type: "text", label: "Notes", placeholder: "What did you work on?" }
        ]
      },
      {
        id: "reading",
        name: "Reading",
        time: "06:30 AM - 07:00 AM",
        fields: [
          { id: "completed", type: "checkbox", label: "Reading complete" },
          { id: "notes", type: "text", label: "Notes", placeholder: "Book, lesson, or takeaway" }
        ]
      },
      {
        id: "gym",
        name: "Workout",
        time: "Flexible",
        fields: [
          { id: "completed", type: "checkbox", label: "Workout complete" },
          { id: "notes", type: "text", label: "Notes", placeholder: "Session notes or energy level" }
        ]
      },
      {
        id: "office_rule",
        name: "Focus Starter Rule",
        time: "Workday",
        fields: [
          { id: "completed", type: "checkbox", label: "Used the start rule" }
        ]
      },
      {
        id: "youtube",
        name: "Content Block",
        time: "Evening",
        fields: [
          { id: "minutes", type: "number", label: "Minutes spent", placeholder: "e.g. 45" },
          { id: "notes", type: "text", label: "Notes", placeholder: "What did you watch?" }
        ]
      },
      {
        id: "walk",
        name: "Walk",
        time: "Evening",
        fields: [
          { id: "completed", type: "checkbox", label: "Walk complete" }
        ]
      },
      {
        id: "sleep",
        name: "Sleep",
        time: "09:00 PM",
        fields: [
          { id: "completed", type: "checkbox", label: "Slept on time" },
          { id: "actual_time", type: "time", label: "Actual bedtime" }
        ]
      }
    ],
    supabaseUrl: "",
    supabaseKey: "",
    syncEnabled: false,
    upcomingHidden: false,
    goalsCountdownCollapsed: false
  }
};

function buildSampleData() {
  const nsId1 = "ns_sample_creator", nsId2 = "ns_sample_wellness", nsId3 = "ns_sample_craft";
  const today = new Date();
  const y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0');
  const logs = {};
  for (let day = 1; day <= today.getDate(); day++) {
    const dStr = `${y}-${m}-${String(day).padStart(2,'0')}`;
    if (dStr > getLocalDateString()) break;
    logs[dStr] = {
      feelingScore: Math.floor(Math.random() * 3) + 3,
      biggestWin: ["Finished a big deliverable", "Solid workout session", "Great conversation", "Hit inbox zero", "Cooked a good meal"][Math.floor(Math.random() * 5)],
      biggestLearning: ["Progress beats perfection", "Rest is part of the work", "Boundaries matter", "Small steps compound", "Ask for help sooner"][Math.floor(Math.random() * 5)],
      wake_up: { completed: Math.random() > 0.2 },
      deep_learning: { minutes: Math.random() > 0.3 ? 45 + Math.floor(Math.random() * 75) : 0, notes: Math.random() > 0.5 ? "Focused session" : "" },
      reading: { completed: Math.random() > 0.4 },
      gym: { completed: Math.random() > 0.5 },
      office_rule: { completed: Math.random() > 0.25 },
      youtube: { minutes: Math.random() > 0.4 ? 15 + Math.floor(Math.random() * 45) : 0 },
      walk: { completed: Math.random() > 0.35 },
      sleep: { completed: Math.random() > 0.3 }
    };
  }

  return {
    logs,
    weeklyReviews: {},
    monthlyReviews: {},
    identityStatement: {
      title: "Who I Am Becoming",
      description: "I am someone who shows up consistently, finishes what I start, and builds skills that compound over time."
    },
    dangerAreas: [
      {
        id: "overplanning_trap",
        title: "Planning Instead of Doing",
        reality: "I spend more time organizing and planning than actually executing.",
        reminder: "The best plan is the one you execute. Start before you feel ready."
      },
      {
        id: "distraction_loops",
        title: "Endless Distraction Cycles",
        reality: "I reach for my phone or open a tab the moment a task feels hard or boring.",
        reminder: "Discomfort is a signal to go deeper, not to escape."
      },
      {
        id: "perfection_delay",
        title: "Perfectionist Paralysis",
        reality: "I hold back until I'm sure it's good enough, which means I rarely ship.",
        reminder: "Done is better than perfect. You can refine after you release."
      }
    ],
    rules: [
      { id: "five_second_rule", text: "When an important task feels hard, start within 5 seconds before your brain talks you out of it." },
      { id: "one_thing_first", text: "Complete the most important task before checking any notifications." },
      { id: "no_zero_days", text: "Do at least one thing every day that moves a priority forward." },
      { id: "phone_down", text: "Keep the phone in another room during deep work blocks." },
      { id: "weekly_reset", text: "Every Sunday evening, review the week and set intentions for the next." }
    ],
    goals: {
      northStar: [
        { id: nsId1, title: "Build a Creative Practice", description: "Develop a consistent output habit and share work publicly.", completed: false },
        { id: nsId2, title: "Sustain Peak Wellness", description: "Optimize sleep, movement, and nutrition for long-term energy.", completed: false },
        { id: nsId3, title: "Master My Craft", description: "Deepen expertise through deliberate practice and real projects.", completed: false }
      ],
      yearly: [],
      sixMonth: [
        { id: "g_s1", name: "Publish 24 pieces of work", progress: 4, target: 24, unit: "pieces", deadline: "", northStarId: nsId1, completed: false },
        { id: "g_s2", name: "Run 10k consistently", progress: 0, target: 1, unit: "race", deadline: "", northStarId: nsId2, completed: false },
        { id: "g_s3", name: "Complete 3 portfolio projects", progress: 0, target: 3, unit: "projects", deadline: "", northStarId: nsId3, completed: false }
      ],
      threeMonth: [
        { id: "g_t1", name: "Ship a MVP for side project", progress: 30, target: 100, unit: "%", deadline: "", northStarId: nsId1, completed: false },
        { id: "g_t2", name: "Average 7h sleep per night", progress: 6.2, target: 7, unit: "hours", deadline: "", northStarId: nsId2, completed: false },
        { id: "g_t3", name: "Complete an online course in my field", progress: 40, target: 100, unit: "%", deadline: "", northStarId: nsId3, completed: false }
      ],
      oneMonth: [
        { id: "g_o1", name: "Write and publish 4 newsletter issues", progress: 1, target: 4, unit: "issues", deadline: "", northStarId: nsId1, completed: false },
        { id: "g_o2", name: "Hit 6 gym sessions this month", progress: 2, target: 6, unit: "sessions", deadline: "", northStarId: nsId2, completed: false },
        { id: "g_o3", name: "Complete 2 course modules", progress: 1, target: 2, unit: "modules", deadline: "", northStarId: nsId3, completed: false }
      ],
      linkedHabits: [
        { habitId: "wake_up", northStarId: nsId2 },
        { habitId: "deep_learning", northStarId: nsId3 },
        { habitId: "reading", northStarId: nsId1 },
        { habitId: "gym", northStarId: nsId2 },
        { habitId: "office_rule", northStarId: nsId1 },
        { habitId: "youtube", northStarId: nsId3 },
        { habitId: "walk", northStarId: nsId2 },
        { habitId: "sleep", northStarId: nsId2 }
      ]
    },
    settings: JSON.parse(JSON.stringify(initialMockData.settings))
  };
}

function loadSampleData() {
  if (!confirm("This will replace all your current data with sample data. Continue?")) return;
  appState = buildSampleData();
  persistState();
  renderAll();
  lucide.createIcons();
}

async function clearAllData() {
  if (!confirm("This will permanently delete ALL your data. Are you sure?")) return;
  if (!confirm("Really? There is no undo. Clear everything?")) return;
  localStorage.removeItem(APP_CONFIG.storageKey);
  appState = JSON.parse(JSON.stringify(initialMockData));
  dbClient = null;
  appState.settings.supabaseUrl = "";
  appState.settings.supabaseKey = "";
  appState.settings.syncEnabled = false;
  clearCredentialsFromNative();
  persistState();
  await initSupabase();
  renderAll();
  lucide.createIcons();
}
