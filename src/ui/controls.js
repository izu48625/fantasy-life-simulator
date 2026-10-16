export const $ = id => document.getElementById(id);
export function renderControls(state, playing) {
  $('toggle-play').textContent = playing ? '一時停止' : '再生';
  $('toggle-play').disabled = state.phase === 'completed' || (state.phase === 'awaiting_choice' && state.mode !== 'FULL_AUTO');
  $('one-year').disabled = state.phase !== 'running';
  $('next-event').disabled = state.phase !== 'running';
  $('next-choice').disabled = state.phase !== 'running' || state.mode === 'FULL_AUTO';
  $('mode-select').value = state.mode;
  $('speed-select').value = String(state.speed);
  $('running-status').textContent = state.phase === 'awaiting_choice' ? '選択待ち' :
    state.phase === 'completed' ? '人生終了' : playing ? '自動進行中' : '一時停止';
}

