import { TRAINING_OPTIONS } from '../simulation/training.js';
import { INSTITUTIONS } from '../data/institutions.js';
import { CAREERS } from '../data/careers.js';
import { chooseAcademy } from '../simulation/academy.js';
import { preferredCareer } from '../simulation/career.js';
import { RACES } from '../data/races.js';
import { STORY_CHOICE_SETS } from '../simulation/story.js';







const TACTICS = [{ id: 'bold', label: '積極的に戦う' }, { id: 'balanced', label: '堅実に戦う' }, { id: 'cautious', label: '損害を抑える' }];

export function determineDecision(state) {
  if (!state.person || state.phase === 'completed') return null;
  const p = state.person;
  const race = RACES.find(r => r.id === p.raceId);
  const targetAge = p.age + 1;
  const academyStart = race.adultAge - 5;
  let type = null, title = null, options = null, important = false;
  if (targetAge === academyStart && p.stage === 'childhood') {
    type = 'academy'; title = '進学先を希望する';
    options = INSTITUTIONS.map(a => ({ id: a.id, label: a.name })); important = true;
  } else if (targetAge === 10 && p.stage === 'childhood') {
    type = 'pathway'; title = '将来の得意分野を選ぶ'; options = STORY_CHOICE_SETS.pathway; important = true;
  } else if (p.stage === 'academy' && targetAge === p.education.graduationAge - 2) {
    type = 'fellowship'; title = '学院生活の方針を決める'; options = STORY_CHOICE_SETS.fellowship; important = true;
  } else if (p.stage === 'career' && targetAge === p.occupation.joinedAt + 4) {
    type = 'conviction'; title = '戦士としての信念を選ぶ'; options = STORY_CHOICE_SETS.conviction; important = true;
  } else if (p.stage === 'awaiting_career') {
    type = 'career'; title = '卒業後の進路を希望する';
    options = CAREERS.map(c => ({ id: c.id, label: c.name })); important = true;
  } else if (p.stage === 'career' && targetAge % 5 === 0 && state.world.wars[p.nationId]) {
    type = 'battle'; title = '危険な出撃への方針'; options = TACTICS; important = true;
  } else if (state.mode === 'MANUAL' && targetAge >= 5 && p.stage !== 'retired' && p.stage !== 'deceased') {
    type = 'training'; title = '次の一年の訓練方針'; options = TRAINING_OPTIONS;
  }
  return type ? { id: `choice-${targetAge}-${type}`, type, age: targetAge, title, options, important } : null;
}

export function autoChoose(state, decision) {
  const p = state.person;
  if (decision.type === 'pathway') return p.attributes.MAG > p.attributes.STR + 4 ? 'magic' : p.ambition > 65 ? 'sword' : 'tactics';
  if (decision.type === 'fellowship') return p.ambition > 66 ? 'competition' : p.caution > 65 ? 'discipline' : 'cooperation';
  if (decision.type === 'conviction') return p.ambition > 70 ? 'honor' : p.caution > 60 ? 'safety' : 'comrades';
  if (decision.type === 'academy') return chooseAcademy(p);
  if (decision.type === 'career') return preferredCareer(p);
  if (decision.type === 'battle') return p.caution > 68 ? 'cautious' : p.ambition > 72 ? 'bold' : 'balanced';
  if (decision.type === 'training') {
    const a = p.attributes;
    return a.MAG > a.STR + 12 ? 'magic' : a.CMD + a.INT > a.STR + a.AGI + 18 ? 'tactics' : 'balanced';
  }
  return decision.options[0].id;
}

