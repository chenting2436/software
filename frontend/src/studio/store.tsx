import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { algorithmSpecs } from './algorithms'
import { seedAcquisitionDevices } from './hardware'
import { seedPlatformDevices } from './sceneCatalog'
import { packetData, sourceFor, type SourceRef, type HistorySnapshot } from './telemetry'
import type { AnalysisRecord } from './AlgorithmLab'
export type Role = '项目管理员' | '设备管理员' | '算法工程师' | '风险处置员' | '客户访客'
export type Domain = 'device' | 'data' | 'algorithm' | 'risk' | 'account' | 'config'
export const roles: Role[] = ['项目管理员','设备管理员','算法工程师','风险处置员','客户访客']
export interface Device { id:string; name:string; type:string; area:string; status:string; battery:number; signal:number; rate:string; x:number; y:number; owner:string; model:string; lastSeenFrame?:number; linkedDevice?:string; parts?:Record<string,string>; faultBackup?:{status:string;battery:number;signal:number} }
export interface Task { id:string; algorithm:string; input:string; params:Record<string,number>; status:string; progress:number; time:string; version:number; excluded:string[]; note:string; source?:SourceRef|null; analysis?:AnalysisRecord }
export interface Risk { id:string; title:string; device:string; level:string; stage:number; owner:string; note:string; task:string; history:{time:string;action:string;actor:string}[] }
export interface Account { id:string; name:string; role:Role; scope:string; enabled:boolean }
export interface RecordItem { id:string; values:string[]; status:string; version:number; updated:string; history:string[]; operations?:Record<string,import('./operationProfiles').OperationDraft> }
export interface DemoState { role:Role; scenario:string; playing:boolean; speed:number; frame:number; selectedDevice:string; devices:Device[]; tasks:Task[]; risks:Risk[]; accounts:Account[]; records:Record<string,RecordItem[]>; audit:{id:string;time:string;actor:string;action:string;object:string}[]; mapping:number; history:HistorySnapshot[] }
export const now = () => new Date().toLocaleString('zh-CN',{hour12:false})
export const riskStages = ['待确认','待派发','现场处置','待复核','已关闭']
export const seedDevices = ():Device[] => Array.from({length:24},(_,i)=>{
  const type=['GNSS','微震节点','边坡雷达','气象站'][i%4]
  const area=['北帮','南帮','东帮'][Math.floor(i/8)]
  return {id:`${['GNSS','MS','RADAR','MET'][i%4]}-${String(i+1).padStart(3,'0')}`,name:`${area} ${String(i+1).padStart(2,'0')} 号监测站`,type,area,status:i===5?'离线':i===10?'待维护':'在线',battery:Math.min(100,72+(i*7)%29),signal:-(55+(i*3)%26),rate:['1 Hz','1000 Hz','5 min','1 min'][i%4],x:(i%8)*34-119,y:Math.floor(i/8)*70-70,owner:['陈工','李工','王工'][Math.floor(i/8)],model:['KD-GNSS G2','KD-MS S3','KD-RADAR R1','KD-MET M1'][i%4]}
})
const initial = ():DemoState => ({role:'项目管理员',scenario:'风险闭环',playing:false,speed:1,frame:36,selectedDevice:'UAV-201',devices:[...seedDevices(),...seedAcquisitionDevices(),...seedPlatformDevices()],mapping:1,history:[],
 tasks:algorithmSpecs.map((a,i)=>({id:`TASK-${String(i+1).padStart(4,'0')}`,algorithm:a.id,input:i>=29?'GNSS-001':i>=17?'样例事件 / EVT-0921-006':'样例批次 / 北帮测线 L01',params:Object.fromEntries(a.params.map(p=>[p[0],p[1]])),status:'已完成',progress:100,time:'2026/09/21 09:30:00',version:1,excluded:[],note:'内置离线样例'})),
 risks:[{id:'RISK-001',title:'北帮 01 号测点位移加速',device:'GNSS-001',level:'橙色',stage:0,owner:'王工',note:'需结合降雨与微震证据进行复核。',task:'TASK-0031',history:[{time:'2026/09/21 09:45:00',action:'规则命中，形成待确认事件',actor:'演示场景'}]},{id:'RISK-002',title:'东帮局部位移变化',device:'GNSS-017',level:'黄色',stage:2,owner:'陈工',note:'现场巡检进行中。',task:'TASK-0030',history:[{time:'2026/09/21 08:10:00',action:'已派发现场核查',actor:'项目管理员'}]}],
 accounts:[{id:'admin_kd',name:'矿大项目组',role:'项目管理员',scope:'全部区域',enabled:true},{id:'device_chen',name:'陈工',role:'设备管理员',scope:'全部区域',enabled:true},{id:'algo_li',name:'李工',role:'算法工程师',scope:'全部区域',enabled:true},{id:'risk_wang',name:'王工',role:'风险处置员',scope:'北帮',enabled:true},{id:'guest_demo',name:'客户参观账号',role:'客户访客',scope:'北帮',enabled:true}],records:{},audit:[]})
