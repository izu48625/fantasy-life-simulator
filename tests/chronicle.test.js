import test from 'node:test';
import assert from 'node:assert/strict';
import { startLife, runToCompletion, stepLife, resolveChoice } from '../src/core/lifecycle.js';
import { readLifeMetrics, yearDelta } from '../src/analysis/life-stats.js';
import { serializeLife, deserializeLife } from '../src/core/save-manager.js';

const sample = runToCompletion(startLife('chronicle-regression-seed',{mode:'FULL_AUTO'}));
test('annual records are saved for every committed age, including birth and death',()=>{
  const rows = sample.annualRecords;
  assert.equal(rows.length, sample.person.age + 1);
  assert.equal(rows[0].age,0);
  assert.equal(rows.at(-1).age, sample.person.deathAge);
  assert.equal(rows.at(-1).stage, 'deceased');
  assert.ok(rows.every((row,i) => row.age===i && Number.isInteger(row.ovr) && row.ovr>=0 && row.ovr<=100));
  assert.equal(new Set(rows.map(row=>row.age)).size,rows.length);
});
test('metrics match actual saved state and recorded combat outcomes',()=>{
 const metrics=readLifeMetrics(sample);
 assert.equal(metrics.battles,sample.person.battles);
 assert.equal(metrics.wins+metrics.losses,metrics.battles);
 assert.equal(metrics.warBattles,sample.timeline.filter(e=>e.kind==='battle'&&e.detail?.war).length);
 assert.equal(metrics.peakOvr,Math.max(...sample.annualRecords.map(r=>r.ovr)));
 assert.ok(metrics.peakOvr>=metrics.ovr);
 assert.equal(metrics.ovrGrowth,metrics.ovr-sample.annualRecords[0].ovr);
 assert.equal(metrics.majorEvents,sample.timeline.filter(e=>e.importance==='major').length);
 const injuries=sample.timeline.filter(e=>e.kind==='battle'&&e.detail?.injury).length;
 assert.equal(injuries,sample.person.injuries.length);
});
test('annual delta is a difference of factual snapshots, without RNG or synthetic numbers',()=>{
 const a=sample.annualRecords[3],b=sample.annualRecords[4];
 assert.equal(yearDelta(sample.annualRecords,4).ovr,b.ovr-a.ovr);
 assert.equal(yearDelta(sample.annualRecords,4).battles,b.battles-a.battles);
 assert.equal(yearDelta(sample.annualRecords,0),null);
});
test('choices do not pre-commit a year or manufacture repeated snapshots',()=>{
 let state=startLife('chronicle-choice',{mode:'SEMI_AUTO'});
 while(state.phase==='running')state=stepLife(state);
 const age=state.person.age;
 assert.equal(state.annualRecords.length,age+1);
 const untouched=stepLife(state);
 assert.deepEqual(untouched.annualRecords,state.annualRecords);
 const chosen=resolveChoice(state,state.pendingDecision.id,state.pendingDecision.options[0].id);
 assert.equal(chosen.annualRecords.length,chosen.person.age+1);
 assert.equal(chosen.annualRecords.filter(r=>r.age===chosen.person.age).length,1);
});
test('older R0/R1 save without snapshots is restored and starts recording from next year',()=>{
 let state=startLife('chronicle-legacy',{mode:'FULL_AUTO'});
 for(let i=0;i<22;i++) state=stepLife(state);
 delete state.annualRecords;
 const restored=deserializeLife(serializeLife(state));
 assert.equal(readLifeMetrics(restored).ovrGrowth,null);
 const after=stepLife(restored);
 assert.equal(after.annualRecords.length,1);
 assert.equal(after.annualRecords[0].age,after.person.age);
});
test('1000 auto lives complete with coherent annual records',()=>{
 for(let i=0;i<1000;i++){
  const life=runToCompletion(startLife(`annual-mass-${i}`,{mode:'FULL_AUTO'}));
  assert.equal(life.annualRecords.length,life.person.age+1,`seed ${i}`);
  assert.equal(readLifeMetrics(life).battles,life.person.battles);
 }
});
