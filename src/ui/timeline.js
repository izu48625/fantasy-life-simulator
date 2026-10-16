const $ = id => document.getElementById(id);
export function renderTimeline(state) {
  const view = $('timeline');
  // Do not destroy/recreate DOM when no new event has appeared.
  if (view.dataset.lifeSeed !== state.seed || Number(view.dataset.lastId || '0') > (state.timeline.at(-1)?.id || 0)) {
    view.replaceChildren(); view.dataset.lastId = '0'; view.dataset.lifeSeed = state.seed;
  }
  const oldLastId = Number(view.dataset.lastId || '0');
  const stick = view.scrollHeight - view.scrollTop - view.clientHeight < 90;
  const fragment = document.createDocumentFragment();
  for (const entry of state.timeline) {
    if (entry.id <= oldLastId) continue;
    const article = document.createElement('article');
    article.className = `event ${entry.importance === 'major' ? 'event-major' : ''}`;
    const at = document.createElement('div'); at.className = 'event-age';
    at.textContent = `${entry.age}歳 · 王暦${entry.year}年`;
    const content = document.createElement('p'); content.textContent = entry.text;
    article.append(at, content);
    fragment.append(article);
  }
  view.append(fragment);
  view.dataset.lastId = String(state.timeline.at(-1)?.id || 0);
  if (stick) view.scrollTop = view.scrollHeight;
}

