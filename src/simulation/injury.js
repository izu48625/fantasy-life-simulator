export function recover(person) {
  const p = structuredClone(person);
  if (p.convalescentYears > 0) {
    p.convalescentYears--;
    p.health = Math.min(100, p.health + 13);
  } else if (p.health < 100) {
    p.health = Math.min(100, p.health + (p.stage === 'retired' ? 9 : 17));
  }
  return p;
}

