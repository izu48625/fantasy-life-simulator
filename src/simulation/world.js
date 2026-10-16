import { NATIONS } from '../data/nations.js';
import { nextRandom } from '../core/rng.js';


export function progressWorld(world, rng) {
  const next = structuredClone(world);
  next.year += 1;
  for (const nation of NATIONS) {
    const res = nextRandom(rng); rng = res.rng;
    const current = !!next.wars[nation.id];    next.wars[nation.id] = current ? res.value > .17 : res.value < nation.threat * .085;
    if (next.wars[nation.id] !== current) {
      next.history.push({ year: next.year, nationId: nation.id, event: next.wars[nation.id] ? '開戦' : '休戦' });
    }
  }
  return { world: next, rng };
}

