/** Pure seeded PRNG. Render and wall-clock code MUST NEVER consume this stream. */
export function seedToUint32(seed) {
  const text = String(seed);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initRng(seed) {
  return { seed: String(seed), state: seedToUint32(seed), draws: 0 };
}

export function nextRandom(rng) {
  // mulberry32 with explicit, serializable state
  const state = (rng.state + 0x6D2B79F5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, rng: { ...rng, state, draws: rng.draws + 1 } };
}

export function randomInt(rng, min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new Error('Invalid random range');
  const result = nextRandom(rng);
  return { value: min + Math.floor(result.value * (max - min + 1)), rng: result.rng };
}

export function weightedPick(rng, choices) {
  const total = choices.reduce((sum, c) => sum + c.weight, 0);
  if (!(total > 0) || choices.some(c => c.weight < 0 || !Number.isFinite(c.weight))) {
    throw new Error('Invalid weighted choices');
  }
  const result = nextRandom(rng);
  let target = result.value * total;
  for (const choice of choices) {
    target -= choice.weight;
    if (target < 0) return { value: choice.value, rng: result.rng };
  }
  return { value: choices[choices.length - 1].value, rng: result.rng };
}

