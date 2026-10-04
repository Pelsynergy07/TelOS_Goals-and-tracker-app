# UI refinement — October 5, 2026

Retains the existing TelOS colour palette. Shared type roles replace scattered 7–13px utilities; body text, forms, titles and button sizing now follow one scale. Both the desktop web app and the separate Android app assets use these refinements.

Habit completion toggles directly, including numeric habits and checkboxes with optional time/text fields. The completion flag is independent of measured amounts. Optional details expand inline, save without a modal, and never invent values. Android widget rows also toggle directly and preserve recorded amounts.

Phone habit dates and primary toggles are at least 48px high; compact phones use a five-column date list with 48px minimum widths. Navigation respects safe areas. Forms, goal grids and review panels reflow at compact and tablet sizes.

Checks: all five pages at 320px, 768px and 1280px; no horizontal overflow or clipped controls. Real browser checks cover direct toggles, inline amount/note saves, and persistence. Automated tests include reset safety and explicit completion without fabricated amounts. Android assets were copied into the native package; native build status is reported separately.

A cloud reset marker lets updated clients adopt the fresh snapshot before uploading dirty stale data. Older installed Android builds must be updated before reconnecting, as they do not understand this marker.
