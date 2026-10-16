import { combatRating } from '../simulation/battle.js';
import { CAREERS } from '../data/careers.js';


const round = value => Number.isFinite(value) ? Math.round(value) : 0;
export function readLifeMetrics(state) {
  const p = state.person;
  if (!p) return null;
  const snapshots = Array.isArray(state.annualRecords) ? state.annualRecords : [];
  const combats = state.timeline.filter(e => e.kind === 'battle' && e.detail && typeof e.detail.win === 'boolean');
  let run = 0, bestRun = 0;
  for (const e of combats) {
    run = e.detail.win ? run + 1 : 0;
    bestRun = Math.max(bestRun, run);
  }
  const toughestVictory = combats.filter(e => e.detail.win && Number.isFinite(e.detail.winChance))
    .sort((a, b) => a.detail.winChance - b.detail.winChance)[0] ?? null;
  const current = combatRating(p);
  const peak = snapshots.length ? snapshots.reduce((acc, v) => v.ovr > acc.ovr ? v : acc, snapshots[0]) : null;
  const starting = snapshots[0] ?? null;
  const career = CAREERS.find(c => c.id === p.occupation?.careerId);
  const contactList = p.contacts ?? [];
  const uniqueMissions = new Set(combats.map(e => e.detail.mission).filter(Boolean));
  const marks = p.education?.grades ?? [];
  const losses = Math.max(0, p.battles - p.wins);
  return {
    ovr: current, peakOvr: peak?.ovr ?? null, peakAge: peak?.age ?? null,
    ovrGrowth: starting ? current - starting.ovr : null,
    battles: p.battles, wins: p.wins, losses, winRate: p.battles ? round(p.wins / p.battles * 100) : null,
    bestStreak: bestRun, currentStreak: run,
    warBattles: combats.filter(e => e.detail.war).length,
    warVictories: combats.filter(e => e.detail.war && e.detail.win).length,
    majorEvents: state.timeline.filter(e => e.importance === 'major').length,
    careerYears: p.occupation ? Math.max(0, p.age - (p.occupation.history?.[0]?.startedAt ?? state.timeline.find(e=>e.kind==='career')?.age ?? p.occupation.joinedAt)) : 0,
    income:p.finances?.lastPay??null, lifetimeIncome:p.finances?.lifetimeEarned??null,
    cash:p.finances?.cash??null, dangerousDuty:p.occupation?.medicalAssignment??null,
    injuryChoiceCount:p.injuryChoices?.length??0,
    comebacks:p.comebacks??0, returnAttempts:p.recoveryJourney?.attemptCount??0,
    mentoringYears:p.mentoring?.years??0, studentsTaught:p.mentoring?.students??0,
    recoveryOutcome:p.recoveryJourney?.outcome??null,
    merit: p.merit, fame: p.fame, rank: career?.ranks[p.rankIndex] ?? '所属なし',
    rankIndex: p.rankIndex, promotionCount: state.timeline.filter(e => e.kind === 'promotion').length,
    transferCount: state.timeline.filter(e => e.kind === 'transfer').length,
    assignmentCount: state.timeline.filter(e => e.kind === 'assignment').length,
    careerHistory: p.occupation?.history??[],
    seriousInjuries: p.injuries.filter(i => i.kind !== '軽傷').length,
    injuryCount: p.injuries.length,
    livingContacts: contactList.filter(c => c.alive).length,
    lostContacts: contactList.filter(c => !c.alive).length,
    missionVariety: uniqueMissions.size,
    toughestVictory, educationHigh: marks.length ? Math.max(...marks.map(m => m.mark)) : null,
    educationAverage: marks.length ? round(marks.reduce((sum, m) => sum + m.mark, 0) / marks.length) : null,
    snapshots
  };
}

export function formatSigned(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${Math.round(value)}`;
}

/** Year-to-year changes are based only on stored snapshots; old saves show no invented growth. */
export function yearDelta(records, age) {
  if (!Array.isArray(records)) return null;
  const idx = records.findIndex(r => r.age === age);
  if (idx <= 0) return null;
  const now = records[idx], before = records[idx - 1];
  return { ovr: now.ovr - before.ovr, merit: now.merit - before.merit,
    fame: now.fame - before.fame, battles: now.battles - before.battles,
    wins: now.wins - before.wins };
}

