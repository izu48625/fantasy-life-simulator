import { nextRandom, randomInt } from '../core/rng.js';
import { appendEvent } from '../core/event-engine.js';
import { STORY_ARCS } from '../data/story-arcs.js';



const FIRST = ['リュカ', 'イリス', 'ダグ', 'セレナ', 'ハイン', 'ルゥ', 'フィン', 'ノーラ', 'クロウ', 'エイル'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const boost = (p, key, amount) => { p.attributes[key] = clamp(Math.round((p.attributes[key] + amount) * 100) / 100, 0, 100); };
const remembers = (p, key) => !!p.storyFlags?.[key];
function remember(p, key) { p.storyFlags ??= {}; p.storyFlags[key] = true; }
function contact(p, name, role, bond) {
  p.contacts ??= [];
  if (!p.contacts.some(c => c.name === name && c.role === role)) p.contacts.push({ name, role, bond, alive: true, age: p.age + (role === '師匠' ? 28 : 0), ageOffset: role === '師匠' ? -28 : 0 });
}
function newName(s) {
  const draw = randomInt(s.rng, 0, FIRST.length - 1); s.rng = draw.rng;
  return FIRST[draw.value];
}

/** All narrative events are persistent, seeded and derived from the current state; never fabricate a past NPC. */
const STORIES = [
  { id: 'mentor', period: 'childhood', weight: 2, can: p => p.age >= 7 && !remembers(p, 'mentor'), apply(s) {
    const p = s.person, name = newName(s); contact(p, name, '師匠', 2); remember(p, 'mentor');
    boost(p, p.attributes.MAG > p.attributes.STR ? 'MAG' : 'DEX', 3);
    return `旅の師範${name}があなたの可能性を見抜き、無償で技を教えてくれた。指導は後の進学にも役立つだろう。`;
  } },
  { id: 'household', period: 'childhood', weight: 1, can: p => p.age >= 7 && !remembers(p, 'household'), apply(s) {
    const p = s.person; remember(p, 'household');
    if (p.familyId === 'poor' || p.familyId === 'common') {
      p.familyAccess = Math.max(.55, p.familyAccess - .06); boost(p, 'VIT', 2);
      return '家計が苦しくなり、家業を手伝いながら体を鍛えた。学ぶ時間は減ったが、忍耐を身につけた。';
    }
    p.familyAccess = Math.min(1.85, p.familyAccess + .04); boost(p, 'INT', 2);
    return '家業が発展し、以前より良い指導書と教材を手に入れた。';
  } },
  { id: 'aptitude', period: 'childhood', weight: 2, can: p => p.age >= 9 && !remembers(p, 'aptitude'), apply(s) {
    const p = s.person; remember(p, 'aptitude');
    const key = p.attributes.MAG >= p.attributes.STR ? 'MAG' : 'STR'; boost(p, key, p.potential === 'S' || p.potential === 'A' ? 4 : 2);
    p.achievements.push('訓練で才能を評価された');
    return `訓練で${key === 'MAG' ? '魔力制御' : '武術'}の才能が認められた。これは選抜試験での自信につながった。`;
  } },
  { id: 'schoolmate', period: 'academy', weight: 3, can: p => !remembers(p, 'schoolmate'), apply(s) {
    const p = s.person, name = newName(s); remember(p, 'schoolmate'); contact(p, name, '同期', 2);
    boost(p, 'DEX', 1.5); p.education.performance = (p.education.performance || 0) + 1;
    return `同じ教室の${name}と切磋琢磨する日々が始まった。二人の協力は成績にも表れた。`;
  } },
  { id: 'academic_trial', period: 'academy', weight: 2, can: p => !remembers(p, 'academic_trial') && p.education && p.age >= p.education.graduationAge - 3, apply(s) {
    const p = s.person; remember(p, 'academic_trial');
    const proficient = Math.max(p.attributes.INT, p.attributes.DEX, p.attributes.MAG) >= 30;
    p.education.performance = (p.education.performance || 0) + (proficient ? 3 : 1);
    boost(p, proficient ? 'CMD' : 'VIT', proficient ? 2 : 1);
    return proficient ? '学院の公開演習で好成績を収め、教官から次の推薦候補として注目された。' : '厳しい公開演習で苦戦したが、課題を整理して次の訓練に生かした。';
  } },
  { id: 'rival', period: 'academy', weight: 2, can: p => !remembers(p, 'rival'), apply(s) {
    const p = s.person, name = newName(s); remember(p, 'rival'); contact(p, name, '好敵手', -1);
    boost(p, 'AGI', 1.7); p.education.performance = (p.education.performance || 0) + 1;
    return `${name}との模擬戦は接戦に終わった。以来、互いを意識するライバルとなった。`;
  } },
  { id: 'first_comrade', period: 'career', weight: 3, can: p => p.battles > 0 && !remembers(p, 'first_comrade'), apply(s) {
    const p = s.person, name = newName(s); contact(p, name, '戦友', 3); remember(p, 'first_comrade');
    boost(p, 'CMD', 1.5);
    return `任務中に${name}と背中を預け合った。互いを信頼する戦友ができた。`;
  } },
  { id: 'commendation', period: 'career', weight: 2, can: p => p.wins >= 4 && !remembers(p, 'commendation'), apply(s) {
    const p = s.person; remember(p, 'commendation'); p.merit += 3; p.fame += 2;
    return `積み上げてきた${p.wins}勝の実績が評価され、部隊から正式な表彰を受けた。`; 
  } },
  { id: 'mentor_reunion', period: 'career', weight: 1, can: p => remembers(p, 'mentor') && p.age >= (p.occupation?.joinedAt ?? 0) + 4 && !remembers(p, 'mentor_reunion'), apply(s) {
    const p = s.person, name = p.contacts?.find(c => c.role === '師匠' && c.alive)?.name;
    remember(p, 'mentor_reunion'); if (!name) return null;
    p.merit += 1; boost(p, 'INT', 1.6);
    return `かつての師匠${name}に再会した。戦歴を語り合い、若い日の教えを思い出した。`;
  } },
  { id: 'comrade_rescue', period: 'career', weight: 2, can: p => p.battles >= 5 && p.contacts?.some(c => c.role === '戦友' && c.alive) && !remembers(p, 'comrade_rescue'), apply(s) {
    const p = s.person, ally = p.contacts.find(c => c.role === '戦友' && c.alive); remember(p, 'comrade_rescue');
    if (!ally) return null; ally.bond += 2; p.merit += 2;
    return `苦しい撤退で戦友${ally.name}を救い出した。部隊からの信頼が高まり、戦功にも記録された。`;
  } },
  { id: 'wound_return', period: 'career', weight: 1, can: p => p.injuries.length > 0 && !remembers(p, 'wound_return'), apply(s) {
    const p = s.person; remember(p, 'wound_return'); p.health = Math.min(100, p.health + 10);
    return '負傷からの長い回復期を経験した。治療と再訓練を重ね、任務への復帰を果たした。';
  } },
  { id: 'veteran', period: 'career', weight: 2, can: p => p.battles >= 15 && !remembers(p, 'veteran'), apply(s) {
    const p = s.person; remember(p, 'veteran'); boost(p, 'CMD', 2); p.achievements.push('古参兵として新兵の指導を任された');
    return '長年の戦場経験を認められ、新兵の指導を任されるようになった。';
  } }
];

function arcEligible(entry, state) {
  const p = state.person;
  const years = p.age - (p.education?.graduationAge ?? p.age) + 5;
  const c = p.contacts?.find(c => c.role === entry.needsContactRole && c.alive);
  return !remembers(p, entry.id) &&
    (!entry.minAge || p.age >= entry.minAge) &&
    (!entry.minEduYears || years >= entry.minEduYears) &&
    (!entry.minBattles || p.battles >= entry.minBattles) &&
    (!entry.minLosses || p.battles-p.wins >= entry.minLosses) &&
    (!entry.minMerit || p.merit >= entry.minMerit) &&
    (entry.minRank === undefined || p.rankIndex >= entry.minRank) &&
    (!entry.familyIds || entry.familyIds.includes(p.familyId)) &&
    (!entry.careerIds || entry.careerIds.includes(p.occupation?.careerId)) &&
    (!entry.requires || entry.requires.every(key => remembers(p, key))) &&
    (!entry.needsContactRole || !!c);
}
function applyArc(entry, state) {
  const p = state.person;
  const friend = p.contacts?.find(c => c.role === entry.needsContactRole && c.alive);
  remember(p, entry.id);
  for (const [key, n] of Object.entries(entry.effect)) {
    if (key in p.attributes) boost(p, key, n);
    else if (key === 'education' && p.education) p.education.performance = Math.max(0, (p.education.performance || 0) + n);
    else if (key === 'bond' && friend) friend.bond = clamp(friend.bond + n, -10, 10);
    else if (key === 'health') p.health = clamp(p.health + n, 0, 100);
    else if (key === 'familyAccess') p.familyAccess = clamp(p.familyAccess + n, .5, 2);
    else p[key] = clamp((p[key] || 0) + n, 0, 1000);
  }
  return entry.text.replaceAll('{name}', friend?.name ?? '');
}
const ALL_STORIES = [...STORIES, ...STORY_ARCS.map(entry => ({
  id: entry.id, period: entry.period, weight: entry.weight,
  can: (p, s) => arcEligible(entry, s), apply: s => applyArc(entry, s)
}))];

export function progressStory(state) {
  const p = state.person;
  if (!p || !['childhood', 'academy', 'career'].includes(p.stage) || p.age < 6) return state;
  const roll = nextRandom(state.rng); state.rng = roll.rng;
  const candidates = ALL_STORIES.filter(e => e.period === p.stage && e.can(p, state));
  if (!candidates.length || roll.value > (p.stage === 'academy' ? .73 : p.stage === 'career' ? .62 : .49)) return state;
  const weighted = candidates.reduce((n, e) => n + e.weight, 0);  let cursor = roll.value / (p.stage === 'academy' ? .73 : p.stage === 'career' ? .62 : .49) * weighted;
  const entry = candidates.find(e => (cursor -= e.weight) < 0) ?? candidates.at(-1);
  const text = entry.apply(state);
  if (text) appendEvent(state, 'story', text, 'major', { storyId: entry.id });
  return state;
}

export const STORY_CHOICE_SETS = Object.freeze({
  pathway: [{ id: 'sword', label: '剣術を重点的に習う' }, { id: 'magic', label: '魔法と学問を学ぶ' }, { id: 'tactics', label: '戦術と指揮を学ぶ' }],
  fellowship: [{ id: 'competition', label: '首席を目指して競い合う' }, { id: 'cooperation', label: '同期との協力を優先する' }, { id: 'discipline', label: '基礎練習を徹底する' }],
  conviction: [{ id: 'honor', label: '戦功と昇進を狙う' }, { id: 'comrades', label: '仲間を守ることを優先' }, { id: 'safety', label: '生存と撤退判断を優先' }]
});

/** Player choices produce explicit long-lived effects, used by admissions, battles and promotions. */
export function applyStoryChoice(state, type, selected) {
  const p = state.person;
  if (type === 'pathway') {
    const stat = selected === 'magic' ? 'MAG' : selected === 'tactics' ? 'CMD' : 'DEX';
    boost(p, stat, 4); p.trainingFocus = selected === 'magic' ? 'magic' : selected === 'tactics' ? 'tactics' : 'sword';
    p.pathway = selected;
    appendEvent(state, 'story', `将来に備え、${STORY_CHOICE_SETS.pathway.find(o => o.id === selected).label}ことに決めた。${stat}が伸び、以後の訓練方針も変わった。`, 'major');
  } else if (type === 'fellowship') {
    p.education.performance = (p.education.performance || 0) + (selected === 'competition' ? 4 : 2);
    if (selected === 'competition') { p.ambition = clamp(p.ambition + 6, 0, 100); boost(p, 'DEX', 3); }
    else if (selected === 'cooperation') { p.teamwork = (p.teamwork || 0) + 2; boost(p, 'CMD', 3); }
    else { p.health = Math.min(100, p.health + 8); boost(p, 'VIT', 3); }
    appendEvent(state, 'story', `学院生活で「${STORY_CHOICE_SETS.fellowship.find(o => o.id === selected).label}」と決意した。その姿勢は卒業評価にも反映された。`, 'major');
  } else if (type === 'conviction') {
    p.conviction = selected;
    if (selected === 'honor') { p.merit += 3; p.ambition = clamp(p.ambition + 5, 0, 100); }
    else if (selected === 'comrades') { p.teamwork = (p.teamwork || 0) + 3; boost(p, 'CMD', 2); }
    else { p.caution = clamp(p.caution + 8, 0, 100); p.health = Math.min(100, p.health + 6); }
    appendEvent(state, 'story', `戦場の経験を経て「${STORY_CHOICE_SETS.conviction.find(o => o.id === selected).label}」と心に決めた。この信念が以後の戦いに影響する。`, 'major');
  }
}

