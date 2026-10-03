import {routeOptions} from './data.js?v=20261004-3';
import {normalizePrefs} from './plan-core.js?v=20261004-3';

const text=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const validId=value=>typeof value==='string'&&/^[\w-]{1,60}$/.test(value);
const options=new Set(routeOptions.map(r=>r.id));
export function normalizePoll(input){
 if(!input||!validId(input.id))throw new Error('讨论编号无效');
 const routes=Array.isArray(input.routes)?[...new Set(input.routes)]:[];
 if(routes.length<2||routes.length>3||!routes.every(id=>options.has(id)))throw new Error('请选择两到三份有效方案');
 const host=text(input.host,12),title=text(input.title,35);
 if(!host||!title)throw new Error('请填写昵称和讨论标题');
 return {version:1,id:input.id,host,title,routes,prefs:normalizePrefs(input.prefs)};
}
export function pollSignature(poll){const p=normalizePoll(poll);return JSON.stringify([p.id,p.routes,p.prefs]);}
export function normalizeReply(input,poll){
 const p=normalizePoll(poll);
 if(!input||input.pollId!==p.id||input.signature!==pollSignature(p))throw new Error('回应不属于这份讨论，或邀请内容已变化');
 if(!validId(input.id)||!p.routes.includes(input.choice)||!['yes','maybe','no'].includes(input.rsvp))throw new Error('回应格式无效');
 const name=text(input.name,12);if(!name)throw new Error('请填写昵称');
 return {version:1,id:input.id,pollId:p.id,signature:pollSignature(p),name,choice:input.choice,rsvp:input.rsvp,note:text(input.note,120)};
}
export function mergeReply(replies,input,poll){
 const next=normalizeReply(input,poll),current=Array.isArray(replies)?replies:[];
 const safe=current.flatMap(r=>{try{return [normalizeReply(r,poll)];}catch{return [];}});
 if(safe.length>=30&&!safe.some(r=>r.id===next.id))throw new Error('最多汇总30位朋友的回应');
 return [...safe.filter(r=>r.id!==next.id),next];
}
export function summarizePoll(poll,replies=[]){
 const p=normalizePoll(poll),safe=replies.flatMap(r=>{try{return [normalizeReply(r,p)];}catch{return [];}});
 const unique=[...new Map(safe.map(r=>[r.id,r])).values()];
 return {responses:unique,counts:Object.fromEntries(p.routes.map(id=>[id,unique.filter(r=>r.choice===id).length])),confirmed:unique.filter(r=>r.rsvp==='yes').length,undecided:unique.filter(r=>r.rsvp==='maybe').length,unavailable:unique.filter(r=>r.rsvp==='no').length};
}
