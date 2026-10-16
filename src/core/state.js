import { initRng } from './rng.js';

export const SAVE_VERSION = 1;
export const ENGINE_VERSION = '0.3.0-r1-depth';
export const MODES = Object.freeze(['FULL_AUTO', 'SEMI_AUTO', 'MANUAL']);
export const SPEEDS = Object.freeze([1, 2, 4, 8]);
export const PHASES = Object.freeze(['ready', 'running', 'awaiting_choice', 'completed']);

export function blankState(seed) {
  return {
    schemaVersion: SAVE_VERSION,
    engineVersion: ENGINE_VERSION,
    seed: String(seed),
    rng: initRng(seed),
    phase: 'ready',
    mode: 'SEMI_AUTO',
    speed: 1,
    world: { year: 1200, wars: {}, history: [] },
    person: null,
    pendingDecision: null,
    timeline: [],
    choiceHistory: [],
    eventHistory: [],
    nextLogId: 1,
    resolvedDecisions: [],
    endReason: null
  };
}

export function assertState(state) {
  if (!state || typeof state !== 'object' || state.schemaVersion !== SAVE_VERSION ||
      !PHASES.includes(state.phase) || !MODES.includes(state.mode) ||
      !SPEEDS.includes(state.speed) || !Number.isInteger(state.world?.year) ||
      !state.rng || !Number.isInteger(state.rng.state) || !Number.isInteger(state.rng.draws) ||
      typeof state.seed !== 'string' || state.seed.length > 256 ||
      !Array.isArray(state.timeline) || !Array.isArray(state.choiceHistory) ||
      !Array.isArray(state.resolvedDecisions) || !Array.isArray(state.eventHistory)) {
    throw new Error('セーブデータが不正、または未対応の形式です');
  }
  if (state.person) {
    if (!Number.isInteger(state.person.age) || state.person.age < 0 || state.person.age > 1000 ||
        !state.person.attributes || typeof state.person.name !== 'string' || state.person.name.length > 100 ||
        !Array.isArray(state.person.injuries) || !Array.isArray(state.person.traits) ||
        !Number.isInteger(state.person.wins) || !Number.isInteger(state.person.battles)) {
      throw new Error('人物データが不正です');
    }
  } else if (state.phase !== 'ready') throw new Error('人物情報がありません');
  if (state.phase === 'awaiting_choice') {
    const p = state.pendingDecision;
    if (!p || typeof p.id !== 'string' || p.id.length > 128 || !Array.isArray(p.options) || !p.options.length ||
        !p.options.every(o => typeof o.id === 'string' && typeof o.label === 'string')) {
      throw new Error('選択待ちデータが不正です');
    }
  } else if (state.pendingDecision !== null) throw new Error('進行状態が不整合です');
  return true;
}

export function cloneState(state) { return structuredClone(state); }

