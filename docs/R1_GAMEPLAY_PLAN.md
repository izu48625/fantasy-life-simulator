# R1 Gameplay Depth — 6-role development plan

**Goal:** The life story should be a chain of causes and consequences, not repeated generic battle cards.

**Scope of current preview (not R1 COMPLETE):**
- 12 seeded, context-sensitive story events: mentor, family finances, aptitude, schoolmates, school exercise, rivalry, comrades, commendation, mentor reunion, rescue, rehabilitation, veteran teaching.
- Three important player choices: specialization at 10, academy discipline near graduation, early-career personal conviction.
- Consequences: attributes, training focus, academy admission probability, academy grade/honors, career application probability, battle rating/injury risk, promotion weighting.
- Persistent related NPC identities in timeline, profile and life summary.
- Choice state remains atomic; no duplicate year processing, seeded RNG, Local-first.

**Roles (logical ownership; not six simultaneously-running autonomous agents):**
1. AI-1 architect: core state/lifecycle/RNG, save compatibility, integration, release review. [#1](https://github.com/izu48625/fantasy-life-simulator/issues/1)
2. AI-2 birth/education: birth/training/academy and related data, exam and graduation quality. [#2](https://github.com/izu48625/fantasy-life-simulator/issues/2)
3. AI-3 career/combat: battle/career/world/injury, wars and rank balance. [#3](https://github.com/izu48625/fantasy-life-simulator/issues/3)
4. AI-4 narrative/AUTO: story events/flags/choices/NPC consistency. [#4](https://github.com/izu48625/fantasy-life-simulator/issues/4)
5. AI-5 UX: timeline and visible consequences in iPhone Safari. [#5](https://github.com/izu48625/fantasy-life-simulator/issues/5)
6. AI-6 QA: regressions, long-run seeded population simulations, security/mobile audit. [#6](https://github.com/izu48625/fantasy-life-simulator/issues/6)

**Verified on local modular source build (2026-10-16):**
- Node tests 14/14 passed.
- 1,000 seeded FULL AUTO lives all completed.
- Same seed + same decisions gives same results; different 10yo pathway choices alter outcomes.
- Previously-saved R0 states can advance with missing optional story fields in tested case.
- Live Chromium/Safari browser QA has **not** been completed: the testing container blocked browser navigation.

**Known limitations:** R0 has only 9 event kinds, R1 adds 12 story templates, fewer than the intended 30–50. Nation simulation and NPC aging remain limited; 64.4% selected regular army in the sampled R1 cohort. R1 values are provisional and not balanced for release.

**Release guardrail:** branch `r1/gameplay-depth-foundations` is preview only. Keep GitHub Pages/main R0 as the stable user-facing game until explicit approval after QA. No paid services or changes to other repositories.
