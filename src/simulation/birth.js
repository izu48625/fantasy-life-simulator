import { randomInt, weightedPick } from '../core/rng.js';
import { GROWTH_TYPES, RACES, STATS } from '../data/races.js';
import { NATIONS } from '../data/nations.js';



const FAMILIES = Object.freeze([
  { id: 'royalty', name: '王族・大貴族', weight: 1, access: 1.7 },
  { id: 'noble', name: '上級貴族', weight: 4, access: 1.5 },
  { id: 'military', name: '騎士・軍人家庭', weight: 12, access: 1.3 },
  { id: 'wealthy', name: '裕福な商工家庭', weight: 13, access: 1.25 },
  { id: 'common', name: '一般家庭', weight: 50, access: 1 },
  { id: 'poor', name: '貧困家庭', weight: 20, access: 0.72 }
]);
const FIRST_NAMES = ['アルン', 'リゼル', 'フェル', 'ミラ', 'ガルド', 'ティナ', 'セオ', 'ヴェラ', 'ノイン', 'アシュ', 'ロア', 'エル'];
const LAST_NAMES = ['ヴァイス', 'フェルン', 'ダール', 'レイン', 'トルク', 'グレイ', 'アルス', 'ブルグ', 'ミスト', 'ベルク'];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function rollBirth(rng) {
  let v;
  ({ value: v, rng } = weightedPick(rng, RACES.map(r => ({ value: r, weight: r.weight }))));
  const race = v;
  ({ value: v, rng } = weightedPick(rng, NATIONS.map(n => ({ value: n, weight: n.weight }))));
  const nation = v;
  ({ value: v, rng } = weightedPick(rng, FAMILIES.map(f => ({ value: f, weight: f.weight }))));
  const family = v;
  let a, b;
  ({ value: a, rng } = randomInt(rng, 0, FIRST_NAMES.length - 1));
  ({ value: b, rng } = randomInt(rng, 0, LAST_NAMES.length - 1));
  const name = `${FIRST_NAMES[a]}・${LAST_NAMES[b]}`;
  ({ value: v, rng } = randomInt(rng, 0, 1));
  const sex = v ? '女性' : '男性';
  ({ value: v, rng } = randomInt(rng, 0, 99));
  const potential = v < 2 ? 'S' : v < 12 ? 'A' : v < 38 ? 'B' : v < 78 ? 'C' : 'D';
  ({ value: v, rng } = randomInt(rng, 0, 99));
  const growthType = GROWTH_TYPES[v < 20 ? 0 : v < 74 ? 1 : v < 94 ? 2 : 3];
  ({ value: v, rng } = randomInt(rng, 20, 90));
  const ambition = v;
  ({ value: v, rng } = randomInt(rng, 20, 90));
  const caution = v;
  const attributes = {};
  // Potential affects learning, not starting attributes: class is not genetic destiny.
  for (const stat of STATS) {
    ({ value: v, rng } = randomInt(rng, 7, 22));
    attributes[stat] = clamp(v + race.modifiers[stat], 1, 100);
  }
  const person = {
    id: `hero-${rng.seed.slice(0, 50)}`, name, sex, age: 0,
    raceId: race.id, raceName: race.name, nationId: nation.id, nationName: nation.name,
    familyId: family.id, familyName: family.name, familyAccess: family.access,
    potential, growthType, traits: [], ambition, caution, attributes,
    education: null, occupation: null, rankIndex: 0,
    stage: 'childhood', trainingFocus: 'balanced',
    battles: 0, wins: 0, merit: 0, fame: 0, injuries: [], health: 100,
    deathAge: null, achievements: [], retired: false
  };
  return { person, rng };
}

