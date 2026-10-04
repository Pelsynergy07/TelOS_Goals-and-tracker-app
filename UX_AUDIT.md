## Desktop remediation status � October 4, 2026

The findings below describe the audit baseline. Subsequent desktop fixes correct date and period navigation, numeric habit logging, habit editing, checkpoint progress, import and backup validation, stale and conflicting cloud sync, reflections, empty states, keyboard dialogs, labels, focus visibility, and desktop readability. Daily habits and checkpoints share North Star links; the interface now describes that relationship accurately. The separate mobile application was not modified.

Validation: 16 automated regression tests, JavaScript syntax checks, and desktop browser checks covering import, real numeric values, historical-day editing, weekly/monthly review, habit schedule editing, and checkpoint completion. Live Supabase concurrency remains unverified without credentials; mocked tests cover stale pulls, concurrent edits, failed requests, and version conflicts.

---

# TelOS UX and page-link audit

Date: 4 October 2026. Revision: a790868.

## Verdict

The complete-plan JSON import works, but the app is not yet consistently linked or reliable across all pages. Most remaining defects are functional rather than visual.

Product anti-pattern verdict: needs refinement. Repeated tiny uppercase labels, nested cards, and decorative ambient effects add noise. Familiar navigation and consistent dark tokens are useful; preserve them. Data integrity and task completion should take priority over visual redesign.

## Scope and evidence

Read all five page modules, app routing, state/sync, utilities, planner/import, HTML and CSS. Opened the deployed site read-only, then used an isolated local origin at http://127.0.0.1:8017 to import a test plan and exercise Blueprint, Execution, Progress, Cascade, Constitution, and System. Checked desktop and a 390×844 viewport. Production data and credentials were not edited.

Confirmed personalized habit names/times, all three checkpoint levels, and Constitution content after browser import. Confirmed habit completion appears in monthly Progress and Cascade. All six existing import regression tests passed when run directly with `node tests/plan-import.test.cjs`; the sandbox blocks the subprocess spawned by `npm test`, so the direct runner was used.

Date calculations, numeric completion, orphan deletion, and ignored API failures were additionally reproduced with the actual functions in a Node VM. Cloud concurrency findings are code-path risks, not a live two-device test. No live Supabase connection was available for this audit.

## Health score

These are audit judgments, not a formal accessibility certification or a measured performance benchmark.

| Dimension | Score / 4 | Evidence |
|---|---:|---|
| Accessibility | 1 | Primary calendars cannot be operated by keyboard; missing dialog and form semantics |
| Performance | 2 | Every cloud pull re-renders all pages and writes back; several CDN scripts loaded synchronously |
| Responsive design | 2 | Layout adapts, but mobile habit cells measure 19.25×19.25px and much text is very small |
| Theming | 3 | Consistent CSS tokens; hard-coded visualization colors and low-opacity text remain |
| Anti-patterns | 2 | Nested surfaces, repeated tiny uppercase headings, decorative animation |
| Total | 10/20 | Acceptable visual foundation; significant functional work required |

18 prioritized findings: 0 P0, 12 P1, 6 P2. P1 means major impact; P2 means a workaround exists.

## What is actually linked

| Relationship | Result |
|---|---|
| JSON dailyHabits → stored schedule → Blueprint/Execution/Progress | Works for valid complete plans |
| JSON Constitution → Constitution page | Works |
| Habit completion → streaks/monthly calendar/Cascade habit dots | Works, subject to numeric and date defects below |
| Checkpoints → shared North Star → Cascade grouping | Works |
| Checkpoint completion buttons → shared completed flag | Works; numeric progress remains separate and can contradict the flag |
| 6-month → 3-month → 1-month parent-child chain | Not implemented: each checkpoint independently points to a North Star |
| Habits → specific checkpoints or automatic checkpoint progress | Not implemented: habits point to a North Star and do not update checkpoint progress |
| Constitution rules → habit enforcement or reminders | Not implemented; Constitution is standalone reference content |
| Deleting a pillar → dependent checkpoint/habit cleanup | Broken |
| Selected historical date → Execution editing | Broken |

The current planner schema correctly describes North Star grouping. It does not promise a true parent-child checkpoint graph or automatic habit-to-goal calculations. Decide whether those features are desired before adding more relationship fields.

