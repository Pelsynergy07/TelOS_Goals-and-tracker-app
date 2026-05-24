// Default starter state for a fresh TelOS dashboard.
// Keeps the tracking structure in place without shipping sample progress data.

const initialMockData = {
  logs: {},
  weeklyReviews: {},
  monthlyReviews: {},

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
    goalsCountdownCollapsed: false,
    aiApiKey: "",
    aiEndpoint: "",
    aiModel: "",
    aiSpeechModel: ""
  }
};

function buildSampleData() {
  const nsId1 = "ns_sample_career", nsId2 = "ns_sample_health", nsId3 = "ns_sample_learning";
  const today = new Date();
  const y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0');
  const logs = {};
  for (let day = 1; day <= today.getDate(); day++) {
    const dStr = `${y}-${m}-${String(day).padStart(2,'0')}`;
    if (dStr > getLocalDateString()) break;
    logs[dStr] = {
      feelingScore: Math.floor(Math.random() * 3) + 3,
      biggestWin: ["Finished deep work early", "Hit gym PR", "Great client call", "Read 50 pages", "Meditated"][Math.floor(Math.random() * 5)],
      biggestLearning: ["Focus on one thing", "Rest is productive", "Say no more often", "Plan ahead", "Batch tasks"][Math.floor(Math.random() * 5)],
      wake_up: { completed: Math.random() > 0.2 },
      deep_learning: { minutes: Math.random() > 0.3 ? 60 + Math.floor(Math.random() * 60) : 0, notes: Math.random() > 0.5 ? "Deep focus session" : "" },
      reading: { completed: Math.random() > 0.4 },
      gym: { completed: Math.random() > 0.5 },
      office_rule: { completed: Math.random() > 0.25 },
      youtube: { minutes: Math.random() > 0.4 ? 20 + Math.floor(Math.random() * 40) : 0 },
      walk: { completed: Math.random() > 0.35 },
      sleep: { completed: Math.random() > 0.3 }
    };
  }

  return {
    logs,
    weeklyReviews: {},
    monthlyReviews: {},
    goals: {
      northStar: [
        { id: nsId1, title: "Career Growth", description: "Become a recognized expert in my field and lead impactful projects.", completed: false },
        { id: nsId2, title: "Health & Vitality", description: "Build sustainable fitness, sleep, and nutrition habits.", completed: false },
        { id: nsId3, title: "Continuous Learning", description: "Deepen knowledge through daily reading and deliberate practice.", completed: false }
      ],
      yearly: [],
      sixMonth: [
        { id: "g_s1", name: "Ship 2 major features at work", progress: 1, target: 2, unit: "features", deadline: "", northStarId: nsId1, completed: false },
        { id: "g_s2", name: "Run a half marathon", progress: 0, target: 1, unit: "race", deadline: "", northStarId: nsId2, completed: false },
        { id: "g_s3", name: "Complete AWS Solutions Architect cert", progress: 0, target: 1, unit: "cert", deadline: "", northStarId: nsId3, completed: false }
      ],
      threeMonth: [
        { id: "g_t1", name: "Lead code review for team project", progress: 60, target: 100, unit: "%", deadline: "", northStarId: nsId1, completed: false },
        { id: "g_t2", name: "Reach 5 pull-ups consistently", progress: 3, target: 5, unit: "reps", deadline: "", northStarId: nsId2, completed: false },
        { id: "g_t3", name: "Read 4 technical books", progress: 2, target: 4, unit: "books", deadline: "", northStarId: nsId3, completed: false }
      ],
      oneMonth: [
        { id: "g_o1", name: "Complete Q2 performance review doc", progress: 0, target: 1, unit: "doc", deadline: "", northStarId: nsId1, completed: false },
        { id: "g_o2", name: "Average 7h sleep per night", progress: 0, target: 7, unit: "hours", deadline: "", northStarId: nsId2, completed: false },
        { id: "g_o3", name: "Finish 'Deep Work' book", progress: 0, target: 1, unit: "book", deadline: "", northStarId: nsId3, completed: false }
      ],
      linkedHabits: [
        { habitId: "wake_up", northStarId: nsId2 },
        { habitId: "deep_learning", northStarId: nsId1 },
        { habitId: "reading", northStarId: nsId3 },
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

function clearAllData() {
  if (!confirm("This will permanently delete ALL your data. Are you sure?")) return;
  if (!confirm("Really? There is no undo. Clear everything?")) return;
  appState = JSON.parse(JSON.stringify(initialMockData));
  persistState();
  renderAll();
  lucide.createIcons();
}
