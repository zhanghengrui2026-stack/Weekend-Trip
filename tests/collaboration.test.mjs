import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultPrefs} from '../plan-core.js';
import {normalizePoll,pollSignature,normalizeReply,mergeReply,summarizePoll} from '../collaboration-core.js';

const poll=normalizePoll({id:'test-poll',title:'周末一起选',host:'小林',routes:['slow','rain'],prefs:defaultPrefs()});
const response=(id='friend-one',extra={})=>({id,pollId:poll.id,signature:pollSignature(poll),name:'阿橙',choice:'slow',rsvp:'maybe',note:'预算100元以内',...extra});
test('invites preserve conditions and require two or three unique known routes',()=>{
 assert.deepEqual(normalizePoll(JSON.parse(JSON.stringify(poll))),poll);
 assert.throws(()=>normalizePoll({...poll,routes:['slow','slow']}));
 assert.throws(()=>normalizePoll({...poll,routes:['slow','unknown']}));
});
test('repeat response replaces the same participant rather than double counting',()=>{
 let replies=mergeReply([],response(),poll);
 replies=mergeReply(replies,response('friend-one',{choice:'rain',rsvp:'yes'}),poll);
 replies=mergeReply(replies,response('friend-two',{rsvp:'no'}),poll);
 const summary=summarizePoll(poll,replies);assert.equal(summary.responses.length,2);assert.equal(summary.counts.rain,1);assert.equal(summary.counts.slow,1);assert.equal(summary.confirmed,1);assert.equal(summary.unavailable,1);
});
test('wrong discussion, changed conditions, invalid route and bad time status are rejected',()=>{
 assert.throws(()=>normalizeReply(response('friend-one',{pollId:'other'}),poll));
 assert.throws(()=>normalizeReply(response(),{...poll,prefs:{...poll.prefs,food:40}}));
 assert.throws(()=>normalizeReply(response('friend-one',{choice:'film'}),poll));
 assert.throws(()=>normalizeReply(response('friend-one',{rsvp:'booked'}),poll));
});
test('round trip keeps Chinese notes and invalid stored responses cannot inflate results',()=>{
 const copy=JSON.parse(JSON.stringify(normalizeReply(response(),poll)));assert.equal(copy.note,'预算100元以内');
 const result=summarizePoll(poll,[copy,copy,{...copy,id:'bad',signature:'wrong'}]);assert.equal(result.responses.length,1);assert.equal(result.counts.slow,1);assert.equal(result.undecided,1);
});
