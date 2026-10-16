import { startLife, stepLife, resolveChoice, configureLife } from './core/lifecycle.js';
import { saveCurrent, loadCurrent, archiveLife, listArchive, exportJson, importJson } from './core/save-manager.js';
import { renderProfile } from './ui/profile.js';
import { renderTimeline } from './ui/timeline.js';
import { renderDecision } from './ui/decisions.js';
import { renderControls, $ } from './ui/controls.js';
import { renderSummary } from './ui/summary.js';
import { showScreen } from './ui/home.js';








let state = null;
let playing = false;
let timer = null;
let archived = false;
// Some embedded document viewers disable localStorage. Keep the game playable,
// but clearly disclose that such saves will not survive closing the viewer.
const transientEntries = new Map();
const transientStorage = {
  getItem: key => transientEntries.has(key) ? transientEntries.get(key) : null,
  setItem: (key, value) => { transientEntries.set(key, String(value)); },
  removeItem: key => { transientEntries.delete(key); }
};
let storage = transientStorage;
let persistentStorage = false;
try {
  const probe = 'fls.storage.probe';
  localStorage.setItem(probe, '1');
  localStorage.removeItem(probe);
  storage = localStorage;
  persistentStorage = true;
} catch { /* Session-only fallback. */ }
$('storage-warning').hidden = persistentStorage;
const flash = message => {
  const div = $('toast'); div.textContent = message; div.hidden = false;
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => { div.hidden = true; }, 3000);
};
const pause = () => { playing = false; clearTimeout(timer); timer = null; if (state) renderControls(state, playing); };
const render = () => {
  showScreen(!!state);
  if (!state) return;
  renderProfile(state);
  renderTimeline(state);
  renderDecision(state, pickChoice);
  renderSummary(state);
  renderControls(state, playing);
};
const persist = () => {
  try {
    saveCurrent(state, storage);
    if (state.phase === 'completed' && !archived) { archiveLife(state, storage); archived = true; }
    return true;
  } catch (e) { flash(`保存できませんでした：${e.message}`); return false; }
};
function processStep() {
  if (!state) return;
  state = stepLife(state);
  if (state.phase !== 'running') pause();
  persist(); render();
}
function pickChoice(id, option) {
  if (!state || state.phase !== 'awaiting_choice') return;
  try {
    state = resolveChoice(state, id, option);
    persist(); render();
  } catch (e) { flash(e.message); }
}
function tick() {
  if (!playing || !state) return;
  processStep();
  if (playing) timer = setTimeout(tick, Math.max(50, 850 / state.speed));
}
function play() {
  if (!state) return;
  if (playing) { pause(); return; }
  if (state.phase === 'completed') return;
  if (state.phase === 'awaiting_choice' && state.mode !== 'FULL_AUTO') return;
  playing = true; renderControls(state, playing); timer = setTimeout(tick, 0);
}
function jumpTo(target) {
  if (!state || state.phase !== 'running') return;
  pause();
  const oldCount = state.timeline.length;
  // bounded loop prevents UI hangs even if a corrupted state never triggers a choice
  for (let i = 0; i < 240 && state.phase === 'running'; i++) {
    state = stepLife(state);
    if (target === 'event' && state.timeline.length > oldCount) break;
    if (target === 'choice' && state.phase === 'awaiting_choice') break;
  }
  persist(); render();
}
function newLife() {
  pause();
  const specified = $('seed-input').value.trim();
  const seed = specified || `life-${Date.now().toString(36)}`;
  try {
    state = startLife(seed, { mode: $('initial-mode').value });
    archived = false; const saved = persist(); $('resume-button').disabled = !saved; $('archive-panel').hidden = true; render(); flash(persistentStorage ? '新しい人生が始まりました' : '試用モード：保存はこの画面内のみ。JSON書き出しをおすすめします');
  } catch (e) { flash(e.message); }
}
function resumeLife() {
  try {
    state = loadCurrent(storage);
    if (!state) return flash('保存された人生がありません');
    archived = state.phase === 'completed';
    pause(); render();
  } catch (e) { flash(`読み込み失敗：${e.message}`); }
}
function downloadJson() {
  if (!state) return;
  const blob = new Blob([exportJson(state)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `fantasy-life-${state.seed.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,36)}.json`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showArchive() {
  const panel = $('archive-panel'); panel.hidden = false;
  const list = $('archive-list'); list.replaceChildren();
  const entries = listArchive(storage);
  if (!entries.length) { list.textContent = 'まだ保存された人生はありません。'; return; }
  for (const entry of entries) {
    const row = document.createElement('div'); row.className = 'archive-entry';
    const info = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = entry.name;
    const meta = document.createElement('p'); meta.textContent = `${entry.race}｜享年${entry.age}｜${entry.career}｜${entry.battles}戦`;
    info.append(name, meta);
    const button = document.createElement('button'); button.textContent = '閲覧する'; button.type = 'button';
    button.addEventListener('click', () => {
      try { state = importJson(entry.snapshot); archived = true; pause(); render(); panel.hidden = true; }
      catch (e) { flash(`アーカイブ読み込み失敗：${e.message}`); }
    });
    row.append(info, button); list.append(row);
  }
}
$('start-button').addEventListener('click', newLife);
$('resume-button').addEventListener('click', resumeLife);
$('archive-button').addEventListener('click', showArchive);
$('close-archive').addEventListener('click', () => { $('archive-panel').hidden = true; });
$('toggle-play').addEventListener('click', play);
$('one-year').addEventListener('click', () => { pause(); processStep(); });
$('next-event').addEventListener('click', () => jumpTo('event'));
$('next-choice').addEventListener('click', () => jumpTo('choice'));
$('mode-select').addEventListener('change', event => { if (!state) return; pause(); state = configureLife(state, { mode: event.target.value }); persist(); render(); });
$('speed-select').addEventListener('change', event => { if (!state) return; const wasPlaying = playing; pause(); state = configureLife(state, { speed: Number(event.target.value) }); persist(); render(); if (wasPlaying) play(); });
$('save-button').addEventListener('click', () => { if (state && persist()) flash(persistentStorage ? 'ブラウザに保存しました' : '一時的に保存しました。JSON書き出しをおすすめします'); });
$('export-button').addEventListener('click', downloadJson);
$('home-button').addEventListener('click', () => { pause(); state = null; showScreen(false); });
$('import-file').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  if (file.size > 4_000_000) { flash('4 MBより大きなファイルは読み込めません'); return; }
  try { const imported = importJson(await file.text()); pause(); state = imported; archived = state.phase === 'completed'; persist(); $('resume-button').disabled = false; render(); flash('読み込みました'); }
  catch (e) { flash(`読み込み失敗：${e.message}`); }
  finally { event.target.value = ''; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', () => { pause(); if (state) persist(); });
try { $('resume-button').disabled = !loadCurrent(storage); } catch { $('resume-button').disabled = true; }

