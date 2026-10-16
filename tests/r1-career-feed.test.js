import test from 'node:test';
import assert from 'node:assert/strict';
import { startLife, runToCompletion } from '../src/core/lifecycle.js';
import { transferOptions, eligibleForTransfer, attemptTransfer, maybeReassign } from '../src/simulation/career-paths.js';
import { initRng } from '../src/core/rng.js';
import { readLifeMetrics } from '../src/analysis/life-stats.js';
import { STORY_ARCS } from '../src/data/story-arcs.js';

function sample(){
  const p=structuredClone(runToCompletion(startLife('r12-career-fixture',{mode:'FULL_AUTO'})).person);
  p.age=40;p.stage='career';p.health=98;p.convalescentYears=0;
  p.merit=38;p.battles=30;p.wins=20;p.attributes.MAG=60;
  p.occupation={careerId:'army',careerName:'正規軍',joinedAt:22,transfers:0,history:[{careerId:'army',careerName:'正規軍',startedAt:22,endedAt:null,rankIndex:1}]};
  p.rankIndex=1;return p;
}
test('career transfer requires years of service and valid destination',()=>{
 const p=sample();
 assert.equal(eligibleForTransfer(p,40),true);
 assert.equal(eligibleForTransfer(p,39),false);
 assert.ok(transferOptions(p).some(x=>x.id==='mage'));
 assert.ok(transferOptions(p).every(x=>x.id!=='army'));
});
test('transfer result changes profession only on acceptance, retaining prior record',()=>{
 const p=sample();let accepted,rejected;
 for(let i=0;i<100 && (!accepted||!rejected);i++){
  const x=attemptTransfer(p,initRng('career-result-'+i),'mage');
  if(x.kind==='transfer')accepted=x; else if(x.kind==='review')rejected=x;
 }
 assert.ok(accepted&&rejected);
 assert.equal(accepted.person.occupation.careerId,'mage');
 assert.equal(accepted.person.occupation.history.length,2);
 assert.equal(accepted.person.occupation.history[0].endedAt,40);
 assert.equal(rejected.person.occupation.careerId,'army');
 assert.equal(rejected.person.occupation.history.length,1);
 assert.equal(p.occupation.careerId,'army');
});
test('personnel reassignment affects actual stats',()=>{
 const p=sample();let changed;
 for(let i=0;i<100&&!changed;i++){const a=maybeReassign(p,initRng('posting-'+i));if(a.log)changed=a;}
 assert.ok(changed);
 assert.equal(changed.person.occupation.assignmentChanges,1);
 assert.notDeepEqual(changed.person,p);
});
test('R1.2 story catalog includes additional context-gated arcs',()=>{
 assert.ok(STORY_ARCS.length>=50);
 assert.equal(new Set(STORY_ARCS.map(x=>x.id)).size,STORY_ARCS.length);
});
test('completed lives remain deterministic and career metrics match history',()=>{
 const a=runToCompletion(startLife('r12-full-life',{mode:'FULL_AUTO'}));
 const b=runToCompletion(startLife('r12-full-life',{mode:'FULL_AUTO'}));
 assert.deepEqual(a,b);
 assert.equal(a.phase,'completed');
 const m=readLifeMetrics(a);
 assert.equal(m.transferCount,a.timeline.filter(x=>x.kind==='transfer').length);
 assert.equal(m.assignmentCount,a.timeline.filter(x=>x.kind==='assignment').length);
});
