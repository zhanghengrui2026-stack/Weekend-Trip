import test from 'node:test';
import assert from 'node:assert/strict';
import {activities,routeOptions} from '../data.js';
import {defaultPrefs,normalizePrefs,evaluateRoute,chooseRoute,validDate,planSignature,campusPrefs,mapSearchUrl} from '../plan-core.js';

const prefs=defaultPrefs();
function dayAfter(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}

test('curated routes reference real, sourced places only',()=>{
 assert.equal(activities.length,7);
 for(const a of activities){assert.ok(a.address);assert.match(a.source,/^https?:\/\//);assert.ok(a.opening);assert.ok(a.check);}
 for(const r of routeOptions){assert.equal(r.ids.length,2);assert.ok(r.ids.every(id=>activities.some(a=>a.id===id)));}
});
test('Saturday routes include admission, reserves, commute, rest and transfers',()=>{
 for(const r of routeOptions){const p=evaluateRoute(r.ids,prefs);assert.equal(p.cost.total,r.id==='film'?100:40);assert.ok(p.fits);assert.equal(p.returnAt-p.departure,p.totalMinutes);assert.equal(p.totalMinutes,p.stops.reduce((s,v)=>s+v.a.minutes,0)+60+p.transfer+30+p.waiting);}
});
test('paid option fits 100 yuan but not 50 and does not assume a student discount',()=>{
 const ids=routeOptions.find(r=>r.id==='film').ids;
 assert.equal(evaluateRoute(ids,prefs).cost.activities,60);
 assert.equal(evaluateRoute(ids,{...prefs,budget:50}).fits,false);
 assert.equal(evaluateRoute(ids,{...prefs,food:40}).cost.total,115);
});
test('campus presets keep budget and date, and navigation encodes user text safely',()=>{
 const p=campusPrefs({...prefs,food:0},'ecust-xuhui');assert.equal(p.commute,45);assert.equal(p.food,0);assert.equal(p.date,prefs.date);assert.match(p.origin,/梅陇路130号/);
 assert.equal(normalizePrefs(p).campus,'ecust-xuhui');assert.equal(normalizePrefs({campus:'unknown'}).campus,'custom');
 const keyword='学校 & 朋友 #地点';const url=new URL(mapSearchUrl(keyword));assert.equal(url.origin,'https://uri.amap.com');assert.equal(url.searchParams.get('keyword'),keyword);assert.equal(url.searchParams.get('city'),'上海');
});
test('rain excludes outdoor routes, generation selects indoor places',()=>{
 const input={...prefs,weather:'rain'};
 assert.equal(evaluateRoute(routeOptions[0].ids,input).fits,false);
 const ids=chooseRoute(input);assert.ok(ids.length);assert.ok(ids.every(id=>activities.find(a=>a.id===id).indoor));assert.ok(evaluateRoute(ids,input).fits);
});
test('Monday closure and late arrival are explained rather than accepted',()=>{
 const monday={...prefs,date:dayAfter(prefs.date,2)};
 assert.ok(evaluateRoute(routeOptions[1].ids,monday).issues.some(v=>v.includes('闭馆')));
 assert.ok(evaluateRoute(['tushanwan'],{...prefs,start:'16:00'}).issues.some(v=>v.includes('开放时间冲突')));
});
test('return commute and editable reserves can make an otherwise free route infeasible',()=>{
 const long={...prefs,duration:3,commute:90};assert.equal(evaluateRoute(routeOptions[1].ids,long).fits,false);
 const expensive={...prefs,budget:50,food:50,transport:20,buffer:10};assert.equal(chooseRoute(expensive).length,0);assert.ok(evaluateRoute(routeOptions[1].ids,expensive).issues.some(v=>v.includes('超预算')));
});
test('waiting for opening is counted and zero reserves are preserved',()=>{
 const r=evaluateRoute(['xuhui-art'],{...prefs,start:'06:00',commute:0,duration:3});assert.equal(r.waiting,180);assert.equal(r.fits,false);
 const zero=normalizePrefs({...prefs,food:0,transport:0,buffer:0,commute:0,rest:0});assert.equal(evaluateRoute(['xuhui-art'],zero).cost.total,0);
});
test('shared settings are normalized and impossible dates or times are rejected',()=>{
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2026-10-10'),true);
 const bad=normalizePrefs({budget:-1,people:100,food:-20,commute:Infinity,start:'99:00',date:'2026-02-30'});assert.equal(bad.budget,100);assert.equal(bad.people,2);assert.equal(bad.food,25);assert.equal(bad.start,'13:00');
 const copy=normalizePrefs(JSON.parse(JSON.stringify({...prefs,origin:'我的学校',commute:45,food:0})));assert.equal(copy.origin,'我的学校');assert.equal(copy.commute,45);assert.equal(copy.food,0);
 assert.notEqual(planSignature(routeOptions[0].ids,prefs),planSignature(routeOptions[0].ids,{...prefs,date:dayAfter(prefs.date,1)}));
});
