# R1 gameplay depth handoff

R1 preview branch: `r1/gameplay-depth-foundations`. Production `main` is R0 and was not modified.

## Gameplay
- 50 total story templates (12 specialized original + 38 conditional data arcs).
- Personal scholarship/admission exam, annual academy mark, recorded graduation rank.
- Career preference and failure pathways, ranked placement, occupation-specific battle missions.
- Recovery time, permanent injuries and NPC aging/mortality, contextual timeline.
- Saving remains schema v1 to support R0 data, seeded and deterministic.

## Validation (local working source)
- 22/22 Node tests passing.
- 1,000 FULL AUTO seeded lives completed.
- R0 65.7% army => R1 36.6% army in the measured sample.
- iPhone Safari **not** independently verified in this iteration.

## Ownership
AI-1 core/state + integration; AI-2 academy/training; AI-3 career/combat/injury/world; AI-4 story/choices; AI-5 UI; AI-6 tests/reliability.

This GitHub source tree was recovered mechanically from the tested standalone bundle. The downloadable source ZIP also includes local detailed tests and the original project build scripts. Validate standalone regeneration on GitHub CI before merging; a regenerated bundle need not be byte-identical to the already tested standalone.
