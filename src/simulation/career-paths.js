import { CAREERS } from '../data/careers.js';
import { nextRandom } from '../core/rng.js';


const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const careerOf=id=>CAREERS.find(c=>c.id===id);
const rating=(p,c)=>c.attr.reduce((sum,key)=>sum+p.attributes[key],0)/c.attr.length;

/** Career opportunities are based on aptitude and current service, not a dice roll in the UI. */
export function transferOptions(person) {
  if(!person.occupation)return [];
  const pool=CAREERS.filter(c=>c.id!==person.occupation.careerId)
    .filter(c=>c.id!=='special'||(person.merit>=22 && person.battles>=9))
    .filter(c=>c.id!=='mage'||person.attributes.MAG>=22)
    .map(c=>({career:c,score:rating(person,c)+
      (c.id==='army'?5:c.id==='adventurer'?3:0)+(person.education?.honors?2:0)}))
    .sort((a,b)=>b.score-a.score||a.career.id.localeCompare(b.career.id));
  return pool.slice(0,3).map(({career:c})=>({id:c.id,label:`${c.name}へ転職を志願`}));
}

export function eligibleForTransfer(person,targetAge) {
  if(person.stage!=='career'||!person.occupation||person.convalescentYears>0||person.health<48)return false;
  const o=person.occupation;
  const lastMove=o.lastTransferAt??o.joinedAt;
  return targetAge%8===0 && targetAge-lastMove>=6 && (o.transfers??0)<3;
}

/** Rejection does not change the job or erase prior career history. */
export function attemptTransfer(person,rng,choice) {
  const p=structuredClone(person),o=p.occupation;
  if(!o)throw new Error('転職できる所属がありません');
  if(choice==='stay')return{person:p,rng,kind:'assignment',importance:'minor',log:`${o.careerName}での続投を選んだ。現階級の実績を積み重ねる。`};
  const candidates=transferOptions(p);
  if(!candidates.some(x=>x.id===choice))throw new Error('無効な転職希望です');
  const target=careerOf(choice),skill=rating(p,target);
  const extra=target.id==='special'?-.26:target.id==='mage'?-.05:target.id==='knight'?-.08:0;
  const chance=clamp(.43+(skill-38)*.009+(p.merit||0)*.0016+
    (p.education?.honors ? .08 : 0)+extra-(p.rankIndex>=2?.10:0),.07,.90);
  const roll=nextRandom(rng);rng=roll.rng;
  if(roll.value>=chance)return{person:p,rng,kind:'review',importance:'major',
    log:`${target.name}への転職試験に落選した（合格見込${Math.round(chance*100)}%）。${o.careerName}での勤務を続ける。`};
  const prev=careerOf(o.careerId);
  const oldName=prev?.ranks[p.rankIndex]??'隊員';
  o.history??=[{careerId:o.careerId,careerName:o.careerName,startedAt:o.joinedAt,endedAt:null,rankIndex:p.rankIndex}];
  if(o.history.length) {o.history.at(-1).endedAt=p.age;o.history.at(-1).rankIndex=p.rankIndex;}
  o.transfers=(o.transfers??0)+1;
  o.lastTransferAt=p.age;o.careerId=target.id;o.careerName=target.name;o.joinedAt=p.age;
  // Experienced veterans may retain some seniority; a new profession is never an instant promotion.
  p.rankIndex=Math.max(0,Math.min(1,p.rankIndex-1));
  o.history.push({careerId:target.id,careerName:target.name,startedAt:p.age,endedAt:null,rankIndex:p.rankIndex});
  p.achievements??=[];p.achievements.push(`${p.age}歳に${prev.name}から${target.name}へ転職`);
  return{person:p,rng,kind:'transfer',importance:'major',
    log:`${prev.name}の${oldName}から${target.name}へ転職が決定（合格見込${Math.round(chance*100)}%）。新たに${target.ranks[p.rankIndex]}として任務を始めた。`};
}

const ASSIGNMENTS=[
 {id:'scout',label:'偵察班',can:p=>p.attributes.AGI>=22,effect:{AGI:1,merit:1}},
 {id:'instructor',label:'新人教導班',can:p=>p.battles>=10,effect:{CMD:2,fame:1}},
 {id:'guard',label:'要人警護隊',can:p=>p.rankIndex>=1,effect:{DEX:1,merit:2}},
 {id:'tactics',label:'作戦補佐',can:p=>p.attributes.INT>=26,effect:{INT:1,CMD:1}},
 {id:'supply',label:'補給・後方支援',can:p=>p.health<80,effect:{health:5,merit:1}},
 {id:'patrol',label:'地域警備班',can:()=>true,effect:{VIT:1,fame:1}}
];

/** Rare and stateful assignment changes (not independent narration). */
export function maybeReassign(person,rng){
  const o=person.occupation;
  if(!o||person.convalescentYears||person.health<38||person.age-o.joinedAt<3||person.age%5!==0)return{person,rng,log:null};
  let roll=nextRandom(rng);rng=roll.rng;
  if(roll.value>.62)return{person,rng,log:null};
  const eligible=ASSIGNMENTS.filter(x=>x.can(person)&&x.id!==o.assignmentId);
  if(!eligible.length)return{person,rng,log:null};
  roll=nextRandom(rng);rng=roll.rng;
  const a=eligible[Math.floor(roll.value*eligible.length)];
  const p=structuredClone(person);
  p.occupation.assignmentId=a.id;p.occupation.assignmentName=a.label;
  p.occupation.assignmentChanges=(p.occupation.assignmentChanges||0)+1;
  for(const [key,value] of Object.entries(a.effect)){
    if(key==='health')p.health=clamp(p.health+value,0,100);
    else if(key in p.attributes)p.attributes[key]=clamp(p.attributes[key]+value,0,100);
    else p[key]=(p[key]||0)+value;
  }
  return{person:p,rng,log:`${p.occupation.careerName}の${a.label}へ転属。新しい任務を担当し、経験を積んだ。`};
}

