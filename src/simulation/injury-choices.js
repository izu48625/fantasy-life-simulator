import { annualSalary } from './economy.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const INJURY_PATHS=Object.freeze([
 {id:'rehab',label:'治療と再訓練を優先',note:'治療費18銀貨・前線復帰まで時間がかかる／健康の回復を優先'},
 {id:'rear',label:'後方支援・教導職へ転属',note:'年収は約22%減少／戦闘危険度が大きく減少・指揮能力を磨く'},
 {id:'front',label:'早期に前線へ復帰',note:'危険手当で基本年収約12%増／負傷・戦死リスクも約24%増'},
 {id:'retire',label:'戦闘職を退き引退する',note:'戦闘任務を終了／年金収入は現年収の約34%に減少'}
]);
export function resolveInjuryPath(person,path){
 if(!person.injuryDecisionPending||person.stage!=='career')throw new Error('負傷後の進路を選択できません');
 if(!INJURY_PATHS.some(x=>x.id===path))throw new Error('不正な進路選択です');
 const p=structuredClone(person);const oldPay=annualSalary(p);
 const reason=p.injuryDecisionPending.kind;
 p.injuryDecisionPending=null;p.recoveryPath=path;
 p.recoveryJourney={startedAt:p.age,kind:reason,path,reviewAt:p.age+2,offerAt:p.age+3,offerResolved:false,attemptCount:0,outcome:null};
 p.injuryChoices??=[];
 p.injuryChoices.push({age:p.age,choice:path,kind:reason});
 let log;
 if(path==='rehab'){
  p.health=clamp(p.health+18,0,100);
  p.convalescentYears=Math.max(2,p.convalescentYears||0);
  p.finances??={lifetimeEarned:0,cash:0,payYears:0,lastPay:0};
  p.finances.cash-=18;
  p.occupation.medicalAssignment='rehab';
  log=`${reason}の治療と再訓練を選択。治療費18銀貨を支払い健康が回復。療養を終えてから前線復帰する。`;
 }else if(path==='rear'){
  p.occupation.medicalAssignment='rear';p.occupation.assignmentName='後方支援・新人教導';
  p.occupation.assignmentId='medical_rear';
  p.convalescentYears=Math.min(1,p.convalescentYears||0);
  p.attributes.CMD=clamp(p.attributes.CMD+2,0,100);
  log=`${reason}を機に後方支援・教導に転属。年収${oldPay}→${annualSalary(p)}銀貨。戦闘危険度が大幅に低下する。`;
 }else if(path==='front'){
  p.convalescentYears=0;
  p.health=clamp(p.health+5,0,100);
  p.occupation.medicalAssignment='front';
  log=`${reason}を抱えながら早期前線復帰を選択。危険手当により年収${oldPay}→${annualSalary(p)}銀貨。ただし負傷・戦死リスクは上昇する。`;
 }else{
  p.occupation.pensionBase=Math.round(oldPay*.34);
  p.stage='retired';p.retired=true;
  p.occupation.history?.at(-1)&&(p.occupation.history.at(-1).endedAt=p.age);
  log=`${reason}を機に戦闘職を退いた。戦闘任務から離れ、年金${p.occupation.pensionBase}銀貨/年で第二の人生を送る。`;
 }
 return{person:p,kind:path==='retire'?'retirement':'recovery',log};
}

