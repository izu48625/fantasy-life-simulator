# R1.1 — Chronicle & Battle Statistics

## Goal
Replace a repetitive line list with a factual chapter-by-chapter military biography. Display real metrics and reproducible trends, never invented scores.

## Features
- Year chapters with important event titles, career/admission/promotions and mission chips (victory, pre-battle odds, opponent strength, merit).
- Years without events are folded in continuous spans. Expand them to see annual OVR/health.
- Filters: all / turning points / battle / training / relationships.
- Six prominent KPIs and eight detailed statistics derived from saved results.
- Trend chart: OVR / health / merit / fame with annual snapshots.
- Lifetime summary adds win rate, peak OVR, longest win streak, wartime battles, school marks.
- Seeded simulation engine unchanged (snapshots consume zero random numbers).
- For previous saves without annualRecords, show missing historical trends honestly; resume recording next year.

## Validation
- 28 automated tests passing (22 prior plus 6 new including a batch of 1,000 seeded lives).
- Chromium emulated mobile 390x844 and desktop 1400x900: start, 30 years progress, filters, chart switching; zero page errors.
- iPhone Safari hardware verification still needed.

## Release rules
- Standalone HTML in /index.html is a preview built from /src.
- This is on separate development branch r1/chronicle-and-stats; do not merge the production root of main without user approval.
- R1 Pages preview may be refreshed independently at main/r1/index.html without modifying production root.
