import test from 'node:test';
import assert from 'node:assert/strict';
import {startLife,runToCompletion,stepLife,resolveChoice} from '../src/core/lifecycle.js';
import {serializeLife,deserializeLife} from '../src/core/save-manager.js';
import {STORY_ARCS} from '../src/data/story-arcs.js';
test('50 conditional narrative templates available',()=>assert.ok(STORY_ARCS.length+12>=66));
test('seeded full life is reproducible',()=>{
 const a=runToCompletion(startLife('ci-smoke',{mode:'FULL_AUTO'}));
 const b=runToCompletion(startLife('ci-smoke',{mode:'FULL_AUTO'}));
 assert.deepEqual(a,b);
 assert.equal(a.phase,'completed');
 assert.equal(a.person.education.grades.length,5);
});
test('saved decision is stable and double submit fails',()=>{
 let s=startLife('ci-choice',{mode:'SEMI_AUTO'});
 while(s.phase==='running')s=stepLife(s);
 assert.equal(s.phase,'awaiting_choice');
 const snap=deserializeLife(serializeLife(s));
 const result=resolveChoice(s,s.pendingDecision.id,s.pendingDecision.options[0].id);
 assert.ok(result.person.age===s.person.age+1);
 assert.throws(()=>resolveChoice(result,s.pendingDecision.id,s.pendingDecision.options[0].id));
 assert.deepEqual(resolveChoice(snap,snap.pendingDecision.id,snap.pendingDecision.options[0].id),result);
});
