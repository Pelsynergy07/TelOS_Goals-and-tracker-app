# TelOS

TelOS is a lightweight, local-first personal goals and habit tracker built as a static web app.

It is centered around a simple cascade:

- `North Star` goals define the long-term direction
- `6-month` checkpoints make that direction concrete
- `3-month` checkpoints turn it into near-term execution
- `Daily habits` support those checkpoints
- `Execution` and `Progress` help track how daily behavior rolls up into the bigger picture

## Features

- Goal planning through the `Blueprint` page
- Daily habit tracking in `Execution`
- Weekly, monthly, and cascade review views in `Progress`
- Local-first data persistence with optional Supabase sync
- AI-assisted goal planning and ChatGPT-based JSON import
- Responsive single-page UI with no build step required

## Fresh Start State

This repository now ships with a clean starter dashboard:

- no sample logs
- no seeded goals
- no seeded reviews
- starter habit blocks only

Data is stored in the browser under the `telos_data` local storage key.

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

- [index.html](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\index.html) - app shell and UI sections
- [style.css](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\style.css) - styling and responsive behavior
- [app.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\app.js) - bootstrapping and tab switching
- [mockData.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\mockData.js) - clean starter state
- [js/state.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\js\state.js) - persistence and sync
- [js/tabs/today.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\js\tabs\today.js) - execution page logic
- [js/tabs/review.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\js\tabs\review.js) - progress page logic
- [js/tabs/career.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\js\tabs\career.js) - blueprint page logic
- [js/tabs/settings.js](C:\Users\Pranav Kumar\Desktop\AI Experiements\Progress Tracker_Pranav\js\tabs\settings.js) - settings and import/export

## Notes

- The app expects to be served over HTTP for AI/network features.
- If you previously used an older local storage key, this version starts fresh with `telos_data`.
