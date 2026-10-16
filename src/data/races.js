export const RACES = Object.freeze([
  { id: 'human', name: '人間', weight: 55, adultAge: 18, retireAge: 67, maxAge: 100,
    modifiers: { STR: 0, VIT: 0, AGI: 0, INT: 0, MAG: 0, DEX: 0, CMD: 0 } },
  { id: 'beastkin', name: '獣人', weight: 22, adultAge: 18, retireAge: 61, maxAge: 92,
    modifiers: { STR: 5, VIT: 3, AGI: 5, INT: -2, MAG: -2, DEX: 1, CMD: 0 } },
  { id: 'elf', name: 'エルフ', weight: 13, adultAge: 22, retireAge: 115, maxAge: 165,
    modifiers: { STR: -3, VIT: -2, AGI: 3, INT: 5, MAG: 7, DEX: 4, CMD: 1 } },
  { id: 'dwarf', name: 'ドワーフ', weight: 10, adultAge: 20, retireAge: 91, maxAge: 145,
    modifiers: { STR: 5, VIT: 8, AGI: -5, INT: 1, MAG: 0, DEX: 3, CMD: 1 } }
]);
export const STATS = Object.freeze(['STR', 'VIT', 'AGI', 'INT', 'MAG', 'DEX', 'CMD']);
export const GROWTH_TYPES = Object.freeze(['早熟', '普通', '晩成', '超晩成']);

