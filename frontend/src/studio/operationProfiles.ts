export type OperationView='inventory'|'topology'|'trend'|'policy'|'schedule'|'checklist'|'sequence'|'mapping'|'history'|'files'|'scope'|'workflow'
/** Entries follow catalog feature order. Every tab gets a different interaction. */
export const operationProfiles:Record<string,OperationView[]>={
 gatewayManager:['inventory','topology','trend','history'],simCardManager:['trend','policy','schedule','scope'],
 firmwareAuth:['history','checklist','sequence','inventory'],monitorPointBinding:['topology','scope','checklist','mapping'],
 spatialObjectManager:['topology','mapping','scope','inventory'],maintenancePlan:['schedule','workflow','inventory','checklist'],
 deviceLifecycle:['workflow','checklist','history','scope'],deviceAlarmCenter:['checklist','workflow','trend','inventory'],
 remoteControl:['policy','checklist','workflow','history'],deviceModelLibrary:['inventory','mapping','topology','scope'],
 calibrationLedger:['history','mapping','schedule','files'],networkMonitor:['topology','trend','sequence','checklist'],
 offlineAnalysis:['sequence','workflow','topology','history'],deviceHealth:['trend','checklist','topology','schedule'],
 tcpSession:['inventory','sequence','trend','policy'],mqttSession:['inventory','topology','trend','workflow'],
 httpAccess:['inventory','checklist','sequence','workflow'],duplicateDisorder:['inventory','sequence','mapping','policy'],
 rangeDrift:['policy','sequence','trend','checklist'],timeSync:['inventory','trend','topology','history'],
 fileUploadCenter:['files','sequence','checklist','mapping'],storageArchive:['trend','scope','workflow','policy'],
 fileResultCenter:['files','scope','history','inventory'],dataExport:['scope','sequence','files','history'],
 metricDictionary:['inventory','mapping','history','topology'],riskRuleCenter:['policy','checklist','trend','history'],
 notificationCenter:['policy','history','sequence','workflow'],emergencyPlan:['policy','topology','schedule','checklist'],
 riskLevelHistory:['history','policy','trend','checklist'],customerProjectManager:['inventory','scope','topology','history'],
 sensitiveApproval:['workflow','checklist','inventory','history'],configurationVersion:['mapping','checklist','scope','history'],
 releaseRollback:['checklist','scope','trend','history'],serviceHealth:['checklist','topology','trend','history'],
 resourceMonitor:['trend','policy','inventory','mapping'],messageQueueMonitor:['inventory','topology','trend','workflow'],
 openApiMonitor:['trend','policy','sequence','history'],shiftHandover:['schedule','inventory','checklist','files'],
 acceptanceChecklist:['checklist','files','workflow','history'],deploymentReadiness:['checklist','mapping','inventory','files'],
 deliverableCenter:['inventory','workflow','files','history'],interfaceDependency:['inventory','topology','checklist','scope'],
 multiSourceOverview:['scope','topology','workflow','inventory'],projectSwitcher:['inventory','scope','topology','history'],
}
const fallback:OperationView[]=['inventory','mapping','checklist','history','scope','trend']
export function operationView(kind:string,index:number):OperationView{return operationProfiles[kind]?.[index]||fallback[index%fallback.length]}
export interface OperationDraft {device:string;targets:string[];threshold:number;duration:number;scale:number;offset:number;checks:string[];date:string;stage:number;note:string}
export const defaultOperation=():OperationDraft=>({device:'',targets:[],threshold:65,duration:3,scale:1,offset:0,checks:[],date:new Date().toISOString().slice(0,10),stage:0,note:''})
export function validOperation(x:unknown):x is OperationDraft{const v=x as OperationDraft;return !!v&&typeof v.device==='string'&&Array.isArray(v.targets)&&v.targets.every(s=>typeof s==='string')&&[v.threshold,v.duration,v.scale,v.offset,v.stage].every(Number.isFinite)&&v.threshold>=0&&v.threshold<=100&&Number.isInteger(v.duration)&&v.duration>=1&&v.duration<=60&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=4&&typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&!Number.isNaN(Date.parse(v.date))&&typeof v.note==='string'&&Array.isArray(v.checks)&&v.checks.length<=4&&new Set(v.checks).size===v.checks.length&&v.checks.every(s=>typeof s==='string')}
export function operationSeries(seed:number){return Array.from({length:96},(_,i)=>Math.max(1,Math.min(99,43+Math.sin(i*.18+seed)*13+Math.cos(i*.79)*8+Math.sin(i*1.77)*3+28*Math.exp(-(((i-61)/7)**2))+i*.09)))}
export function thresholdRuns(values:number[],threshold:number,duration:number){let run=0;return values.map(v=>{run=v>threshold?run+1:0;return run>=duration})}
export function reorderPackets(input:number[],deduplicate:boolean){const rows=deduplicate?[...new Set(input)]:[...input];return rows.sort((a,b)=>a-b)}
