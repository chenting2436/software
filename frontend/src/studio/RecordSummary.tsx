import {Download,FileJson,CheckCircle2} from 'lucide-react'
import {exportFile} from './store'
const labels:Record<string,string>={id:'记录',device:'设备',device_id:'设备',deviceId:'设备',area:'区域',protocol:'协议',value:'数值',raw:'原始值',raw_value:'原始值',metric:'测项',unit:'单位',status:'状态',delay:'延迟 / s',trace:'追踪编号',traceId:'追踪编号',frame:'采样序号',seq:'采样序号',mapping:'标定系数',version:'版本',algorithm:'算法',dataset:'数据批次',taskId:'任务',time:'时间',inputLabel:'输入',immutable:'输入已冻结',engineVersion:'引擎版本',digest:'成果指纹',source:'来源',mode:'模式'}
/** Inspect a short readable summary; export the complete unmodified record. */
export function RecordSummary({value,title='记录摘要',filename='原始记录'}:{value:unknown;title?:string;filename?:string}){
 const entries:[string,unknown][]=value&&typeof value==='object'?Object.entries(value):[['value',value]]
 const fields=entries.filter(([,v])=>v!=null&&typeof v!=='object').slice(0,8)
 return <section className="record-summary"><header><FileJson size={19}/><strong>{title}</strong><button title="下载原始记录" onClick={()=>exportFile(`${filename}.json`,JSON.stringify(value??{},null,2))}><Download size={15}/>下载</button></header><dl>{fields.map(([key,v])=><div key={key}><dt>{labels[key]||key}</dt><dd>{typeof v==='boolean'?(v?'是':'否'):String(v)}</dd></div>)}</dl>{!fields.length&&<div className="record-summary-empty"><CheckCircle2 size={24}/><span>{Array.isArray(value)?`${value.length} 条记录`:'结构化记录'}<small>完整内容可下载查看</small></span></div>}</section>
}
