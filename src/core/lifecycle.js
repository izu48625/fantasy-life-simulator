import { blankState, cloneState, MODES } from './state.js';
import { rollBirth } from '../simulation/birth.js';
import { trainYear } from '../simulation/training.js';
import { attemptAdmission, chooseAcademy, graduate, evaluateAcademyYear } from '../simulation/academy.js';
import { attemptCareer, preferredCareer, maybePromote } from '../simulation/career.js';
import { attemptTransfer, maybeReassign } from '../simulation/career-paths.js';
import { resolveBattle } from '../simulation/battle.js';
import { progressWorld } from '../simulation/world.js';
import { recover } from '../simulation/injury.js';
import { progressRelationships } from '../simulation/relationships.js';
import { progressStory, applyStoryChoice } from '../simulation/story.js';
import { RACES } from '../data/races.js';
import { nextRandom } from './rng.js';
import { appendEvent } from './event-engine.js';
import { recordAnnualSnapshot } from './chronicle.js';
import { determineDecision, autoChoose } from './auto-decision.js';
















export function startLife(seed, { mode = 'SEMI_AUTO', speed = 1 } = {}) {
  if (!MODES.includes(mode)) throw new Error('Invalid mode');
  let s = blankState(seed);
  s.mode = mode;
  s.speed = [1, 2, 4, 8].includes(speed) ? speed : 1;
  const born = rollBirth(s.rng);
  s.rng = born.rng;
  s.person = born.person;
  s.phase = 'running';
  appendEvent(s, 'birth', `${s.person.nationName}の${s.person.familyName}に、${s.person.name}が生まれた。`, 'major');
  recordAnnualSnapshot(s);
  return s;
}

export function configureLife(state, { mode, speed } = {}) {
  const s = cloneState(state);
  if (mode !== undefined) { if (!MODES.includes(mode)) throw new Error('Invalid mode'); s.mode = mode; }
  if (speed !== undefined) { if (![1, 2, 4, 8].includes(speed)) throw new Error('Invalid speed'); s.speed = speed; }
  return s;
}

function advanceCommittedYear(state, decision = null, selectedId = null) {
  const s = cloneState(state);
  if (s.phase === 'completed') return s;
  if (s.phase === 'awaiting_choice') throw new Error('Choice must be resolved first');
  const p = s.person;
  if (!p || p.stage === 'deceased') throw new Error('No active life');
  const race = RACES.find(r => r.id === p.raceId);
  p.age += 1;
  let next = progressWorld(s.world, s.rng);
  s.world = next.world; s.rng = next.rng;
  const recentWar = s.world.history.at(-1);
  if (recentWar?.year === s.world.year && recentWar.nationId === p.nationId && p.age >= race.adultAge-5)
    appendEvent(s,'story',`故国で${recentWar.event}が発表された。配属先と任務の危険度に影響する。`,'major');
  let focus = decision?.type === 'training' ? selectedId : p.trainingFocus;
  if (p.stage === 'childhood' || p.stage === 'academy' || p.stage === 'career') {
    next = trainYear(p, s.rng, focus);
    s.person = next.person; s.rng = next.rng;
  }
  let person = recover(s.person);
  next = progressRelationships(person,s.rng);
  person=next.person;s.rng=next.rng;
  s.person = person;
  for (const news of next.news) appendEvent(s, 'story', news, 'major');
  if (decision && ['pathway','fellowship','conviction'].includes(decision.type)) applyStoryChoice(s, decision.type, selectedId);

  const academyStart = race.adultAge - 5;
  if (person.age === academyStart && person.stage === 'childhood') {
    next = attemptAdmission(person, s.rng, decision?.type === 'academy' ? selectedId : chooseAcademy(person));
    s.person = next.person; s.rng = next.rng;
    appendEvent(s, 'admission', next.log, 'major');
  }
  if (s.person.stage === 'academy' && s.person.age > (s.person.education.startedAt ?? s.person.education.graduationAge - 5)) {
    next = evaluateAcademyYear(s.person, s.rng);
    s.person=next.person;s.rng=next.rng;
    if(next.log) appendEvent(s,'training',next.log);
  }
  if (s.person.stage === 'academy' && s.person.age >= s.person.education.graduationAge) {
    s.person = graduate(s.person);
    appendEvent(s, 'graduation', `${s.person.education.institutionName}を${s.person.education.ranking}（卒業評価${s.person.education.graduationScore}）で卒業した。`, 'major');
  }
  if (s.person.stage === 'awaiting_career') {
    // Career applications occur in the year AFTER graduation, not in the graduation year.
    if (s.person.age > s.person.education.graduationAge) {
      next = attemptCareer(s.person, s.rng, decision?.type === 'career' ? selectedId : preferredCareer(s.person));
      s.person = next.person; s.rng = next.rng;
      appendEvent(s, 'career', next.log, 'major');
    }
  }
  if (s.person.stage === 'career' && decision?.type === 'transfer') {
    next=attemptTransfer(s.person,s.rng,selectedId);
    s.person=next.person;s.rng=next.rng;
    appendEvent(s,next.kind,next.log,next.importance);
  }
  if (s.person.stage === 'career') {
    const atWar = !!s.world.wars[s.person.nationId];
    const missionRoll = nextRandom(s.rng); s.rng = missionRoll.rng;
    const doBattle = (atWar || missionRoll.value < .65) && s.person.health >= 35 && !s.person.convalescentYears;
    if (!doBattle && s.person.convalescentYears > 0 && s.person.age % 2 === 0)
      appendEvent(s,'training','負傷による療養と再訓練のため、前線任務を離れた。');
    if (doBattle) {
      const tactic = decision?.type === 'battle' ? selectedId : 'balanced';
      next = resolveBattle(s.person, s.rng, { war: atWar, tactic });
      s.person = next.person; s.rng = next.rng;
      appendEvent(s, 'battle', next.log, 'major', next.result);
      if (next.result.dead) return complete(s, '戦死');
    }
    next = maybePromote(s.person, s.rng);
    s.person = next.person; s.rng = next.rng;
    if (next.log) appendEvent(s, 'promotion', next.log, 'major');
    if (next.reviewLog) appendEvent(s, 'review', next.reviewLog);
    next=maybeReassign(s.person,s.rng);
    s.person=next.person;s.rng=next.rng;
    if(next.log)appendEvent(s,'assignment',next.log,'major');
  }
  if (s.person.stage === 'career' && s.person.age >= race.retireAge) {
    s.person.stage = 'retired'; s.person.retired = true;
    appendEvent(s, 'retirement', `長い軍歴を終え、${s.person.age}歳で引退した。`, 'major');
  }
  // Model baseline lifespan for demo only; R6 will calibrate race/occupation death curves.
  if (s.person.age >= race.retireAge - 12) {
    const death = nextRandom(s.rng); s.rng = death.rng;
    const onset = Math.max(0, s.person.age - (race.retireAge - 12));
    const risk = Math.min(.58, .001 + onset * onset * .00045);
    if (death.value < risk || s.person.age >= race.maxAge) return complete(s, '老衰・病死');
  }
  progressStory(s);
  if (s.person.age % 5 === 0 && s.person.stage !== 'deceased') {
    appendEvent(s, 'training', `${s.person.age}歳。${s.person.stage === 'retired' ? '穏やかな日々を過ごす。' : '訓練と経験を積み重ねた。'}`);
  }
  recordAnnualSnapshot(s);
  return s;
}

