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
