# TelOS interface audit and refinement

Scope: Execution, Progress, Constitution, Blueprint, System, editors and setup dialogs; desktop and responsive source rules. Evidence: user screenshots and source review. Live browser QA is unavailable in this session, so this is not a claim of complete visual or WCAG compliance.

## Findings and changes

| Priority | Finding | User impact | Change |
|---|---|---|---|
| P1 | Period arrows had 44 px minimum heights inside a padded wrapper while view tabs used content padding. | Progress controls visibly misaligned. | Both wrappers share the same height token, inset and border radius; arrows and tabs share a control height. |
| P1 | Backup, restore, sample data, checkpoints and editor actions each used custom button markup. | Inconsistent radii, weights and touch targets. | Converted to shared action and icon components. Restore is now a keyboard-accessible button. |
| P1 | URL inputs were missing from the form styling selectors. | A bright unstyled field broke the dark theme. | All URL fields share text input styling, including phone sizing. |
| P1 | Mobile caption scaling enlarged secondary UI while some icon controls remained tiny. | Uneven hierarchy and difficult taps. | Stable caption size; 48 px mobile action/icon targets, with separate navigation and calendar roles. |
| P2 | Logo was a pulsing connection dot plus a monospace wordmark. | Branding looked like a status indicator. | Removed the dot and animation; clean Geist wordmark in desktop and mobile headers. |
| P2 | Sidebar destinations were separated by a large empty space. | Navigation was harder to scan. | One contiguous navigation group; streak remains at the bottom. |
| P2 | Low-opacity muted text compounded an already muted color. | Labels became difficult to read. | Full secondary-text token for content; neutral text/card contrast exceeds 4.5:1. |
| P2 | Page headings, card headings and dialogs had competing styles. | Inconsistent visual hierarchy. | Page titles remain Instrument Serif; Geist for card/dialog headings and task labels. |
| P2 | Large/extra-large radii were mixed with small square action controls. | Surfaces and buttons lacked a consistent relationship. | 12 px surfaces, 8 px controls and 5 px segmented insets. |
| P2 | Focus and selected navigation states were incomplete. | Keyboard and screen-reader orientation was weaker. | Shared focus outlines; navigation aria-current; view buttons aria-pressed. |

## What was preserved

Dark palette, personalized JSON importing, direct calendar completion, daily drag ordering, checkpoint disclosure, date editing, cloud sync/conflict handling and the short setup guide.

## Verification and limits

- HTML nesting and unique IDs checked.
- Modified JavaScript syntax checked.
- Existing import, tracking and sync regression suite run.
- Responsive rules reviewed for control sizing, wrapping and safe-area navigation.
- No live browser screenshots or physical Android checks are available; rendered alignment and drag gestures still need visual QA.
- Existing runtime Tailwind/CDN dependencies remain. Bundling/pinning them would be a separate performance/dependency change.