function complete(state, reason) {
  state.endReason = reason;
  state.person.deathAge = state.person.age;
  state.person.stage = 'deceased';
  state.phase = 'completed';
  state.pendingDecision = null;
  appendEvent(state, 'death', `${state.person.age}歳で生涯を閉じた（${reason}）。`, 'major');
  recordAnnualSnapshot(state);
  return state;
}

/** Idempotent while a decision is pending; no year is applied until choice. */
export function stepLife(state) {
  if (state.phase === 'completed' || state.phase === 'ready') return cloneState(state);
  if (state.phase === 'awaiting_choice') {
    if (state.mode !== 'FULL_AUTO') return cloneState(state);
    return resolveChoice(state, state.pendingDecision.id, autoChoose(state, state.pendingDecision));
  }
  const decision = determineDecision(state);
  if (!decision) return advanceCommittedYear(state);
  if (state.mode === 'FULL_AUTO' || (state.mode === 'SEMI_AUTO' && !decision.important)) {
    const selected = autoChoose(state, decision);
    const s = advanceCommittedYear(state, decision, selected);
    s.choiceHistory.push({ id: decision.id, type: decision.type, age: decision.age, selection: selected, mode: state.mode });
    return s;
  }
  const s = cloneState(state);
  s.phase = 'awaiting_choice';
  s.pendingDecision = decision;
  return s;
}

/** One atomic transaction: validated choice -> exactly one simulated year. */
export function resolveChoice(state, decisionId, selectedId) {
  if (state.phase !== 'awaiting_choice' || !state.pendingDecision || state.pendingDecision.id !== decisionId) {
    throw new Error('選択は既に処理されたか、期限切れです');
  }
  const choice = state.pendingDecision;
  if (!choice.options.some(o => o.id === selectedId)) throw new Error('選択肢が不正です');
  const next = cloneState(state);
  next.phase = 'running';
  next.pendingDecision = null;
  const finalState = advanceCommittedYear(next, choice, selectedId);
  finalState.choiceHistory.push({ id: choice.id, type: choice.type, age: choice.age,
    selection: selectedId, mode: state.mode });
  finalState.resolvedDecisions.push(choice.id);
  return finalState;
}

export function runToCompletion(initial, maxSteps = 1000) {
  let state = configureLife(initial, { mode: 'FULL_AUTO' });
  for (let i = 0; i < maxSteps && state.phase !== 'completed'; i++) state = stepLife(state);
  if (state.phase !== 'completed') throw new Error('Simulation failed to finish');
  return state;
}

