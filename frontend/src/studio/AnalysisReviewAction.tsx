import {useState} from 'react'
import {ShieldCheck,ArrowUpRight} from 'lucide-react'
import {useDemo,now,type Risk} from './store'
import {moduleCatalog} from '../data/catalog'
import {Modal} from './DesktopControls'
import {goWorkspace} from './navigation'
export function AnalysisReviewAction({taskId,desktop=false}:{taskId:string;desktop?:boolean}){
 const {state,visibleDevices,can,update}=useDemo(),task=state.tasks.find(t=>t.id===taskId),[open,setOpen]=useState(false),[target,setTarget]=useState(''),[note,setNote]=useState('')
 const existing=state.risks.find(r=>r.task===taskId&&visibleDevices.some(d=>d.id===r.device))
 if(!task?.analysis)return null
 const device=target||task.source?.deviceId||'',valid=visibleDevices.some(d=>d.id===device)
 const create=()=>{if(!can('risk')||!valid||!note.trim())return;const id=`RV-${crypto.randomUUID().slice(0,8)}`,risk:Risk={id,title:`${moduleCatalog.find(m=>m.id===task.algorithm)?.name||task.algorithm} · 成果研判`,device,level:'关注',stage:0,owner:'现场值班组',note:note.trim(),task:taskId,history:[{time:now(),actor:state.role,action:`人工登记研判 / V${task.version} / ${task.analysis!.digest} / 合成或参考成果，非现场自动预警`}]};update('risk','登记成果研判',id,s=>({...s,risks:[risk,...s.risks]}));setOpen(false);goWorkspace({page:'risk',id})}
 const form=<><p>引用已冻结成果 V{task.version} / {task.analysis.digest}。此操作建立本地处置流程，不生成现场安全判断。</p><label className="algorithm-review-field">关联监测对象<select aria-label="研判关联设备" value={device} onChange={e=>setTarget(e.target.value)}><option value="">请选择设备</option>{visibleDevices.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select></label><label className="algorithm-review-field">研判依据<textarea aria-label="研判依据" placeholder="填写需复核的异常或参数差异" value={note} onChange={e=>setNote(e.target.value)}/></label></>
 return <><button disabled={!can('risk')&&!existing} onClick={()=>existing?goWorkspace({page:'risk',id:existing.id}):setOpen(true)}><ShieldCheck size={14}/>{existing?'查看研判':'转入研判'}<ArrowUpRight size={12}/></button>{open&&<Modal title="登记成果研判" onClose={()=>setOpen(false)} footer={<><button onClick={()=>setOpen(false)}>取消</button><button disabled={!valid||!note.trim()} onClick={create}>登记并进入闭环</button></>}>{form}</Modal>}</>
}
