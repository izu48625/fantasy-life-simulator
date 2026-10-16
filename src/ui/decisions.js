export function renderDecision(state, choose) {
  const panel = document.getElementById('decision-panel');
  panel.replaceChildren();
  if (state.phase !== 'awaiting_choice') { panel.hidden = true; return; }
  const decision = state.pendingDecision;
  panel.hidden = false;
  const title = document.createElement('h3'); title.textContent = decision.title;
  const note = document.createElement('p'); note.className = 'muted';
  note.textContent = `${decision.age}歳の選択。決定するまで時は進みません。`;
  const options = document.createElement('div'); options.className = 'decision-options';
  for (const option of decision.options) {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'choice-button'; button.textContent = option.label;
    button.addEventListener('click', () => choose(decision.id, option.id), { once: true });
    options.append(button);
  }
  panel.append(title, note, options);
}