const KEY='kuangda-studio-v3'
const restore = ():DemoState => {let s=initial();try {const value=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(value?.devices)&&Array.isArray(value?.accounts)&&Array.isArray(value?.tasks))s={...s,...value,playing:false,history:Array.isArray(value.history)?value.history:[]}}catch{/* Offline defaults. */}s.devices=[...s.devices,...[...seedAcquisitionDevices(),...seedPlatformDevices()].filter(d=>!s.devices.some(x=>x.id===d.id))];s.tasks=s.tasks.map(t=>({...t,source:t.analysis?t.source??null:sourceFor(t,s.devices,36,s.mapping)}));return s}
export function captureSnapshot(s:DemoState,label:string):HistorySnapshot{return JSON.parse(JSON.stringify({id:crypto.randomUUID(),time:now(),label,frame:s.frame,devices:s.devices,packets:packetData(s.devices,s.frame,s.mapping),tasks:s.tasks.slice(0,50).map(t=>t.analysis?{...t,analysis:{...t.analysis,result:undefined}}:t),risks:s.risks,actor:s.role}))}
export const canRole = (role:Role,domain:Domain) => role==='项目管理员'||(role==='设备管理员'&&['device','data'].includes(domain))||(role==='算法工程师'&&domain==='algorithm')||(role==='风险处置员'&&domain==='risk')
interface Context {state:DemoState; visibleDevices:Device[]; can:(domain:Domain)=>boolean; update:(domain:Domain,action:string,object:string,fn:(s:DemoState)=>DemoState)=>void; selectDevice:(id:string)=>void; control:(values:Partial<Pick<DemoState,'role'|'scenario'|'playing'|'speed'|'frame'>>)=>void; run:(algorithm:string,input:string,params:Record<string,number>,excluded:string[])=>string; storageError:string }
const DemoContext=createContext<Context|null>(null)
export function DemoProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState<DemoState>(()=>{const restored=restore();try{if(sessionStorage.getItem('kuangda-root-login-reset')==='1'){sessionStorage.removeItem('kuangda-root-login-reset');return {...restored,role:'项目管理员'}}}catch{}return restored})
 const [storageError,setStorageError]=useState('')
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(state));setStorageError('')}catch{setStorageError('本地存储不足，本次变更未能持久保存。')}},[state])
 const active=state.tasks.some(t=>t.status==='运行中')
 useEffect(()=>{if(!active&&!state.playing)return;const t=window.setInterval(()=>setState(s=>({...s,frame:s.playing?Math.min(120,s.frame+s.speed):s.frame,playing:s.frame>=120?false:s.playing,tasks:s.tasks.map(task=>task.status==='运行中'?{...task,progress:Math.min(100,task.progress+10),status:task.progress>=90?'已完成':'运行中'}:task)})),750);return()=>clearInterval(t)},[active,state.playing,state.speed])
 const visibleDevices=state.devices.filter(d=>state.role!=='客户访客'||d.area==='北帮')
 const update:Context['update']=(domain,action,object,fn)=>setState(s=>{if(!canRole(s.role,domain))return s;const next=fn(s);return {...next,history:[captureSnapshot(next,`${action} / ${object}`),...s.history].slice(0,35),audit:[{id:crypto.randomUUID(),time:now(),actor:s.role,action,object},...s.audit].slice(0,150)}})
 const control:Context['control']=(values)=>setState(s=>{
   if(values.scenario&&values.scenario!==s.scenario){return {...s,...values,frame:0,playing:false,history:[captureSnapshot(s,`切换场景前：${s.scenario}`),...s.history].slice(0,35),audit:[{id:crypto.randomUUID(),time:now(),actor:s.role,action:`切换场景：${values.scenario}`,object:'演示控制'},...s.audit]}}
   return {...s,...values}
 })
 const run:Context['run']=(algorithm,input,params,excluded)=>{
   const id=`TASK-${crypto.randomUUID().slice(0,8)}`
   update('algorithm','创建算法任务',id,s=>({...s,tasks:[{id,algorithm,input,params:{...params},source:sourceFor({algorithm,input},s.devices,s.frame,s.mapping),status:!input?'失败':'运行中',progress:0,time:now(),version:s.tasks.filter(t=>t.algorithm===algorithm).length+1,excluded:[...excluded],note:input?'离线工况演示 / 输入快照已归档':'未选择输入数据'},...s.tasks].slice(0,180)}))
   return id
 }
 return <DemoContext.Provider value={{state,visibleDevices,can:domain=>canRole(state.role,domain),update,control,selectDevice:id=>setState(s=>({...s,selectedDevice:id})),run,storageError}}>{children}</DemoContext.Provider>
}
export const useDemo=()=>{const value=useContext(DemoContext);if(!value)throw new Error('DemoProvider missing');return value}
export async function exportFile(name:string,content:string,type='application/json') {try{const native=(window as unknown as {go?:{main?:{App?:{SaveExport?:(content:string,name:string)=>Promise<string>}}}}).go?.main?.App?.SaveExport;if(native){await native(content,name);return}const url=URL.createObjectURL(new Blob([content],{type:`${type};charset=utf-8`}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(error){window.alert(`导出失败：${String(error)}`)}}
export function exportCSV(name:string,headers:string[],rows:unknown[][]){const cell=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;exportFile(name,'\uFEFF'+[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv')}
export const escapeHTML=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export const PacketData=packetData
