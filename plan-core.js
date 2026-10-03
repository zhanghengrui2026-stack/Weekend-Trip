import {activities,routeOptions,checkedAt} from './data.js?v=20261004-2';

export const byId=id=>activities.find(a=>a.id===id);
export function todayInShanghai(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;}
export function nextSaturday(){const d=new Date(todayInShanghai()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(6-d.getUTCDay()+7)%7);return d.toISOString().slice(0,10);}
export const defaultPrefs=()=>({budget:100,people:2,duration:6,weather:'sun',date:nextSaturday(),start:'13:00',origin:'我的学校 / 出发地',commute:30,food:25,transport:10,buffer:5,rest:30});
export function normalizePrefs(input={}){
 const p=defaultPrefs();if(!input||typeof input!=='object')return p;
 for(const [key,allowed] of Object.entries({budget:[50,100,150,200],people:[1,2,4],duration:[3,6,8],weather:['sun','rain']}))if(allowed.includes(input[key]))p[key]=input[key];
 for(const [key,max] of Object.entries({commute:180,food:200,transport:200,buffer:100,rest:120}))if(Number.isFinite(input[key])&&input[key]>=0&&input[key]<=max)p[key]=Math.round(input[key]);
 if(validDate(input.date))p.date=input.date;
 if(typeof input.start==='string'&&/^(0[6-9]|1[0-8]):[0-5]\d$/.test(input.start))p.start=input.start;
 if(typeof input.origin==='string'&&input.origin.trim())p.origin=input.origin.trim().slice(0,60);
 return p;
}
export function costFor(ids,prefs){const items=ids.map(byId).filter(Boolean);const c={activities:items.reduce((s,a)=>s+a.price,0),food:items.length?prefs.food:0,transport:items.length?prefs.transport:0,buffer:items.length?prefs.buffer:0};return {...c,total:c.activities+c.food+c.transport+c.buffer};}
const transferBuffers=new Map([
 [['xujiahui-park','wukang-building'].sort().join('|'),35],
 [['xuhui-art','painting-museum'].sort().join('|'),25],
 [['tushanwan','xujiahui-library'].sort().join('|'),25]
]);
export function transferMinutes(a,b){return transferBuffers.get([a,b].sort().join('|'))??40;}
export function clockTime(mins){return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;}
export function evaluateRoute(ids,input){
 const prefs=normalizePrefs(input),c=costFor(ids,prefs),issues=[],stops=[];
 const departure=Number(prefs.start.slice(0,2))*60+Number(prefs.start.slice(3));
 let cursor=departure+(ids.length?prefs.commute:0),transfer=0,waiting=0;
 const day=new Date(prefs.date+'T12:00:00Z').getUTCDay();
 for(let i=0;i<ids.length;i++){
  const a=byId(ids[i]);if(!a){issues.push('行程包含已更新的地点，请重新选择');continue;}
  if(i){const mins=transferMinutes(ids[i-1],a.id);cursor+=mins;transfer+=mins;}
  const wait=Math.max(0,(a.hours?.open??cursor)-cursor);cursor+=wait;waiting+=wait;
  const from=cursor,to=cursor+a.minutes;cursor=to;
  stops.push({a,from,to,wait,transfer:i<ids.length-1?transferMinutes(a.id,ids[i+1]):0});
  if(a.closedDays.includes(day))issues.push(`${a.title.split(' · ')[0]}按常规周一闭馆，假日需核对公告`);
  if(a.hours&&(from>=(a.hours.last??a.hours.close)||to>a.hours.close))issues.push(`${a.title.split(' · ')[0]}停留时段与常规开放时间冲突`);
  if(prefs.weather==='rain'&&!a.indoor)issues.push(`${a.title.split(' · ')[0]}是户外去处，不适合当前雨天条件`);
 }
 const returnAt=ids.length?cursor+prefs.rest+prefs.commute:departure;
 const totalMinutes=returnAt-departure;
 if(totalMinutes>prefs.duration*60)issues.push(`含往返需 ${(totalMinutes/60).toFixed(1)} 小时，超过可用 ${prefs.duration} 小时`);
 if(c.total>prefs.budget)issues.push(`人均预留超预算 ¥${c.total-prefs.budget}`);
 if(prefs.date<todayInShanghai())issues.push('出发日期已过去，请重新选择');
 return {prefs,cost:c,stops,departure,returnAt,totalMinutes,transfer,waiting,restAt:cursor,issues:[...new Set(issues)],fits:ids.length>0&&!issues.length};
}
export function chooseRoute(prefs,category='all'){
 const input=normalizePrefs(prefs);
 const preferred=[...routeOptions].sort((a,b)=>{
  const score=r=>(input.weather==='rain'&&r.id==='rain'?8:0)+(input.people>1&&r.id==='friends'?2:0)+(r.ids.some(id=>byId(id).category===category)?5:0);
  return score(b)-score(a);
 });
 for(const r of preferred)if(evaluateRoute(r.ids,input).fits)return [...r.ids];
 const ranked=activities.filter(a=>(category==='all'||a.category===category)&&(input.weather!=='rain'||a.indoor));
 for(const a of ranked)if(evaluateRoute([a.id],input).fits)return [a.id];
 return [];
}
export function sourceAgeDays(date=todayInShanghai()){return Math.floor((new Date(date+'T12:00:00Z')-new Date(checkedAt+'T12:00:00Z'))/86400000);}
export function planSignature(ids,prefs){return JSON.stringify([ids,prefs.date,prefs.start,prefs.origin,prefs.commute,prefs.rest,prefs.food,prefs.transport,prefs.buffer]);}
