import test from 'node:test';
import assert from 'node:assert/strict';
import {startLife,runToCompletion} from '../src/core/lifecycle.js';
import {resolveInjuryPath} from '../src/simulation/injury-choices.js';
import {recoveryDecision,resolveRecoveryDecision,progressRecoveryCareer} from '../src/simulation/recovery-career.js';
import {annualSalary} from '../src/simulation/economy.js';
import {initRng} from '../src/core/rng.js';
function veteran(){const p=startLife('r14-tests',{mode:'FULL_AUTO'}).person;p.age=39;p.stage='career';p.battles=18;p.health=64;p.rankIndex=1;p.occupation={careerId:'army',careerName:'正規軍',joinedAt:20};p.injuryDecisionPending={age:39,kind:'重傷'};return p;}
test('R1.4 rehabilitation changes pay and blocks combat until review',()=>{const p=veteran();const q=resolveInjuryPath(p,'rehab').person;assert.equal(q.occupation.medicalAssignment,'rehab');assert.ok(annualSalary(q)<annualSalary(p));assert.equal(recoveryDecision(q,40),null);q.convalescentYears=0;q.age=42;assert.equal(recoveryDecision(q,43).type,'return_exam');});
test('R1.4 instructor earns mentorship years and teaches trainees',()=>{const p=resolveInjuryPath(veteran(),'rear').person;p.age=43;const d=recoveryDecision(p,44);assert.equal(d.type,'mentor_offer');const q=resolveRecoveryDecision(p,initRng('mentor'),'mentor_offer','teach').person;assert.equal(q.occupation.medicalAssignment,'instructor');assert.equal(progressRecoveryCareer(q).person.mentoring.students,2);});
test('R1.4 lives complete reproducibly',()=>{for(let i=0;i<8;i++){const seed='r14-github-'+i;const a=runToCompletion(startLife(seed,{mode:'FULL_AUTO'})),b=runToCompletion(startLife(seed,{mode:'FULL_AUTO'}));assert.deepEqual(a,b);assert.equal(a.phase,'completed');}});
