# TelOS

TelOS is a lightweight, local-first personal goals and habit tracker built as a static web app.

It is centered around a simple cascade fully configured on the **Blueprint** page:

- **North Star** goals define the long-term direction
- **6-month checkpoints** make that direction concrete
- **3-month checkpoints** turn it into near-term execution
- **1-month checkpoints** bridge the gap to daily action
- **Daily habits** — only habits linked to a North Star appear on Execution and Progress pages
- **Execution** and **Progress** help track how daily behavior rolls up into the bigger picture

Everything is data-driven from the Blueprint: add any habit block with any field type (checkbox, number, etc.) and all pages adapt automatically — no hardcoded logic.

## Features

- Goal planning through the **Blueprint** page with North Star → 6-Month → 3-Month → 1-Month cascade
- Daily habit tracking in **Execution** with monthly calendar grids and per-habit consecutive-day streaks
- Weekly, monthly, and cascade review views in **Progress** with completion heatmaps and dynamic metrics
- Local-first data persistence with automatic Supabase cloud sync (fallback to localStorage)
- AI-assisted goal planning via ChatGPT import or inline goal generator
- Fully responsive mobile-friendly UI with no build step required
- **Load Sample Data** button to populate realistic demo goals, habits, and logs
- **Clear All Data** button to reset to a clean slate
- `isBlockCompleted()` generic helper makes all streak, score, and completion logic work with any future habit block

## Fresh Start State

This repository ships with a clean starter dashboard:

- no sample logs
- no seeded goals
- no seeded reviews
- starter habit blocks only (Wake Up, Deep Work, Reading, Workout, etc.)

Data is stored in the browser under the `telos_data` local storage key. If Supabase credentials are configured in Settings, all data is automatically synced to the cloud.

## Run Locally

Because this is a static app, you can serve it with any local web server.

### Option 1

Use the included batch file on Windows:

```bat
start.bat
```

### Option 2

Run Python's simple HTTP server:

```bash
python -m http.server 8000
```

Then open:

[http://localhost:8000](http://localhost:8000)

## Project Structure

- [index.html](index.html) - app shell and UI sections
- [style.css](style.css) - styling and responsive behavior
- [app.js](app.js) - bootstrapping and tab switching
- [mockData.js](mockData.js) - clean starter state and sample data builder
- [js/config.js](js/config.js) - app configuration constants
- [js/state.js](js/state.js) - persistence, Supabase sync, state management
- [js/utils.js](js/utils.js) - pure computations: dates, streaks, completion rates, helpers
- [js/tabs/today.js](js/tabs/today.js) - execution page logic
- [js/tabs/review.js](js/tabs/review.js) - progress page logic
- [js/tabs/career.js](js/tabs/career.js) - blueprint page logic
- [js/tabs/settings.js](js/tabs/settings.js) - settings, credentials, import/export
- [js/ai-goal-prompt.js](js/ai-goal-prompt.js) - ChatGPT prompt template
- [js/ai-goals.js](js/ai-goals.js) - AI goal import and generation logic

## Notes

- The app expects to be served over HTTP for AI/network features.
- If you previously used an older local storage key, this version starts fresh with `telos_data`.

## Import a complete personalized plan

Copy the updated planner prompt from the app, generate a new plan in ChatGPT, and paste the JSON into the planner import dialog. The System JSON file importer also accepts the same plan format, as well as full backups.

Plans must include `northStar`, `sixMonth`, `threeMonth`, `dailyHabits`, and `linkedHabits` arrays. Include `oneMonth` for one-month checkpoints. Habit definitions replace the previous schedule; existing logs and connection settings are preserved. Older planner JSON containing only habit links is rejected with instructions to regenerate it, because it cannot specify personalized habits or times.

Example habit definition and link (inside the complete plan):

```json
"dailyHabits": [
  { "id": "lunch_walk", "name": "Lunch walk", "time": "12:30 PM",
    "fields": [{ "id": "completed", "type": "checkbox", "label": "Walk completed" }] }
],
"linkedHabits": [{ "habitId": "lunch_walk", "northStarId": "ns_health" }]
```

The referenced North Star must exist. Each habit must have one link to a North Star. Habit times can be an empty string; no default time is substituted. Omitted fields default to a completion checkbox. Numeric tracking fields count any positive value as completion. Checkpoints and habits are grouped by their shared North Star, rather than directly linked to each other.

Run import regression tests with `npm test` (no dependency installation required).

## Scheduled Supabase activity

The `Supabase keep-alive` GitHub Action performs a read-only request to `life_os_sync` every six hours, independently of whether the app is open. Add these repository secrets in **Settings → Secrets and variables → Actions**:

- `SUPABASE_URL`: the same project URL used in the app.
- `SUPABASE_KEY`: the app's publishable or legacy anon key. A service-role key is unnecessary.

Then open **Actions → Supabase keep-alive → Run workflow** to verify the connection. The key must have permission to read `life_os_sync`. If the project is already paused, resume it in Supabase first. Failed requests fail the workflow without printing credentials or database records.

Supabase Free projects can be paused for low activity during a seven-day window. Scheduled requests can help maintain activity, but are not a guarantee against pausing. GitHub schedules can be delayed, and scheduled workflows in public repositories can be disabled after 60 days without repository activity; re-enable the workflow if needed. A paid Supabase plan prevents automatic inactivity pausing.
