import { CAREERS } from '../data/careers.js';

const BASE_PAY=Object.freeze({army:92,knight:125,mage:148,adventurer:138,mercenary:154,special:206});
const BASE_RISK=Object.freeze({army:1,knight:1.05,mage:.95,adventurer:1.16,mercenary:1.25,special:1.4});
const RANK_MULT=[1,1.36,1.95,3.2];
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
/** All money is fictional silver pieces per game-year, not modern currency. */
export function riskMultiplier(person,careerId=person.occupation?.careerId) {
  let scale=BASE_RISK[careerId]??1;
  if(person.occupation?.careerId===careerId){
    if(person.occupation.medicalAssignment==='rear')scale*=.37;
    if(person.occupation.medicalAssignment==='front')scale*=1.24;
    if(['instructor','rehab'].includes(person.occupation.medicalAssignment))scale*=.04;
  }
  return scale;
}
export function riskLabel(multiplier) {
  return multiplier<.65?'低':multiplier<1?'やや低':multiplier<1.2?'中':multiplier<1.4?'高':'非常に高';
}
export function annualSalary(person,{careerId=person.occupation?.careerId,rankIndex=person.rankIndex,tenure=null,war=false}={}){
  if(!careerId||!CAREERS.some(c=>c.id===careerId))return 0;
  const careerTenure=tenure??Math.max(0,person.age-(person.occupation?.joinedAt??person.age));
  const seniority=1+Math.min(20,careerTenure)*.012;
  let multiplier=1;
  if(person.occupation?.careerId===careerId){
    if(person.occupation.medicalAssignment==='rear')multiplier=.78;
    if(person.occupation.medicalAssignment==='front')multiplier=1.12;
    if(person.occupation.medicalAssignment==='instructor')multiplier=.86;
    if(person.occupation.medicalAssignment==='rehab')multiplier=.62;
  }
  return Math.round(BASE_PAY[careerId]*(RANK_MULT[clamp(rankIndex??0,0,3)]||1)*seniority*multiplier*(war?1.14:1));
}
export function expectedTransfer(person,newCareer){
  const oldPay=annualSalary(person);
  const rankIndex=Math.max(0,Math.min(1,person.rankIndex-1));
  const newPay=annualSalary(person,{careerId:newCareer,rankIndex,tenure:0});
  return {oldPay,newPay,difference:newPay-oldPay,rankIndex,
    oldRisk:riskMultiplier(person),newRisk:riskMultiplier(person,newCareer)};
}
export function payYear(person,war=false){
  if(!person.occupation)return person;
  const p=structuredClone(person);
  // Old saves have no past salary ledger; never backfill fictitious earnings.
  p.finances??={lifetimeEarned:0,cash:0,payYears:0,lastPay:0};
  const salary=p.stage==='retired' ? Math.round(p.occupation.pensionBase??annualSalary(p)*.34) : annualSalary(p,{war});
  p.finances.lastPay=salary;
  p.finances.lifetimeEarned+=salary;
  p.finances.cash+=salary;
  p.finances.payYears+=1;
  return p;
}

