import test from 'node:test';
import assert from 'node:assert/strict';
import { startLife, runToCompletion } from '../src/core/lifecycle.js';
import { annualSalary,riskMultiplier,expectedTransfer } from '../src/simulation/economy.js';
import { resolveInjuryPath } from '../src/simulation/injury-choices.js';
import { serializeLife,deserializeLife } from '../src/core/save-manager.js';
const veteran=()=>{
 const p=startLife('r13-veteran',{mode:'FULL_AUTO'}).person;
 p.stage='career';p.age=40;p.health=70;p.rankIndex=1;p.battles=18;p.merit=29;
 p.occupation={careerId:'army',careerName:'正規軍',joinedAt:25,transfers:0,history:[{careerId:'army',careerName:'正規軍',startedAt:25,endedAt:null,rankIndex:1}]};
 return p;
};
test('salary changes with career, seniority and rank',()=>{
 const p=veteran();assert.ok(annualSalary(p)>0);
 assert.ok(annualSalary({...p,rankIndex:2})>annualSalary(p));
 assert.ok(expectedTransfer(p,'mercenary').newPay>0);
});
test('injury path changes pay versus danger',()=>{
 const p=veteran();p.injuryDecisionPending={age:39,kind:'重傷'};
 const rear=resolveInjuryPath(p,'rear').person,front=resolveInjuryPath(p,'front').person;
 assert.ok(riskMultiplier(rear)<riskMultiplier(p));
 assert.ok(riskMultiplier(front)>riskMultiplier(p));
 assert.ok(annualSalary(rear)<annualSalary(p));
 assert.ok(annualSalary(front)>annualSalary(p));
 assert.ok(p.injuryDecisionPending);
});
test('retire actually ends exposure and rehabilitation costs resources',()=>{
 const p=veteran();p.injuryDecisionPending={age:39,kind:'中等度負傷'};
 const retired=resolveInjuryPath(p,'retire').person;
 assert.equal(retired.stage,'retired');assert.ok(retired.occupation.pensionBase>0);
 const rehab=resolveInjuryPath(p,'rehab').person;
 assert.ok(rehab.convalescentYears>0);assert.ok(rehab.health>p.health);assert.ok(rehab.finances.cash<0);
});
test('same seed same lifetime and import remains compatible',()=>{
 const a=runToCompletion(startLife('r13-ci-replay',{mode:'FULL_AUTO'}));
 const b=runToCompletion(startLife('r13-ci-replay',{mode:'FULL_AUTO'}));
 assert.deepEqual(a,b);assert.deepEqual(deserializeLife(serializeLife(a)),a);
 assert.ok(a.person.finances?.payYears>0);
});
