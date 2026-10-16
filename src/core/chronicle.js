import { combatRating } from '../simulation/battle.js';

/** A historical snapshot is a fact, not a generated narrative event. It consumes no RNG. */
export function recordAnnualSnapshot(state) {
  if (!state.person) return state;
  const p = state.person;
  const snapshot = {
    age: p.age, year: state.world.year, stage: p.stage,
    ovr: combatRating(p), health: p.health, merit: p.merit, fame: p.fame,
    battles: p.battles, wins: p.wins, rankIndex: p.rankIndex,
    careerId: p.occupation?.careerId ?? null, occupation: p.occupation?.careerName ?? null,
    school: p.education?.institutionName ?? null,
    attributes: { ...p.attributes }
  };
  state.annualRecords ??= [];
  if (state.annualRecords.at(-1)?.age === p.age) state.annualRecords[state.annualRecords.length - 1] = snapshot;
  else state.annualRecords.push(snapshot);
  return state;
}
