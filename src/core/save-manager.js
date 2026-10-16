import { assertState, SAVE_VERSION } from './state.js';

const KEY = 'fls.current.v1';
const BACKUP = 'fls.backup.v1';
const ARCHIVE = 'fls.archive.v1';
const MAX_BYTES = 4_000_000;

export function checksum(raw) {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
export function serializeLife(state) {
  assertState(state);
  const raw = JSON.stringify(state);
  return JSON.stringify({ schemaVersion: SAVE_VERSION, checksum: checksum(raw), state });
}
export function deserializeLife(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('ファイルが大きすぎます');
  const envelope = JSON.parse(text);
  if (!envelope || envelope.schemaVersion !== SAVE_VERSION || !envelope.state) {
    throw new Error('未対応の保存形式です');
  }
  assertState(envelope.state);
  if (checksum(JSON.stringify(envelope.state)) !== envelope.checksum) {
    throw new Error('保存データの検証に失敗しました');
  }
  return envelope.state;
}
export function saveCurrent(state, storage = localStorage) {
  const packed = serializeLife(state);
  const old = storage.getItem(KEY);
  if (old) {
    try { deserializeLife(old); storage.setItem(BACKUP, old); } catch { /* preserve last known backup */ }
  }
  storage.setItem(KEY, packed);
  return true;
}
export function loadCurrent(storage = localStorage) {
  const raw = storage.getItem(KEY);
  if (raw) { try { return deserializeLife(raw); } catch { /* fallback */ } }
  const old = storage.getItem(BACKUP);
  if (old) return deserializeLife(old);
  return null;
}
export function archiveLife(state, storage = localStorage) {
  if (state.phase !== 'completed') return;
  const entries = listArchive(storage);
  const identifier = `${state.seed}/${state.person.deathAge}/${state.rng.draws}`;
  if (entries.some(e => e.identifier === identifier)) return;
  const record = { identifier, name: state.person.name, race: state.person.raceName,
    age: state.person.deathAge, career: state.person.occupation?.careerName || '無所属',
    battles: state.person.battles, wins: state.person.wins,
    endReason: state.endReason, snapshot: serializeLife(state) };
  entries.unshift(record);
  // Never silently discard history; warn before reaching storage limit.
  if (entries.length > 50) throw new Error('アーカイブの上限50件です。JSONに書き出して整理してください。');
  storage.setItem(ARCHIVE, JSON.stringify(entries));
}
export function listArchive(storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(ARCHIVE) || '[]');
    return Array.isArray(value) ? value.filter(e => e && typeof e.identifier === 'string' && typeof e.snapshot === 'string') : [];
  } catch { return []; }
}
export function exportJson(state) { return serializeLife(state); }
export function importJson(text) { return deserializeLife(text); }

