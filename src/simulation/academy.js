import { nextRandom } from '../core/rng.js';
import { INSTITUTIONS } from '../data/institutions.js';


const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const mix = (p, keys) => keys.reduce((s, [k, w]) => s + (p.attributes[k] || 0) * w, 0);
export function chooseAcademy(person) {
  if (person.attributes.MAG > person.attributes.STR + 6) return 'magic';
  if (person.attributes.INT + person.attributes.CMD > 65) return 'royal';
  return person.familyAccess >= 1.2 ? 'apprentice' : 'cadet';
}
export function attemptAdmission(person, rng, preferredId) {
  const requested = INSTITUTIONS.find(a => a.id === preferredId) ?? INSTITUTIONS[2];
  const p = structuredClone(person);
  const academic = requested.id === 'magic' ? mix(p,[['MAG',.48],['INT',.35],['DEX',.17]]) :
    requested.id === 'royal' ? mix(p,[['INT',.35],['CMD',.36],['DEX',.29]]) :
    requested.id === 'apprentice' ? mix(p,[['STR',.37],['DEX',.37],['VIT',.26]]) :
    mix(p,[['VIT',.4],['STR',.34],['CMD',.26]]);
  const gifted = ['S','A'].includes(p.potential);
  const eligibleAid = ['poor','common'].includes(p.familyId) && (gifted || p.scholarshipLead);
  const aid = eligibleAid && (academic >= 19 || p.storyFlags?.mentor);
  const rate = requested.id === 'royal' ? .14 : requested.id === 'magic' ? .23 :
    requested.id === 'apprentice' ? .60 : .91;
  const accessPenalty = p.familyAccess < 1 ? (aid ? -.02 : (p.familyAccess-1)*.4) : (p.familyAccess-1)*.20;
  const probability = clamp(rate + (academic-26)*.017 + accessPenalty +
    (p.storyFlags?.mentor ? .055 : 0) + (p.storyFlags?.aptitude ? .045 : 0) +
    (p.recommendation ? .035 : 0) + (aid ? .10 : 0), .045, .97);
  const roll = nextRandom(rng); rng = roll.rng;
  const admitted = roll.value < probability;
  const chosen = admitted ? requested : INSTITUTIONS[2];
  p.stage = 'academy';
  p.education = { institutionId:chosen.id, institutionName:chosen.name, requestedId:requested.id,
    admitted, admissionProbability:Number(probability.toFixed(3)), examScore:Math.round(academic),
    scholarship:!!(admitted && aid), graduationAge:p.age + chosen.years,
    startedAt:p.age, grades:[], performance:0, graduated:false, honors:false };
  const why = p.education.scholarship ? '奨学生として学費の支援を受けた。' :
    !admitted ? '一般枠の軍少年隊で再出発する。' : '';
  return { person:p, rng, log: admitted ? `${chosen.name}の選抜に合格した（試験評価${Math.round(academic)}、合格見込${Math.round(probability*100)}%）。${why}` :
    `${requested.name}の選抜に届かなかった（試験評価${Math.round(academic)}）。${why}` };
}
/** Academies build a continuous assessment record, even when no story event fires. */
export function evaluateAcademyYear(person, rng) {
  const p = structuredClone(person);
  if (!p.education || p.stage !== 'academy' || p.education.graduated) return {person:p,rng,log:null};
  p.education.grades ??= [];
  const inst = p.education.institutionId;
  const aptitude = inst === 'magic' ? p.attributes.MAG*.55+p.attributes.INT*.45 :
    inst === 'royal' ? p.attributes.CMD*.55+p.attributes.INT*.45 :
    inst === 'apprentice' ? p.attributes.DEX*.55+p.attributes.STR*.45 :
    p.attributes.VIT*.55+p.attributes.STR*.45;
  const luck = nextRandom(rng); rng=luck.rng;
  const yearMark = Math.round(clamp(38 + aptitude*.67 + (p.teamwork || 0)*.8 + (luck.value-.5)*25, 20, 99));
  p.education.grades.push({age:p.age,mark:yearMark});
  p.education.performance = Math.max(0,(p.education.performance||0)+
    (yearMark>=70?3:yearMark>=55?2:yearMark>=42?1:0));
  let log = null;
  if (yearMark >= 72) log = `${p.education.institutionName}の${p.education.grades.length}年次評価は${yearMark}点。優秀な成績を収めた。`;
  if (yearMark < 40) log = `${p.education.institutionName}の${p.education.grades.length}年次評価は${yearMark}点。苦手分野の補習を受けることになった。`;
  return {person:p,rng,log};
}
export function graduate(person) {
  if (!person.education || person.education.graduated) return person;
  const p = structuredClone(person);
  const marks = p.education.grades ?? [];
  const average = marks.length ? marks.reduce((a,b)=>a+b.mark,0)/marks.length : 50;
  const score = average + (p.education.performance || 0)*.85;
  const ranking = score>=90 ? '首席級' : score>=78 ? '上位卒業' : score>=65 ? '中位卒業' : '一般卒業';
  p.education = {...p.education, graduated:true, honors:score>=78, graduationScore:Math.round(score), ranking};
  p.stage='awaiting_career';
  if (score>=90) p.achievements.push(`${p.education.institutionName}を首席級の成績で卒業`);
  return p;
}

