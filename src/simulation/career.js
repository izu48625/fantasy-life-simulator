import { CAREERS } from '../data/careers.js';
import { nextRandom, weightedPick } from '../core/rng.js';


const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
export function preferredCareer(p) {
  const a = p.attributes, inst = p.education?.institutionId;
  if (inst==='magic' || (a.MAG>a.STR+8 && a.MAG>26)) return 'mage';
  if (inst==='royal' && a.CMD>25) return p.ambition>85 && a.AGI>30?'special':'knight';
  if (inst==='apprentice') return 'knight';
  if (p.ambition>83 && a.AGI+a.DEX>65) return 'special';
  if (p.caution<38 && a.AGI+a.DEX>50) return 'adventurer';
  if (p.familyId==='poor' && p.ambition>=56) return 'mercenary';
  if (p.ambition>63 && a.AGI>=a.VIT-5) return 'adventurer';
  if (p.caution<48 || p.ambition>74) return 'mercenary';
  return 'army';
}
export function attemptCareer(person,rng,careerId) {
  const requested=CAREERS.find(c=>c.id===careerId)??CAREERS[1];
  const ability=requested.attr.reduce((sum,key)=>sum+person.attributes[key],0)/requested.attr.length;
  const school=person.education?.institutionId;
  const fit=requested.id==='mage'?(school==='magic' ? .13 : 0):
    requested.id==='knight'?((school==='royal'||school==='apprentice') ? .13 : 0):
    requested.id==='special'?(school==='royal' ? .06 : 0):0;
  const rate={knight:.49,army:.91,mage:.49,adventurer:.84,mercenary:.90,special:.095};
  const probability=clamp(rate[requested.id]+(ability-37)*.012+fit+
    (person.education?.honors ? .075 : 0)+(person.education?.scholarship ? .025 : 0)+
    (person.education?.ranking==='首席級' ? .045 : 0),.06,.97);
  const res=nextRandom(rng); rng=res.rng;
  const accepted=res.value<probability;
  let career=requested;
  if (!accepted) {
    const fallback=weightedPick(rng,[{value:CAREERS[1],weight:63},{value:CAREERS[4],weight:22},{value:CAREERS[3],weight:15}]);
    career=fallback.value;rng=fallback.rng;
  }
  const p=structuredClone(person);
  p.occupation={careerId:career.id,careerName:career.name,joinedAt:p.age,application:requested.id,accepted,
    admissionChance:Number(probability.toFixed(3)),transfers:0};
  p.stage='career';p.rankIndex=0;
  return {person:p,rng,log: accepted ? `${career.name}に採用された（選考見込${Math.round(probability*100)}%）。${career.ranks[0]}として任務を始めた。` :
    `${requested.name}への志願は不採用となった（選考見込${Math.round(probability*100)}%）。新たに${career.name}で道を歩み始めた。`};
}
export function maybePromote(person,rng){
 if(!person.occupation||person.rankIndex>=3)return{person,rng,log:null};
 const career=CAREERS.find(c=>c.id===person.occupation.careerId);
 const tenure=person.age-person.occupation.joinedAt;
 const thresholds=[0,5,21,75];
 const needed=thresholds[person.rankIndex+1];
 if(tenure<(person.rankIndex+1)*4||person.merit<needed||person.health<38||person.convalescentYears>0)return{person,rng,log:null};
 const rate=[0,.23,.064,.011][person.rankIndex+1]*(person.conviction==='honor'?1.08:1)*
   (person.education?.honors?1.13:1);
 const res=nextRandom(rng);rng=res.rng;
 if(res.value>=rate)return{person,rng,log:null};
 const p=structuredClone(person);p.rankIndex++;
 p.achievements.push(`${p.age}歳で${career.ranks[p.rankIndex]}に昇進`);
 return{person:p,rng,log:`戦功${p.merit}と勤務実績が認められ、空席を得て${career.ranks[p.rankIndex]}へ昇進した。`};
}

