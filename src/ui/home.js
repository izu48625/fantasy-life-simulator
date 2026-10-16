export function showScreen(hasLife) {
  document.getElementById('welcome').hidden = hasLife;
  document.getElementById('game').hidden = !hasLife;
  document.getElementById('controls').hidden = !hasLife;
}

