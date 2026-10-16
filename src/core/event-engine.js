import { EVENT_CATALOG } from '../data/events.js';

const VALID = new Set(EVENT_CATALOG.map(e => e.id));
export function appendEvent(state, kind, text, importance = 'minor', detail = null) {
  if (!VALID.has(kind)) throw new Error(`Unknown event: ${kind}`);
  const entry = { id: state.nextLogId++, kind, age: state.person.age, year: state.world.year,
    importance, text, ...(detail ? { detail } : {}) };
  state.timeline.push(entry);
  state.eventHistory.push(kind);
  return entry;
}

