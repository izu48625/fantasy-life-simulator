import { randomInt, nextRandom } from '../core/rng.js';
import { CAREERS } from '../data/careers.js';

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const MISSIONS = {
 knight: ['王都の街道警護','騎士団の救援行軍'],army:['国境の歩哨任務','野戦部隊の巡回'],
 mage:['魔導障壁の防衛','危険な魔物の封印'],adventurer:['遺跡の魔物討伐','洞窟の危険生物調査'],
 mercenary:['商隊の武装護衛','山道での傭兵任務'],special:['敵地偵察','隠密潜入作戦']
};
export function combatRating(person) {
  const career = CAREERS.find(c => c.id === person.occupation?.careerId) ?? CAREERS[1];
  const mean = career.attr.reduce((sum, x) => sum + person.attributes[x], 0) / career.attr.length;
  return clamp(Math.round(mean + person.rankIndex * 3 + Math.min(10, person.battles * .15) -
    (100 - person.health) * .12 + Math.min(2, person.teamwork || 0)), 0, 100);
}
export function resolveBattle(person, rng, { war = false, tactic = 'balanced' } = {}) {
  let p = structuredClone(person), opponent;
  ({ value: opponent, rng } = randomInt(rng, war ? 25 : 12, war ? 84 : 66));
  const modifiers = tactic === 'bold' ? 3 : tactic === 'cautious' ? -3 : 0;
  const strength = combatRating(p) + modifiers + (war ? -4 : 0);
  const winChance = clamp(1 / (1 + Math.exp(-(strength - opponent) / 15)), .05, .95);
  const job=p.occupation?.careerId||'army';
  const mission=(war?'国家間戦争の前線':MISSIONS[job]?.[p.battles%2] || '巡回警備');
  let dieRoll, injuryRoll;
  ({ value: dieRoll, rng } = nextRandom(rng));
  const win = dieRoll < winChance;
  ({ value: injuryRoll, rng } = nextRandom(rng));
  p.battles += 1;
  if (win) { p.wins += 1; p.merit += war ? 3 : 1; p.fame += war ? 2 : 1; }
  const injuryRisk = clamp((war ? .19 : .10) - (p.conviction === 'safety' ? .035 : 0) + (tactic === 'bold' ? .11 : tactic === 'cautious' ? -.055 : 0) +
      (win ? -.025 : .055), .01, .5);
  let injury = null;
  if (injuryRoll < injuryRisk) {
    let severity;
    ({ value: severity, rng } = nextRandom(rng));
    const serious=severity < (war ? .24 : .13);
    const lasting=serious && severity < (war ? .055 : .025);
    injury=lasting?'後遺症':serious?'重傷':'軽傷';
    p.health=Math.max(0,p.health-(lasting?40:serious?33:12));
    if(serious)p.convalescentYears=Math.max(p.convalescentYears||0,lasting?3:2);
    if(lasting){p.attributes.VIT=Math.max(0,p.attributes.VIT-3);p.attributes.AGI=Math.max(0,p.attributes.AGI-4);}
    p.injuries.push({age:p.age,kind:injury,mission});
  }
  // Independent fatality roll, even the strongest is not invulnerable.
  let fatalRoll;
  ({ value: fatalRoll, rng } = nextRandom(rng));
  const fatalityRisk = clamp((war ? .012 : .0025) * (win ? .45 : 2.4) *
     (tactic === 'bold' ? 1.6 : tactic === 'cautious' ? .48 : 1) *
     (injury === '重傷' ? 1.8 : 1), .0001, .1);
  const dead = fatalRoll < fatalityRisk;
  const result = {
    age: p.age, win, opponent, winChance: Math.round(winChance * 1000) / 1000,
    tactic, war, mission, injury, dead, fatalityRisk: Math.round(fatalityRisk * 1e6) / 1e6
  };
  return { person: p, rng, result,
    log: `${mission}：${win ? '目標を達成' : '目標達成ならず'}（勝算${Math.round(winChance*100)}%）。` +
      (injury ? `${injury}を負った。` : '') + (dead ? '戦死した。' : win ? '実戦経験を積んだ。' : '撤退と反省を余儀なくされた。') };
}

