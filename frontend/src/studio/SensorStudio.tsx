import {DeviceHistory} from './DeviceHistory'
import {RecordSummary} from './RecordSummary'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Radio, BatteryCharging, Cable, Cpu, X, Activity, History, ShieldCheck } from 'lucide-react'
import { hardwareModels, sensorFamily, supportsTwin, type SensorFamily } from './hardware'
import { SensorScene } from './SensorScene'
import { useDemo, PacketData, type Device } from './store'
import { DeviceStudio, RecordsStudio } from './BusinessStudio'
import { TraceStudio } from './TraceStudio'
import { lockBodyScroll } from './scrollLock'
import {useWorkspaceState} from './workspaceState'
import {goWorkspace} from './navigation'

import { InstrumentPlot } from './InstrumentPlot'
import { platformFor } from './sceneCatalog'
import { PlatformWorkbench } from './PlatformWorkbench'
import {WorkspaceDrawer} from './WorkspaceDrawer'
import {EquipmentGallery} from './EquipmentGallery'

export function SensorStudio({deviceId,initialFamily,showTitle=true}:{deviceId?:string;initialFamily?:SensorFamily;showTitle?:boolean}){
 const {state,visibleDevices,can,update,selectDevice}=useDemo()
 const [linkedId,setLinkedId]=useState(''),[inspectOpen,setInspectOpen]=useState(false),[diagnosticsOpen,setDiagnosticsOpen]=useState(false)
 const current=(linkedId||deviceId)?visibleDevices.find(d=>d.id===(linkedId||deviceId)&&supportsTwin(d)):visibleDevices.find(d=>supportsTwin(d)&&(!initialFamily||sensorFamily(d)===initialFamily))
 const [partId,setPartId]=useState(''),[tab,setTab]=useState('部件状态'),[channel,setChannel]=useState(0),[fault,setFault]=useState(''),[notice,setNotice]=useState('')
 if(!current)return <div className="empty">当前角色范围内没有对应设备。</div>
 const family=sensorFamily(current),model=hardwareModels[family],part=model.parts.find(p=>p.id===partId)||model.parts[0],faultPart=Object.keys(current.parts||{}).find(k=>current.parts?.[k]),packet=PacketData(visibleDevices,state.frame,state.mapping).find(p=>p.device===current.id)
 const related=family==='micro'?visibleDevices.find(d=>d.linkedDevice===current.id):family==='daq'?visibleDevices.find(d=>d.id===current.linkedDevice):null
 const inject=()=>{const id=fault||part.id;update('device','注入部件故障（模拟）',current.id,s=>({...s,devices:s.devices.map(d=>d.id===current.id?{...d,faultBackup:d.faultBackup||{status:d.status,battery:d.battery,signal:d.signal},parts:{[id]:id==='communication'?'链路中断':id==='power'?'电源欠压':'通道质量异常'},status:id==='communication'?'离线':'待维护',battery:id==='power'?16:d.battery,signal:id==='communication'?-112:d.signal}:d)}));setPartId(id);setNotice('已注入模拟故障，设备状态、报文和历史快照同步更新。')}
 const recover=()=>{update('device','恢复部件并验证链路',current.id,s=>({...s,devices:s.devices.map(d=>d.id===current.id?{...d,...d.faultBackup,parts:{},faultBackup:undefined}:d)}));setNotice('恢复记录已归档，可以在数据回溯中对照故障前后快照。')}
 return <div className="sensor-workspace">{showTitle&&<div className="sensor-title"><h2>{model.title}</h2><span className={`sensor-status ${faultPart?'fault':''}`}><i/>{current.status}</span></div>}
 <div className="sensor-detail-tabs">{['部件状态','实时通道','电源与通信','运行与维护','历史与证据'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {tab==='部件状态'&&<div className="sensor-workspace-grid"><aside className="sensor-part-tree"><div className="sensor-small-heading">结构与部件 <span>{model.parts.length}</span></div>{model.parts.map((p,i)=><button key={p.id} className={part.id===p.id?'active':''} onClick={()=>{setPartId(p.id);setTab('部件状态')}}><small>0{i+1}</small><div><strong>{p.name}</strong></div><i className={current.parts?.[p.id]?'fault':''}/></button>)}{related&&<button className="sensor-related-link" onClick={()=>{selectDevice(related.id);goWorkspace({page:'device',id:related.id,device:related.id})}}><Cable size={16}/>{related.id} ↗</button>}</aside>
 <section className="sensor-model-stage"><SensorScene key={current.id} cinematic family={family} selected={part.id} onSelect={id=>{setPartId(id);setTab('部件状态')}} faultPart={faultPart}/><div className="hardware-flow">{model.flow.map((f,i)=><button key={f} onClick={()=>setPartId(model.parts[Math.min(i,model.parts.length-1)].id)}><small>0{i+1}</small><span>{f}</span>{i<model.flow.length-1&&<b>→</b>}</button>)}</div></section>
 <aside className="sensor-inspector"><div className="sensor-small-heading">部件透视 <Cpu size={15}/></div><h3>{part.name}</h3><span className={`sensor-status ${current.parts?.[part.id]?'fault':''}`}><i/>{current.parts?.[part.id]||'运行正常'}</span><dl>{part.metrics.slice(0,2).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><div className="hardware-health"><div><BatteryCharging size={16}/><small>{family==='micro'?'供电来源':'后备电量'}</small><strong>{family==='micro'?'数采侧供电':`${current.battery}%`}</strong></div><div><Radio size={16}/><small>回传状态</small><strong>{current.status==='离线'?'链路中断':family==='micro'?'有线差分':family==='daq'?'100 Mbps':`${current.signal} dBm`}</strong></div></div><button onClick={()=>setInspectOpen(true)}>部件说明 / 供电与协议 <ArrowUpRight size={14}/></button><button onClick={()=>setDiagnosticsOpen(true)}>诊断与维护 <Activity size={14}/></button></aside></div>}
 {inspectOpen&&<WorkspaceDrawer title={part.name} onClose={()=>setInspectOpen(false)}><p>{part.description}</p><dl className="detail-list">{part.metrics.map(([k,v])=><div className="dl-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>供电与协议</h3><p>{model.power}</p><p>{model.protocol}</p><small>概念结构与参数，非现场设备遥测。</small></WorkspaceDrawer>}
 {diagnosticsOpen&&<WorkspaceDrawer title="诊断与维护" onClose={()=>setDiagnosticsOpen(false)}><div className="hardware-diagnostics"><select aria-label="故障目标部件" value={fault||part.id} onChange={e=>setFault(e.target.value)}>{model.parts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div><button disabled={!can('device')||!!faultPart} onClick={inject}>注入部件故障</button><button disabled={!can('device')||!faultPart} onClick={recover}>恢复并验证</button></div><p className="hardware-feedback" role="status">{notice||'所有操作仅作用于本地演示数据，不会向真实设备下发指令。'}</p></div></WorkspaceDrawer>}
 
 {tab==='实时通道'&&<section className="sensor-channels"><header><h3>{family==='gnss'?'定位输出':family==='micro'?'三轴感应通道':'八路采样通道'}</h3><div className="sensor-channel-pills">{Array.from({length:family==='daq'?8:3},(_,i)=><button aria-pressed={i===channel} key={i} onClick={()=>setChannel(i)}>{family==='gnss'?['E','N','U'][i]:family==='micro'?['X','Y','Z'][i]:`CH-${i+1}`}</button>)}</div><span>{current.rate} · {family==='gnss'?'mm':'mV'}</span><small>{current.status==='离线'?'数据中断':'采集中'}</small></header><InstrumentPlot family={family} frame={state.frame} channel={channel}/></section>}
 {tab==='电源与通信'&&<div className="hardware-bottom"><div><h3>运行链路</h3><dl className="hardware-definition"><dt>供电结构</dt><dd>{model.power}</dd><dt>通信协议</dt><dd>{model.protocol}</dd><dt>信号 / 电量</dt><dd>{family==='micro'?'模拟有线链路 / 无独立电池':family==='daq'?`Ethernet 100 Mbps / UPS ${current.battery}%`:`${current.signal} dBm / ${current.battery}%`}</dd><dt>数据状态</dt><dd>{packet?.status} / {packet?.delay}s</dd><dt>协议字段</dt><dd>设备编号、采样序号、原始值、单位、质量码、校验和</dd></dl></div><div><RecordSummary title="当前数据" filename={`${current.id}-原始报文`} value={packet}/></div></div>}
 {tab==='运行与维护'&&<div className="hardware-bottom"><div><h3>设备操作时间线</h3>{state.audit.filter(a=>a.object===current.id).slice(0,10).map(a=><article className="hardware-log" key={a.id}><span>{a.time}</span><strong>{a.action}</strong><small>{a.actor}</small></article>)}{!state.audit.some(a=>a.object===current.id)&&<p>暂无操作记录，可先进行一次故障与恢复演练。</p>}</div><div><h3>维护检查项目</h3>{['安装耦合与机械固定','接地与屏蔽连续性','供电与连接接口','采样与时间同步','恢复后的数据质量'].map(t=><div className="hardware-check" key={t}><ShieldCheck size={16}/>{t}<span>待现场确认</span></div>)}</div></div>}
 {tab==='历史与证据'&&<DeviceHistory key={current.id} device={current}/>}
 </div>
}

function SensorOrDeviceDetails({deviceId}:{deviceId:string}){const {visibleDevices}=useDemo();const d=visibleDevices.find(d=>d.id===deviceId);return !d?<div className="empty">设备不在当前角色范围内。</div>:supportsTwin(d)?<SensorStudio deviceId={deviceId}/>:<DeviceStudio focus="deviceDetail"/>}
export function SensorModal({deviceId,onClose}:{deviceId:string;onClose:()=>void}){
 return <WorkspaceDrawer title="设备档案" size="wide" onClose={onClose}>{platformFor({id:deviceId})?<PlatformWorkbench key={deviceId} kind={platformFor({id:deviceId})!}/>:<SensorOrDeviceDetails deviceId={deviceId}/>}</WorkspaceDrawer>
}

export function DeviceHub({initialTab='设备总览'}:{initialTab?:string}){
 const {visibleDevices,selectDevice}=useDemo(),[tab,setTab]=useWorkspaceState('device-tab',initialTab,initialTab==='设备总览'),[opened,setOpened]=useState(''),[family,setFamily]=useWorkspaceState('device-family','全部'),[query,setQuery]=useWorkspaceState('device-query','')
 const inspect=(d:Device)=>{selectDevice(d.id);goWorkspace({page:'device',id:d.id,device:d.id})}
 const tabs=['设备总览','设备台账','通道与采集','通信与协议','电源与诊断','维护记录']
 return <div className="device-hub"><div className="product-subnav">{tabs.map(t=><button className={tab===t?'active':''} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {tab==='设备总览'?<><EquipmentGallery/><details className="equipment-index"><summary>设备索引 / {visibleDevices.filter(supportsTwin).length}</summary><div className="filter-row"><input placeholder="搜索设备编号、名称、区域" value={query} onChange={e=>setQuery(e.target.value)}/><select value={family} onChange={e=>setFamily(e.target.value)}><option>全部</option><option>GNSS</option><option>微震节点</option><option>数采板</option></select></div><div className="sensor-device-list">{visibleDevices.filter(d=>supportsTwin(d)&&(family==='全部'||d.type===family)&&`${d.id}${d.name}${d.area}`.includes(query)).map(d=><button key={d.id} onClick={()=>inspect(d)}><div className={`sensor-device-icon ${sensorFamily(d)}`}><Cpu size={23}/></div><div><strong>{d.id}</strong><small>{d.name} / {d.model}</small></div><span className={`status ${d.status==='在线'?'ok':'warn'}`}>{d.status}</span><ArrowUpRight size={14}/></button>)}</div></details></>:tab==='设备台账'?<DeviceStudio onInspect={inspect}/>:tab==='电源与诊断'?<><div className="power-overview">{visibleDevices.filter(supportsTwin).map(d=><button key={d.id} onClick={()=>inspect(d)}><span className="power-card-device"><BatteryCharging size={21}/><strong>{d.id}</strong></span><span className="power-card-reading"><b>{sensorFamily(d)==='micro'?'外接供电':`${d.battery}%`}</b><small className={d.status==='在线'?'ok':'warn'}>{d.status}</small></span></button>)}</div></>:<RecordsStudio key={tab} kind={tab==='通道与采集'?'channelManager':tab==='通信与协议'?'protocolLibrary':'maintenancePlan'}/>}
 {opened&&<SensorModal deviceId={opened} onClose={()=>setOpened('')}/>}</div>
}