## P1 findings

### 1. Weekly dates are incorrect in Asia/Kolkata

Location: js/utils.js:30 and :41; js/tabs/progress.js:58. Category: functionality/data accuracy.

Reproduction: on 4 October 2026, getWeekID returns 2026-W40, getWeekStartDate returns 27 September, and the subsequent dates are 21–27 September. The correct ISO week is 28 September–4 October. Browser shows "Sep 27 - Sep 27" and zero weekly completions despite a completion on 4 October. Local Date constructors converted with toISOString shift dates in positive UTC offsets; week-one calculation also mishandles ISO-year boundaries. Weekly calendar starts Monday while its header starts Sunday.

Impact: weekly history, scores and navigation refer to the wrong period.

Fix: use consistent date-only arithmetic, a correct ISO-week anchor (4 January), and matching weekday headers. Test Kolkata, UTC, negative offsets, and year boundaries. Suggested command: $impeccable harden.

### 2. Sync reports success when Supabase rejects a request

Location: js/state.js:165, :178, :193. Category: reliability/error feedback.

Supabase returns errors in an `error` property; push ignores the upsert result and pull destructures only data. Exceptions are swallowed. syncNow always displays "Synced!" and online handling marks the connection successful. A mocked rejected upsert returns undefined without raising failure.

Impact: users believe a backup was saved when it was not, particularly with paused projects or bad table permissions.

Fix: inspect API errors, propagate success/failure, and display truthful connection and retry states. Suggested command: $impeccable harden.

### 3. Cloud synchronization can overwrite newer edits

Location: js/state.js:61, :134, :193. Category: data integrity/performance.

Each change starts an unawaited whole-state push. Every ten seconds a pull replaces the whole appState, persists it (triggering another push), and re-renders all pages. No revision comparison, write queue, dirty-state protection, or conflict resolution exists. An older pull can replace a new local import or edit; re-rendering can reset text while a user is typing, before an onblur save.

Impact: lost edits and unpredictable cross-device behavior. This is a verified implementation risk; no live two-device reproduction was attempted.

Fix: serialize writes, track dirty revisions, avoid applying stale snapshots, save remote reads locally without re-pushing, and preserve active form edits. Suggested commands: $impeccable harden, then $impeccable optimize.

### 4. Clicking any numeric habit records 60

Location: js/tabs/execution.js:99–108. Category: functionality.

Reproduction: import a habit with numeric `pages`; clicking today's cell stores `{pages:60}`. No control lets the user enter the actual number or associated notes/time fields. The first numeric field receives 60 regardless of its unit.

Impact: arbitrary fabricated data, even though custom field definitions import correctly.

Fix: let numeric habits collect the actual value; use checkbox toggles only for boolean habits. Provide input for supported notes/time fields. Suggested command: $impeccable harden.

### 5. Deleting a North Star leaves orphaned habits and checkpoints

Location: js/tabs/blueprint.js:161; js/utils.js:171. Category: relationship integrity.

deleteNorthStar removes only the pillar. Reproduction with actual functions: pillar array becomes empty, linkedHabits retains the deleted northStarId, and getLinkedBlocks still returns the habit. Blueprint filters it out because the pillar no longer exists, while Execution retains it. Checkpoints also keep the deleted ID.

Impact: pages disagree about which habits and goals exist or are linked.

Fix: offer reassignment or explicit unlinking of dependents, validate relationships consistently, and re-render affected pages. Suggested command: $impeccable harden.

### 6. Monthly targets are impossible and disagree with Cascade

Location: js/tabs/progress.js:163–177; js/utils.js:146. Category: metrics.

Monthly target is 7 × ceil(days/7), so October displays 35 completions for a 31-day month. Cascade uses the actual number of days and displays /31. All habits also receive a seven-days-per-week target, regardless of realistic frequency.

Impact: even perfect adherence cannot reach the monthly target, and pages disagree.

Fix: derive monthly targets from eligible days and a supported habit frequency; use the same denominator throughout. Suggested command: $impeccable harden.

### 7. Empty Blueprint blocks manual setup

Location: js/tabs/blueprint.js:63. Category: onboarding/task completion.

Browser reproduction: a fresh Blueprint says "Tap Edit to add one", but the Edit button is hidden when there is no content. Add Pillar exists only in edit mode.

