// Mock data for Pranav's progress tracker (Life OS)
// Updated with deadlines to support "Days Remaining" computations.

const initialMockData = {
  logs: {
    "2026-05-01": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Learned about MLP and backprop from scratch." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 2" },
      "gym": { "completed": true, "notes": "Chest & Triceps. Energy 8/10." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Watched a tutorial on CSS layouts." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Felt strong urge after gym, immediately took a cold shower.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Completed full deep learning block without distractions.",
      "avoidanceFriction": "Avoided reading, but opened the book for 1 page and ended up reading 10."
    },
    "2026-05-02": {
      "wake_up": { "completed": true, "actual_time": "04:05" },
      "deep_learning": { "minutes": 90, "notes": "Coding a multi-layer perceptron in PyTorch." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 3" },
      "gym": { "completed": false, "notes": "Rest day." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 60, "notes": "Product Design breakdowns." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "21:00" },
      "pmoAvoided": true,
      "pmoNotes": "No urges today.",
      "energyLevel": 7,
      "moodGuiltLevel": 2,
      "biggestWin": "Clean rest day and maintained the sleep block schedule.",
      "avoidanceFriction": "Wanted to sleep in, but got out of bed within 5 mins."
    },
    "2026-05-03": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Optimizers: SGD, Momentum, Adam math." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 4" },
      "gym": { "completed": true, "notes": "Leg day. Squats feel heavy. Energy 7." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 30, "notes": "Vite project architecture." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Focused on exhaustion from gym.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Leg day consistency + early bedtime.",
      "avoidanceFriction": "Avoiding gym before going, but packed bag the night before."
    },
    "2026-05-04": {
      "wake_up": { "completed": true, "actual_time": "04:10" },
      "deep_learning": { "minutes": 120, "notes": "Regularization: Dropout, Batch Norm implementation." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 5" },
      "gym": { "completed": true, "notes": "Back & Biceps. Pull-ups count increasing." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Figma layout techniques." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:45" },
      "pmoAvoided": true,
      "pmoNotes": "None.",
      "energyLevel": 9,
      "moodGuiltLevel": 1,
      "biggestWin": "Highly energetic day. Everything checked off.",
      "avoidanceFriction": "No major friction. Momentum is high."
    },
    "2026-05-05": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "CNNs architecture: Convolutions, Pooling, Padding." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 6" },
      "gym": { "completed": false, "notes": "Active recovery." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 75, "notes": "Tech discussions on LLMs." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Good focus.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Kept YouTube below the 90 min limit easily.",
      "avoidanceFriction": "Friction starting Deep Learning block, used 5-min rule."
    },
    "2026-05-06": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "ResNets: skip connections coding." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 7" },
      "gym": { "completed": true, "notes": "Shoulders & Arms. Good pump. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 40, "notes": "Interaction Design case studies." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Safe.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Gym session went great. Strong focus.",
      "avoidanceFriction": "Felt tired before gym, drank water and went immediately."
    },
    "2026-05-07": {
      "wake_up": { "completed": true, "actual_time": "04:15" },
      "deep_learning": { "minutes": 120, "notes": "RNNs & LSTMs: vanishing gradients." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 8" },
      "gym": { "completed": true, "notes": "Deadlifts. New PR! Energy 9." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 60, "notes": "Developer streams." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Very clean.",
      "energyLevel": 9,
      "moodGuiltLevel": 1,
      "biggestWin": "Deadlift PR! Sleep schedule maintained.",
      "avoidanceFriction": "Woke up at 4:15, felt like sleeping back. Got up anyway."
    },
    "2026-05-08": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 60, "notes": "Attention mechanism formulas." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 9" },
      "gym": { "completed": false, "notes": "Rest day." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 120, "notes": "Fell into algorithm rabbit hole." },
      "walk": { "completed": false },
      "sleep": { "completed": false, "actual_time": "22:30" },
      "pmoAvoided": true,
      "pmoNotes": "Slight urge due to YouTube scrolling.",
      "energyLevel": 6,
      "moodGuiltLevel": 5,
      "biggestWin": "Did 60 mins of deep learning.",
      "avoidanceFriction": "YouTube binging after office. Recovered by shutting down PC at 9:30."
    },
    "2026-05-09": {
      "wake_up": { "completed": false, "actual_time": "06:30" },
      "deep_learning": { "minutes": 0, "notes": "Missed block due to late sleep yesterday." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 10" },
      "gym": { "completed": true, "notes": "Quick session, chest and back." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Google designer interview videos." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Recovered fast.",
      "energyLevel": 6,
      "moodGuiltLevel": 3,
      "biggestWin": "Recovered momentum. Got back to sleep schedule.",
      "avoidanceFriction": "Woke up feeling guilty about missing DL block. Focused on a good gym session instead."
    },
    "2026-05-10": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Transformers: Query, Key, Value vectors." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 11" },
      "gym": { "completed": false, "notes": "Sunday review day." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 30, "notes": "Weekly summaries." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Clear.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Excellent Sunday reflection and planning.",
      "avoidanceFriction": "Friction starting review form. Closed all tabs, wrote first question."
    },
    "2026-05-11": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Coding Self-Attention block in PyTorch." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 12" },
      "gym": { "completed": true, "notes": "Legs. Solid intensity. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 40, "notes": "Design Systems at scale." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:45" },
      "pmoAvoided": true,
      "pmoNotes": "None.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Perfect start to the week.",
      "avoidanceFriction": "None."
    },
    "2026-05-12": {
      "wake_up": { "completed": true, "actual_time": "04:05" },
      "deep_learning": { "minutes": 120, "notes": "Multi-Head Attention code walkthrough." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 13" },
      "gym": { "completed": true, "notes": "Push day. Bench press 80kg. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 50, "notes": "Tailwind UI elements study." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Completed DL + Gym benchmarks.",
      "avoidanceFriction": "Slight fatigue at 6:30 PM, wanted to watch YouTube binger, took walk first."
    },
    "2026-05-13": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Positional Encoding in Transformers." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 14" },
      "gym": { "completed": false, "notes": "Rest day." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 35, "notes": "Google Material Design 3 guidelines." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Zero PMO urges. High cognitive focus.",
      "avoidanceFriction": "Felt distracted during DL block. Locked phone in other room."
    },
    "2026-05-14": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Finished full Transformer encoder architecture." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 15" },
      "gym": { "completed": true, "notes": "Back and Pull Day. Energy 9." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Watched visual design critique." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Safe.",
      "energyLevel": 9,
      "moodGuiltLevel": 1,
      "biggestWin": "Transformer Encoder fully functional!",
      "avoidanceFriction": "No friction."
    },
    "2026-05-15": {
      "wake_up": { "completed": true, "actual_time": "04:10" },
      "deep_learning": { "minutes": 120, "notes": "Transformer decoder details & masking." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 16" },
      "gym": { "completed": true, "notes": "Shoulder press + HIIT card. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 60, "notes": "Figma micro-interactions." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Completed gym target (4x/week met)."
    },
    "2026-05-16": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Training a character-level GPT model on Shakespeare." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 17" },
      "gym": { "completed": false, "notes": "Rest." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 85, "notes": "Deep learning papers discussion." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Clear.",
      "energyLevel": 8,
      "moodGuiltLevel": 2,
      "biggestWin": "GPT model training run completed.",
      "avoidanceFriction": "Wanted to watch YouTube at 8 PM, went for a recovery walk instead."
    },
    "2026-05-17": {
      "wake_up": { "completed": true, "actual_time": "04:15" },
      "deep_learning": { "minutes": 90, "notes": "Evaluating GPT training curves." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 18" },
      "gym": { "completed": true, "notes": "Chest focus, energy 7." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Sunday review prep." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 7,
      "moodGuiltLevel": 1,
      "biggestWin": "Highly organized weekly review. Consistent sleep.",
      "avoidanceFriction": "Felt tired before gym. Told myself 'just do 3 exercises'. Ended up doing a full workout."
    },
    "2026-05-18": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Fine-tuning techniques: LoRA and QLoRA theory." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 19" },
      "gym": { "completed": true, "notes": "Legs. Hard squats session. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Interaction designs showcase." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Leg day + DL block went smoothly."
    },
    "2026-05-19": {
      "wake_up": { "completed": true, "actual_time": "04:05" },
      "deep_learning": { "minutes": 120, "notes": "Coding LoRA weights insertion in PyTorch." },
      "reading": { "completed": true, "notes": "Atomic Habits chapter 20" },
      "gym": { "completed": true, "notes": "Arms and HIIT. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 40, "notes": "Product Design portfolios review." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Finished Atomic Habits! Start new book tomorrow.",
      "avoidanceFriction": "Felt friction coding LoRA, opened Figma instead, recovered using 5-minute coding sprint."
    },
    "2026-05-20": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Testing LoRA vs full fine-tuning on small dataset." },
      "reading": { "completed": true, "notes": "Steal Like an Artist, p. 1-20" },
      "gym": { "completed": false, "notes": "Rest." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 40, "notes": "Vite React optimizations." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:45" },
      "pmoAvoided": true,
      "pmoNotes": "No issues.",
      "energyLevel": 9,
      "moodGuiltLevel": 1,
      "biggestWin": "High-efficiency rest day. Early sleep.",
      "avoidanceFriction": "No major roadblocks."
    },
    "2026-05-21": {
      "wake_up": { "completed": true, "actual_time": "04:00" },
      "deep_learning": { "minutes": 120, "notes": "Reinforcement learning: RLHF and DPO fundamentals." },
      "reading": { "completed": true, "notes": "Steal Like an Artist, p. 21-40" },
      "gym": { "completed": true, "notes": "Back & Biceps. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 35, "notes": "Design review videos." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:50" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "RLHF concepts clear. DL block completed.",
      "avoidanceFriction": "Avoided gym prep, forced myself to just wear shoes. Started gym in 10 mins."
    },
    "2026-05-22": {
      "wake_up": { "completed": true, "actual_time": "04:10" },
      "deep_learning": { "minutes": 120, "notes": "Coding DPO loss function in PyTorch." },
      "reading": { "completed": true, "notes": "Steal Like an Artist, p. 41-60" },
      "gym": { "completed": true, "notes": "Chest & Triceps. Incline DB presses. Energy 8." },
      "office_rule": { "completed": true },
      "youtube": { "minutes": 45, "notes": "Dev Vlog videos." },
      "walk": { "completed": true },
      "sleep": { "completed": true, "actual_time": "20:55" },
      "pmoAvoided": true,
      "pmoNotes": "Clean.",
      "energyLevel": 8,
      "moodGuiltLevel": 1,
      "biggestWin": "Gym session finished early. Solid DPO coding run."
    }
  },
  
  weeklyReviews: {
    "2026-W18": {
      "score": 93,
      "reflection": {
        "wakeSleepDays": "6 days wake, 6 days sleep",
        "gymCount": "3 gym sessions (target 4)",
        "energyAvg": "7.9 / 10",
        "dlHours": "11.5 hours",
        "ytProgress": "Kept youtube under control, except Friday.",
        "avoidanceRecovery": "Used 5-min start rule for reading. Worked well.",
        "biggestWin": "Transformer encoder setup",
        "adjustment": "Prep gym clothes in advance to meet 4x target."
      }
    },
    "2026-W19": {
      "score": 98,
      "reflection": {
        "wakeSleepDays": "7 days wake, 7 days sleep",
        "gymCount": "4 gym sessions",
        "energyAvg": "8.2 / 10",
        "dlHours": "13 hours",
        "ytProgress": "Average of 50m per day, very clean.",
        "avoidanceRecovery": "No major spiraling. Recovered fast by taking walks.",
        "biggestWin": "Flawless sleep schedule consistency",
        "adjustment": "Start Deep Learning immediately at 4:30 AM without checking email."
      }
    }
  },

  goals: {
    northStar: [
      { id: "dream_role", title: "Dream Role", description: "Google Interaction Designer (age 26-27)", completed: false },
      { id: "visual_cap", title: "Visual & Cap", description: "Elite visual taste + systems thinking", completed: false },
      { id: "brand_channel", title: "Brand Channel", description: "Strong personal brand via YouTube", completed: false },
      { id: "identity", title: "Identity", description: "Disciplined identity + excellent physique", completed: false }
    ],
    yearly: [
      { id: "design", name: "Design Mastery level", progress: 70, target: 100, unit: "%", deadline: "2027-05-01", northStarId: "dream_role" },
      { id: "portfolio", name: "Portfolio projects completed", progress: 2, target: 6, unit: "projects", deadline: "2026-12-31", northStarId: "dream_role" },
      { id: "youtube", name: "YouTube videos published", progress: 3, target: 12, unit: "videos", deadline: "2026-12-31", northStarId: "brand_channel" },
      { id: "books", name: "Books read", progress: 9, target: 24, unit: "books", deadline: "2026-12-31", northStarId: "visual_cap" },
      { id: "gym", name: "Gym consistency %", progress: 85, target: 100, unit: "%", deadline: "2026-12-31", northStarId: "identity" },
      { id: "pmoStreak", name: "Longest PMO-free streak", progress: 45, target: 90, unit: "days", deadline: "2026-08-31", northStarId: "identity" }
    ],
    sixMonth: [
      { id: "sm_portfolio", name: "2 portfolio case studies live", progress: 1, target: 2, unit: "studies", deadline: "2026-11-30", northStarId: "dream_role", completed: false },
      { id: "sm_dl", name: "Complete Transformer from scratch", progress: 80, target: 100, unit: "%", deadline: "2026-11-30", northStarId: "dream_role", completed: false },
      { id: "sm_yt", name: "First design vlog published", progress: 0, target: 1, unit: "video", deadline: "2026-11-30", northStarId: "brand_channel", completed: false }
    ],
    threeMonth: [
      { id: "tm_adherence", name: "Schedule adherence 85%+", progress: 85, target: 100, unit: "%", deadline: "2026-08-31", northStarId: "identity", completed: false },
      { id: "tm_dl", name: "DL: RNNs → Transformers mastery", progress: 68, target: 100, unit: "%", deadline: "2026-08-31", northStarId: "dream_role", completed: false },
      { id: "tm_ui", name: "Mini UI explorations (15 total)", progress: 9, target: 15, unit: "explorations", deadline: "2026-08-31", northStarId: "visual_cap", completed: false },
      { id: "tm_gym", name: "Gym 4x/week consistency", progress: 10, target: 12, unit: "weeks", deadline: "2026-08-31", northStarId: "identity", completed: false },
      { id: "tm_books", name: "Read 12 books", progress: 5, target: 12, unit: "books", deadline: "2026-08-31", northStarId: "visual_cap", completed: false }
    ],
    linkedHabits: [
      { habitId: "deep_learning", northStarId: "dream_role" },
      { habitId: "gym", northStarId: "identity" },
      { habitId: "reading", northStarId: "visual_cap" },
      { habitId: "youtube", northStarId: "brand_channel" },
      { habitId: "wake_up", northStarId: "identity" },
      { habitId: "sleep", northStarId: "identity" }
    ]
  },

  settings: {
    scheduleBlocks: [
      {
        id: "wake_up",
        name: "Wake up (4:00 AM)",
        time: "04:00 AM",
        fields: [
          { id: "completed", type: "checkbox", label: "Woke up at 4 AM" },
          { id: "actual_time", type: "time", label: "Actual wake time" }
        ]
      },
      {
        id: "deep_learning",
        name: "Deep Learning Block",
        time: "04:30 AM – 06:30 AM",
        fields: [
          { id: "minutes", type: "number", label: "Minutes completed", placeholder: "e.g. 120" },
          { id: "notes", type: "text", label: "Notes/Topics", placeholder: "What did you study?" }
        ]
      },
      {
        id: "reading",
        name: "Reading",
        time: "06:30 AM – 07:00 AM",
        fields: [
          { id: "completed", type: "checkbox", label: "Read books" },
          { id: "notes", type: "text", label: "Book & pages", placeholder: "e.g. Steal Like an Artist, p. 10" }
        ]
      },
      {
        id: "gym",
        name: "Gym Session",
        time: "Morning/Flexible",
        fields: [
          { id: "completed", type: "checkbox", label: "Gym done" },
          { id: "notes", type: "text", label: "Exercises / Notes", placeholder: "Exercises or energy level 1-10" }
        ]
      },
      {
        id: "office_rule",
        name: "Office: Used 5-Minute Start Rule",
        time: "Workday",
        fields: [
          { id: "completed", type: "checkbox", label: "Used 5-Minute Start Rule" }
        ]
      },
      {
        id: "youtube",
        name: "YouTube Block",
        time: "06:30 PM – 08:00 PM",
        fields: [
          { id: "minutes", type: "number", label: "Minutes spent", placeholder: "e.g. 90" },
          { id: "notes", type: "text", label: "Content watched", placeholder: "What did you watch?" }
        ]
      },
      {
        id: "walk",
        name: "Recovery Walk",
        time: "08:00 PM – 08:30 PM",
        fields: [
          { id: "completed", type: "checkbox", label: "Walk completed" }
        ]
      },
      {
        id: "sleep",
        name: "Sleep (9:00 PM)",
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
    aiModel: ""
  }
};
