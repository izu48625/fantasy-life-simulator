import { nextRandom } from '../core/rng.js';
import { annualSalary } from './economy.js';


const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

/** Wounds have an aftermath. These are genuine choices evaluated before the next year advances. */
export function recoveryDecision(person,targetAge) {
  const j=person.recoveryJourney;
  if(!j||person.injuryDecisionPending)return null;
  if(person.stage==='career'&&j.path==='rehab'&&j.reviewAt<=targetAge&&!person.convalescentYears){
    return {type:'return_exam',title:'治療後の復帰審査──元の戦場に戻れるか',options:[
      {id:'exam',label:'前線復帰試験を受ける',note:`現在の健康 ${Math.round(person.health)}/100。体調・体力・後遺症により合否が変わる。合格すれば通常給与へ`},
      {id:'instructor',label:'後方の教官・訓練係を希望',note:`年収 ${Math.round(annualSalary(person,{rankIndex:person.rankIndex})/.62*.86)}銀貨程度へ。前線には出ず教え子を育成`},
      {id:'continue',label:'もう2年の療養・再訓練',note:'治療費12銀貨、復帰が遅れる代わりに健康回復を優先'}
    ]};
  }
  if(person.stage==='career'&&j.path==='rear'&&j.offerAt<=targetAge&&!j.offerResolved&&person.battles>=8){
    return {type:'mentor_offer',title:'後方勤務で教官の道を選ぶか',options:[
      {id:'teach',label:'正式な教官となり後進を育てる',note:'直接戦闘なし・給与は元階級の約86%。教え子と指導実績が増える'},
      {id:'support',label:'後方支援のまま任務を続ける',note:'年収は現状維持。低頻度で護衛や警備の任務が残る'}
    ]};
  }
  if(person.stage==='retired'&&j.path==='retire'&&j.offerAt<=targetAge&&!j.offerResolved&&person.battles>=5){
    return {type:'retirement_offer',title:'引退後の第二の人生',options:[
      {id:'teach',label:'地域の訓練場で若者を指導する',note:'戦闘には復帰せず、経験を次の世代へ伝える'},
      {id:'quiet',label:'戦場を離れて穏やかに暮らす',note:'年金を受け取り、体を労わる'}
    ]};
  }
  return null;
}

/** Returns a person's new condition and any factual milestone records. */
export function resolveRecoveryDecision(person,rng,type,selected){
  const valid=recoveryDecision(person,person.age);
  if(!valid||valid.type!==type||!valid.options.some(o=>o.id===selected))throw new Error('復帰・転身の選択は無効です');
  const p=structuredClone(person),j=p.recoveryJourney,events=[];
  const emit=(kind,text)=>events.push({kind,text});
  if(type==='return_exam') {
    if(selected==='continue') {
      j.reviewAt=p.age+2;p.convalescentYears=Math.max(1,p.convalescentYears||0);
      p.health=clamp(p.health+16,0,100);
      p.finances??={lifetimeEarned:0,cash:0,payYears:0,lastPay:0};p.finances.cash-=12;
      emit('recovery','復帰を急がず2年間の再訓練を選んだ。治療費12銀貨を支払い、健康を整える。');
    } else if(selected==='instructor'){
      const oldPay=annualSalary(p);p.occupation.medicalAssignment='instructor';
      p.occupation.assignmentName='傷痍教官';p.occupation.assignmentId='medical_instructor';
      j.path='instructor';j.outcome='指導職へ転身';j.offerResolved=true;
      p.mentoring??={years:0,students:0};
      emit('career',`前線復帰を断念し、傷痍教官への転身が認められた。年収 ${oldPay}→${annualSalary(p)}銀貨。生き延びた経験を次の世代へ伝える。`);
    }else{
      const quality=p.health*.64+(p.attributes.VIT||0)*.19+(p.attributes.AGI||0)*.17-
        (j.kind==='後遺症'?13:j.kind==='重傷'?7:0);
      const probability=clamp(.12+quality/110,.12,.91);
      const roll=nextRandom(rng);rng=roll.rng;
      j.attemptCount=(j.attemptCount||0)+1;
      if(roll.value<probability){
        const oldPay=annualSalary(p);p.occupation.medicalAssignment=null;
        j.path='returned';j.outcome='前線へ復帰';j.returnedAt=p.age;
        p.comebacks=(p.comebacks||0)+1;
        p.achievements??=[];p.achievements.push(`${p.age}歳で${j.kind}を乗り越え前線に復帰`);
        emit('recovery',`${j.kind}からの復帰試験に合格（合格見込${Math.round(probability*100)}%）。前線復帰を果たした。年収 ${oldPay}→${annualSalary(p)}銀貨。`);
      }else{
        j.reviewAt=p.age+2;j.failedExams=(j.failedExams||0)+1;
        p.convalescentYears=Math.max(1,p.convalescentYears||0);
        p.occupation.medicalAssignment='rehab';
        emit('review',`復帰試験に不合格（合格見込${Math.round(probability*100)}%）。前線復帰は見送られ、さらに療養して再挑戦する道が残された。`);
      }
    }
  }else if(type==='mentor_offer'){
    j.offerResolved=true;
    if(selected==='teach'){
      const oldPay=annualSalary(p);p.occupation.medicalAssignment='instructor';
      p.occupation.assignmentName='正式教官';p.occupation.assignmentId='formal_instructor';
      p.mentoring??={years:0,students:0};j.path='instructor';j.outcome='正式教官に転身';
      emit('career',`後方任務の経験を認められ、正式教官に就任。年収 ${oldPay}→${annualSalary(p)}銀貨。訓練生を育てる第二の軍歴が始まる。`);
    }else emit('assignment','正式教官への推薦を辞退し、後方支援を続ける道を選んだ。');
  }else if(type==='retirement_offer'){
    j.offerResolved=true;
    p.mentoring??={years:0,students:0};
    if(selected==='teach'){
      j.path='retired_mentor';j.outcome='引退後の指導者';
      emit('career','軍を退いた後、地域の訓練場で教官として活動を始めた。新兵時代の失敗も経験として伝えていく。');
    }else {j.outcome='静かな余生';emit('story','戦場から距離を置き、静かな余生を送ることを選んだ。');}
  }
  return{person:p,rng,events};
}

/** Yearly downstream effects, never an invented instant recovery. */
export function progressRecoveryCareer(person){
 const p=structuredClone(person),events=[];
 const j=p.recoveryJourney;if(!j)return{person:p,events};
 const teaching=p.occupation?.medicalAssignment==='instructor'||j.path==='retired_mentor';
 if(teaching&&(p.stage==='career'||p.stage==='retired')){
  p.mentoring??={years:0,students:0};p.mentoring.years++;
  const taught=p.stage==='retired'?1:2;
  p.mentoring.students+=taught;
  p.attributes.CMD=clamp(p.attributes.CMD+.4,0,100);
  if(p.stage==='career'&&p.mentoring.years%3===0)p.merit+=1;
  if(p.mentoring.years===1||p.mentoring.years%5===0)events.push({kind:'story',text:`教官として${p.mentoring.years}年。これまで${p.mentoring.students}人を指導した。かつての負傷が、次の世代を育てる経験に変わった。`});
 }
 if(j.path==='front'&&!j.outcome&&p.age>=j.startedAt+3&&p.stage==='career'){
  j.outcome='危険な前線勤務を継続';
  events.push({kind:'recovery',text:`${j.kind}を抱えながら前線勤務を3年続けた。後遺症と危険手当は残るが、部隊の古参として認められた。`});
 }
 return{person:p,events};
}