Impact: first-time users cannot manually create their first plan and must use JSON or sample data.

Fix: keep the creation entry point visible on an empty Blueprint. Suggested command: $impeccable onboard.

### 8. One-month checkpoint creation has no matching level option

Location: index.html:386; js/tabs/blueprint.js:346. Category: functionality.

Browser reproduction: click plus under 1-Month Checkpoints. The modal Level select contains only 6-Month and 3-Month; setting its value to oneMonth leaves no valid selection. addNewGoal then has no branch for the empty value and can silently add nothing.

Impact: one-month goals cannot be created through their own UI.

Fix: include oneMonth in the form and validate the selected level before saving. Suggested command: $impeccable harden.

### 9. User text is inserted as raw HTML on several pages

Location: js/tabs/blueprint.js:123 and :190; js/tabs/execution.js:88; js/tabs/progress.js:480. Category: rendering/security.

Habit names, goal names, North Star descriptions, and reflections are interpolated into innerHTML without escaping. Quotes can break edit inputs; HTML from imported plans or backups can alter markup or execute event handlers. Constitution already uses escapeHtml, showing an existing safe pattern.

Impact: malformed UI and potential script execution in the app origin.

Fix: use textContent and element properties for text/values or consistent safe escaping, including attribute contexts. Suggested command: $impeccable harden.

### 10. Main calendars are inaccessible and hard to tap

Location: js/tabs/execution.js:69; js/tabs/progress.js:84; style.css:283. Category: accessibility/responsive.

Both calendars use clickable divs without keyboard handlers or button semantics. Habit cells are blank, with date conveyed only by a title tooltip, and no exposed checked state. At 390px, habit cells measure 19.25px square.

Impact: keyboard and assistive-technology users cannot perform the primary tracking task; touch users can mark the wrong day. Relevant WCAG: 2.1.1 Keyboard, 4.1.2 Name/Role/Value, 2.5.8 Target Size (spacing exceptions require careful assessment).

Fix: use labeled buttons with date and pressed state, keyboard support, visible date context, and comfortably spaced targets. Suggested command: $impeccable adapt.

### 11. Forms and modals lack accessible semantics

Location: index.html:160, :301, :370–554. Category: accessibility.

Most visible form labels lack `for` or wrapping association. Modals are generic divs without dialog roles, aria-modal, focus containment, reliable Escape close, or focus restoration. Icon-only close/delete/add buttons lack accessible names. Browser accessibility snapshots expose unnamed buttons and unnamed inputs.

Impact: difficult screen-reader operation and focus can remain behind an open modal. Relevant WCAG: 1.3.1, 2.4.3, 3.3.2, 4.1.2.

Fix: associate labels, name icon buttons, use native dialog or a consistent accessible modal implementation. Suggested command: $impeccable harden.

### 12. Backup restore saves invalid state before validating it

Location: js/tabs/system.js:184–203. Category: persistence/import.

The backup branch accepts any truthy logs/goals/settings, assigns appState and persists before ensuring required arrays/fields exist. A malformed file can then fail rendering but remain saved, despite an "Invalid JSON" message. Unlike the planner importer, this path does not validate before mutation.

Impact: corrupt saved state and an app that may fail on the next reload.

Fix: validate and normalize a candidate backup before replacing or persisting state; preserve the previous state on any failure. Suggested command: $impeccable harden.

## P2 findings

### 13. Editing a past day opens today

Location: js/tabs/progress.js:485. Category: navigation/functionality.

Browser reproduction: select 1 October in monthly Progress, click Edit, and Execution still shows 4 October. The button changes tab without transferring the selected date. Period changes also reset the details panel to trackerDate, which may be outside the displayed period.

Fix: track selectedReviewDate, pass it into Execution, provide date navigation, and preserve selected context. Suggested command: $impeccable harden.

### 14. Weekly and monthly reflections cannot be reviewed later

Location: js/tabs/execution.js:119–153; js/tabs/progress.js:454. Category: information architecture.

Weekly inputs appear only on Friday and monthly inputs only on the last day of the month. Progress renders daily mood/win/learning but never renders saved weeklyReviews or monthlyReviews. Users who miss those days cannot access the intended reflection flow from the UI.

