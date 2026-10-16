/** R0: minimal deterministic event catalog; expanded to 30-50 in R1-R3. */
export const EVENT_CATALOG = Object.freeze([
  { id: 'birth', stage: 'childhood', importance: 'major' },
  { id: 'training', stage: 'childhood', importance: 'minor' },
  { id: 'admission', stage: 'academy', importance: 'major' },
  { id: 'graduation', stage: 'academy', importance: 'major' },
  { id: 'career', stage: 'career', importance: 'major' },
  { id: 'battle', stage: 'career', importance: 'major' },
  { id: 'promotion', stage: 'career', importance: 'major' },
  { id: 'transfer', stage: 'career', importance: 'major' },
  { id: 'review', stage: 'career', importance: 'minor' },
  { id: 'recovery', stage: 'career', importance: 'major' },
  { id: 'assignment', stage: 'career', importance: 'major' },
  { id: 'retirement', stage: 'retired', importance: 'major' },
  { id: 'death', stage: 'deceased', importance: 'major' },
  { id: 'story', stage: 'any', importance: 'major' }
]);

