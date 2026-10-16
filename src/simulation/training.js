import { randomInt } from '../core/rng.js';
import { STATS } from '../data/races.js';


const TARGETS = {
  physical: ['STR', 'VIT', 'AGI'],
  sword: ['STR', 'DEX', 'AGI'],
  magic: ['MAG', 'INT', 'DEX'],
  tactics: ['CMD', 'INT', 'DEX'],
  balanced: STATS
};
const CAP = { S: 100, A: 94, B: 84, C: 72, D: 62 };
const MULT = { S: 1.65, A: 1.35, B: 1.1, C: 0.91, D: 0.78 };
export const TRAINING_OPTIONS = Object.freeze([
  { id: 'physical', label: '基礎体力' }, { id: 'sword', label: '剣術' },
  { id: 'magic', label: '魔法学習' }, { id: 'tactics', label: '戦術研究' },
  { id: 'balanced', label: '総合訓練' }
]);
export function trainYear(person, rng, focus = 'balanced') {
  let current = rng;
  const p = structuredClone(person);
  const age = p.age;
  const growthFactor = age <= 11 ? .8 : age <= 25 ? 1.3 : age <= 45 ? .85 : .4;
  const growthType = p.growthType === '早熟' ? (age < 19 ? 1.14 : .85) :
                     p.growthType === '晩成' ? (age < 20 ? .85 : 1.1) :
                     p.growthType === '超晩成' ? (age < 24 ? .72 : 1.18) : 1;
  const quality = p.stage === 'academy' ? 1.28 : p.stage === 'career' ? 1.02 : p.familyAccess;
  const focusStats = TARGETS[focus] || TARGETS.balanced;
  for (const stat of STATS) {
    let luck;
    ({ value: luck, rng: current } = randomInt(current, 0, 100));
    const selected = focusStats.includes(stat);
    const delta = (selected ? 1.15 : .34) * MULT[p.potential] * growthFactor * growthType * quality *
      (.8 + luck / 250) * Math.max(.4, p.health / 100);
    const cap = CAP[p.potential] + (stat === 'MAG' && p.raceId === 'elf' ? 3 : 0);
    const next = Math.min(cap, p.attributes[stat] + delta);
    p.attributes[stat] = Math.round(next * 100) / 100;
  }
  p.trainingFocus = focus;
  return { person: p, rng: current };
}