Fix: provide editable period reflections in the corresponding Progress views rather than limiting access to specific dates. Suggested command: $impeccable shape.

### 15. Completion and numeric progress contradict each other

Location: js/tabs/blueprint.js:398; js/tabs/execution.js:379; js/tabs/progress.js:339 and :424. Category: state/copy.

Reaching a target celebrates without setting completed. Marking completed sets only the flag, so a completed checkpoint may still show 0/3 while its progress bar is full. North Star "Checkpoint Achieved" marks the whole pillar rather than a checkpoint. Completing either requires typing "yea boi", adding friction to a reversible action.

Fix: define a consistent distinction between achievement, numeric progress, and explicit completion; communicate it across pages. Rename the pillar action and use a simple reversible confirmation. Suggested command: $impeccable clarify.

### 16. Hidden and overdue deadlines become hard to recover

Location: js/tabs/execution.js:263, :298, :460. Category: visibility/navigation.

Hide Upcoming hides its entire container when nothing is due today; the Show action is inside that hidden container. Overdue goals are excluded from the default 20-day countdown. A goal 31 days away produces an empty countdown card even while Upcoming contains it.

Fix: keep a persistent reveal control, surface overdue items by default, and hide or explain empty countdown sections. Suggested command: $impeccable clarify.

### 17. Text contrast and size are too weak on mobile

Location: style.css tokens; js/tabs/progress.js:475; repeated 7–10px classes. Category: accessibility/responsive.

Base #8888a0 on #121218 has about 5.40:1 contrast, but opacity 0.6 drops to 2.71:1, 0.4 to 1.86:1, and 0.3 to 1.55:1. These faded text styles convey habit state and details. Many labels are 7–10px, compounding the problem. Decorative pulse/confetti has no reduced-motion handling.

Fix: use readable foreground tokens for meaningful text, raise the small-text baseline, and respect reduced motion. Relevant WCAG: 1.4.3 Contrast; reduced-motion support is also good practice. Suggested commands: $impeccable typeset and $impeccable adapt.

### 18. Habit editing and System copy lag behind JSON support

Location: js/tabs/blueprint.js:233–328; index.html:338–344. Category: usability/copy.

Blueprint Edit only changes habit links; it does not expose name/time editing or habit creation/deletion. updateBlockTime exists but has no visible control. Correcting a schedule requires reimporting a complete plan. System still says "Choose Backup File" and "Import a JSON backup" even though it now accepts plans. Cascade hides the period selector, leaving its weekly/monthly context implicit.

Fix: expose basic habit edits, describe both import formats and replacement behavior, and retain a visible period label in Cascade. Suggested command: $impeccable clarify, then $impeccable shape.

## Positive findings

- Complete plan validation now rejects missing habits and broken references before saving.
- Personalized names and schedules replace starter habits and survive reloads.
- Imported Constitution data renders with escaping and supports inline editing.
- Hash routes and desktop/mobile navigation reach all five pages.
- Habit completion and checkpoint completion share one appState rather than independent page stores.
- The app adapts structurally to narrow screens; System cards stack correctly.
- Credentials are removed from cloud snapshots, and imported schedules now propagate through cloud pull.

## Recommended order

1. $impeccable harden: date arithmetic, truthful sync errors, serialized sync, atomic backup validation, and safe text rendering.
2. $impeccable harden: relationship cleanup, numeric habit entry, accurate denominators, and one-month creation.
3. $impeccable onboard: make manual first-plan creation possible.
4. $impeccable adapt: keyboard calendars, accessible modals, form labels, and mobile targets.
5. $impeccable shape / $impeccable clarify: historical editing, period reflections, completion semantics, deadline visibility, and habit editing.
6. $impeccable optimize: render only affected views and avoid redundant cloud pushes.
7. $impeccable polish: readability, consistent copy, reduced motion, and empty-state cleanup.

Re-run $impeccable audit after fixes. These passes can be requested individually or together. Optional: $impeccable init can capture product goals and relationship semantics in PRODUCT.md before expanding the data model.

## Limits and changes

Audit only: no application code was changed or deployed during this review. This report is a new local artifact. Production database permissions, isolation between users, and a live multi-device Supabase session remain unverified. The current single sync row is appropriate only for the intended personal/shared-database setup; a multi-user product needs authentication and per-user storage.
