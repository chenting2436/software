export interface AdapterVersion {id:string;rawField:string;scale:number;unit:string;checksum:boolean;note:string}
export const adapters=[
 {id:'gnss-json',name:'GNSS · JSON',transport:'MQTT / TCP',format:'JSON',device:'GNSS',versions:[{id:'1.0',rawField:'raw_value',scale:.001,unit:'mm',checksum:false,note:'标准位移映射'},{id:'1.1',rawField:'value',scale:.001,unit:'mm',checksum:true,note:'增加状态字段校验'}]},
 {id:'micro-json',name:'微震 · JSON',transport:'TCP',format:'JSON',device:'微震节点',versions:[{id:'1.0',rawField:'amplitude',scale:.001,unit:'mV',checksum:false,note:'三分量幅值'},{id:'1.1',rawField:'amplitude',scale:.0005,unit:'mV',checksum:true,note:'修订幅值比例'}]},
 {id:'radar-csv',name:'雷达 · CSV',transport:'FILE / HTTP',format:'CSV',device:'边坡雷达',versions:[{id:'1.0',rawField:'displacement',scale:1,unit:'mm',checksum:false,note:'位移列导入'},{id:'1.1',rawField:'displacement',scale:.1,unit:'mm',checksum:true,note:'增加状态列校验'}]},
] as const
export type Adapter=typeof adapters[number]
export interface DecodedSample {device:string;raw:number;value:number;unit:string;seq:number}
export interface ParseTest {passed:boolean;errors:string[];rows:DecodedSample[];total:number}
export function protocolSample(a:Adapter,v:AdapterVersion,bad=false){const row={device_id:a.device==='GNSS'?'GNSS-001':a.device==='微震节点'?'MS-002':'RADAR-003',[v.rawField]:bad?'invalid':5800,seq:12,...v.checksum?{status:'OK'}:{}};return a.format==='CSV'?Object.keys(row).join(',')+'\n'+Object.values(row).join(','):JSON.stringify(row,null,2)}
export function parseProtocolSample(text:string,a:Adapter,v:AdapterVersion):ParseTest{
 const errors:string[]=[],rows:DecodedSample[]=[]
 if(new TextEncoder().encode(text).byteLength>262144)return {passed:false,errors:['文件超过 256 KB'],rows,total:0}
 let input:unknown[]
 try{if(a.format==='JSON'){const data=JSON.parse(text);input=Array.isArray(data)?data:[data]}else{const lines=text.trim().split(/\r?\n/),keys=lines.shift()?.split(',').map(k=>k.trim())||[];if(new Set(keys).size!==keys.length)throw Error('CSV 列名重复');input=lines.filter(Boolean).map(line=>{const values=line.split(',');if(values.length!==keys.length)throw Error('CSV 列数不一致');return Object.fromEntries(keys.map((k,i)=>[k,values[i].trim()]))})}}catch(e){return {passed:false,errors:['格式错误：'+(e as Error).message],rows,total:0}}
 if(!input.length||input.length>1000)return {passed:false,errors:['样本数必须在 1–1000 条之间'],rows,total:input.length}
 input.forEach((item,i)=>{const r=item as Record<string,unknown>,prefix='第 '+(i+1)+' 条：';if(!r||typeof r!=='object'){errors.push(prefix+'对象格式错误');return}
 const validDevice=typeof r.device_id==='string'&&/^[\w-]{1,64}$/.test(r.device_id),numeric=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)||a.format==='CSV'&&typeof x==='string'&&x.trim()!==''&&Number.isFinite(Number(x)),raw=r[v.rawField]
 const issues=[!validDevice?'设备编号无效':'',!numeric(raw)?v.rawField+' 应为数值':'',!numeric(r.seq)||!Number.isInteger(Number(r.seq))||Number(r.seq)<0?'采样序号无效':'',v.checksum&&r.status!=='OK'?'状态校验未通过':''].filter(Boolean)
 if(issues.length){errors.push(...issues.map(s=>prefix+s));return}rows.push({device:String(r.device_id),raw:Number(raw),value:Number(raw)*v.scale,unit:v.unit,seq:Number(r.seq)})
 })
 return {passed:!errors.length&&!!rows.length,errors,rows,total:input.length}
}
export interface ProtocolRelease {id:string;version:string;targets:string[];time:string;action:string}
export interface ProtocolConfig {active:string;releases:ProtocolRelease[]}
export const defaultProtocol:ProtocolConfig={active:'',releases:[]}
export function validProtocol(v:unknown):v is ProtocolConfig{const x=v as ProtocolConfig;return !!x&&typeof x.active==='string'&&Array.isArray(x.releases)&&x.releases.every(r=>typeof r.id==='string'&&typeof r.version==='string'&&typeof r.time==='string'&&typeof r.action==='string'&&Array.isArray(r.targets)&&r.targets.every(t=>typeof t==='string'))}
export function versionDiff(a:AdapterVersion,b:AdapterVersion){return [['原始字段',a.rawField,b.rawField],['换算系数',String(a.scale),String(b.scale)],['单位',a.unit,b.unit],['状态校验',a.checksum?'必需':'可选',b.checksum?'必需':'可选']].map(([field,before,after])=>({field,before,after,changed:before!==after}))}
