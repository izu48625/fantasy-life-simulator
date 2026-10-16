import { nextRandom } from '../core/rng.js';

/** Advance actual known characters only. All losses remain in the saved biography. */
export function progressRelationships(person, rng) {
  const p = structuredClone(person);
  if (!p.contacts?.length) return { person: p, rng, news: [] };
  const news = [];
  for (const c of p.contacts) {
    if (!c.alive) continue;
    c.age = (c.age ?? Math.max(1, p.age - (c.ageOffset ?? 0))) + 1;
    const roll = nextRandom(rng); rng = roll.rng;
    const risk = c.age >= 70 ? Math.min(.35, .004 + Math.pow(c.age - 69, 2) * .0014) : .0004;
    if (roll.value < risk) {
      c.alive = false;
      c.deathAge = c.age;
      news.push(`${c.role}${c.name}が${c.age}歳で亡くなった。共に過ごした日々が記憶に残った。`);
    }
  }
  return { person:p, rng, news };
}

