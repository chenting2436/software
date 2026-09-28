import {WorkspaceDrawer} from './WorkspaceDrawer'
import {useState} from 'react'
import { useRef } from 'react'
import { Maximize2 } from 'lucide-react'
import { widgetCatalog } from '../data/catalog'
import { useDemo } from './store'
import {AlgorithmCover} from './AlgorithmCover'
import { AlgorithmStudio } from './AlgorithmStudio'
import { DeviceStudio, DataStudio, RiskStudio, AccountStudio, RecordsStudio } from './BusinessStudio'
import { ExplodedScene } from './ExplodedScene'
import { SolutionStudio } from './SolutionStudio'
import { HardwareSummary } from './DeviceSummary'
import { SensorStudio, DeviceHub } from './SensorStudio'
import { TraceStudio } from './TraceStudio'
import {goWorkspace,moduleRoute} from './navigation'
import {DeviceVisualSummary,DataVisualSummary,RiskVisualSummary,AccountVisualSummary,TraceVisualSummary,TaskVisualSummary,ConfigurationSummary} from './WidgetSummary'
import {sceneKinds} from './sceneCatalog'
import {SceneWidget,SceneWorkbench} from './MissionControl'
import {isWidgetClick,widgetControlSelector} from './widgetInteraction'
export function ModuleWorkbench({kind}:{kind:string}){
 const w=widgetCatalog.find(x=>x.kind===kind)
 if(!w)return <p>组件定义不存在</p>
 if(sceneKinds.includes(kind)||kind==='siteMap')return <SceneWorkbench kind={kind}/>
 if(['gnssTwin','microTwin','daqTwin','deviceExplosion','hardwareHealth'].includes(kind))return <SensorStudio initialFamily={kind==='microTwin'?'micro':kind==='daqTwin'?'daq':'gnss'}/>
 if(['historyPlayback','dataReplay','dataHistory'].includes(kind))return <TraceStudio/>
 if(['evidenceReplay','traceCenter'].includes(kind))return <TraceStudio initialTab="成果证据链"/>
 if(kind==='deviceLedger')return <DeviceHub initialTab="设备台账"/>
 if(kind==='algorithmStatus')return <AlgorithmStudio/>
 if(kind==='snapshotComparison')return <TraceStudio initialTab="快照对比"/>
 if(kind.startsWith('algorithm-'))return <AlgorithmStudio fixedId={kind.replace('algorithm-','')}/>
 if(['siteMap','geologyExplosion','microseismic3d','monitorOverview','projectCommandCenter'].includes(kind))return <div className="business-page"><h2>{w.name}</h2><ExplodedScene events={kind==='microseismic3d'}/><p className="inline-note">离线矿区地质示意模型。点选监测点联动设备台账；拖动旋转，滑动分层滑块查看地下结构。</p></div>
 if(kind==='deviceExplosion')return <div className="business-page"><h2>监测设备结构拆解</h2><ExplodedScene device/></div>
 if(['networkMonitor','offlineAnalysis','deviceHealth'].includes(kind))return <RecordsStudio kind={kind}/>
 if(['deviceLedger','deviceDetail','deviceOnline','deviceDonut','deviceHealth','deviceDataState','monitorPointDetail','offlineAnalysis','networkMonitor'].includes(kind))return <DeviceStudio focus={kind}/>
 if(['rawMessageQuery','parseResult','messageCompare','parseFailure','dataAccessOverview','returnLinkTopology','processingPipeline','dataHistory','dataReplay','simulationCenter','traceCenter','fieldMapping','dataLatency','dataContinuity','quality'].includes(kind))return <DataStudio focus={kind}/>
 if(['riskEventCenter','riskSummary','candidateRisk','evidenceChain','dispositionDispatch','siteFeedback','reviewClosure','riskReport','riskReportArchive','alertLog','dispositionStats'].includes(kind))return <RiskStudio focus={kind}/>
 if(['accountManager','roleMatrix','menuPermission','projectDataScope','rolePreview'].includes(kind))return <AccountStudio/>
 if(['customerSolution','selectedCapabilityList','interfaceDependency','workloadEstimator'].includes(kind))return <SolutionStudio/>
 const aliases:Record<string,string>={waveform:'ps-pick',trend:'gnss-prediction',dispersion:'taup',hvsrCurve:'hvsr',inversionProfile:'section-imaging',riskTrend:'multi-risk',microseismicTrend:'event-attributes',algorithmStatus:'event-location',environmentTrend:'gnss-prediction',radarHeatmap:'slope-stability',insarDeformation:'section-imaging',resultComparison:'surface-inversion',coverageAnalysis:'array-design'}
 if(aliases[kind])return <AlgorithmStudio fixedId={aliases[kind]}/>
 return <RecordsStudio kind={kind}/>
}
export function ModuleModal({kind,onClose}:{kind:string;onClose:()=>void}){
 return <WorkspaceDrawer title={widgetCatalog.find(w=>w.kind===kind)?.name||'组件详情'} size="wide" onClose={onClose}><ModuleWorkbench kind={kind}/></WorkspaceDrawer>
}
const shortTitles:Record<string,string>={siteMap:'矿区',monitorOverview:'矿区',mineDigitalTwin:'矿区',deviceOnline:'设备状态',deviceDonut:'设备状态',deviceLedger:'设备',rawMessageQuery:'回传信号',riskSummary:'预警',riskReport:'闭环进度',accountManager:'账号',trend:'位移趋势',microseismic3d:'震源定位',quality:'数据质量',algorithmStatus:'算法任务',historyPlayback:'回放',evidenceReplay:'证据',snapshotComparison:'快照'}
export function CompactWidget({kind,showHeader=true,editing=false}:{kind:string;showHeader?:boolean;editing?:boolean}){
 const [expanded,setExpanded]=useState(false)
 const pointer=useRef<{x:number;y:number}|null>(null)
 const {state,visibleDevices}=useDemo(),w=widgetCatalog.find(x=>x.kind===kind)
 const alg=kind.startsWith('algorithm-')?kind.slice(10):({microseismic3d:'event-location',waveform:'ps-pick',trend:'gnss-prediction',dispersion:'taup',hvsrCurve:'hvsr',inversionProfile:'section-imaging',riskTrend:'multi-risk',microseismicTrend:'event-attributes',environmentTrend:'gnss-prediction'} as Record<string,string>)[kind]
 const saved=alg?state.tasks.find(t=>t.algorithm===alg&&t.analysis&&(!t.source||visibleDevices.some(d=>d.id===t.source?.deviceId))):undefined
 const target=saved?{page:'algorithm',id:alg,task:saved.id,device:saved.source?.deviceId}:moduleRoute(kind)
 return <div className="compact-widget clean-widget" inert={editing} data-summary-kind={kind} onPointerDown={e=>{pointer.current={x:e.clientX,y:e.clientY}}} onPointerCancel={()=>{pointer.current=null}} onClick={e=>{const node=e.target as Element,start=pointer.current;pointer.current=null;if(!e.currentTarget.contains(node))return;if(!editing&&isWidgetClick(start,{x:e.clientX,y:e.clientY},!!node.closest(widgetControlSelector)))goWorkspace(target)}}>{showHeader&&<header><h3 title={w?.name}>{shortTitles[kind]||w?.name}</h3><button aria-label={`打开${w?.name}`} title={`打开${w?.name}`} onClick={()=>setExpanded(true)}><Maximize2 size={14}/></button></header>}<div className="compact-body">
 {sceneKinds.includes(kind)||kind==='siteMap'?<SceneWidget kind={kind} onOpen={()=>goWorkspace(target)}/>:kind==='algorithmStatus'?<TaskVisualSummary/>:['gnssTwin','microTwin','daqTwin','deviceExplosion'].includes(kind)?<HardwareSummary family={kind==='microTwin'?'micro':kind==='daqTwin'?'daq':'gnss'} onOpen={()=>goWorkspace(target)}/>:['historyPlayback','evidenceReplay','snapshotComparison','dataHistory','dataReplay','traceCenter'].includes(kind)?<TraceVisualSummary/>:alg?<div className="lab-compact summary-plot-action board-algorithm-visual"><button className="quiet-button summary-plot-trigger" aria-label={`查看${w?.name}成果`} onClick={()=>goWorkspace(target)}/><AlgorithmCover id={alg}/>{saved?.analysis?.result?.metrics[0]&&<div className="board-algorithm-reading"><span>{saved.analysis.result.metrics[0].label}</span><strong>{saved.analysis.result.metrics[0].value}<small>{saved.analysis.result.metrics[0].unit}</small></strong></div>}</div>:['geologyExplosion','radarHeatmap','insarDeformation'].includes(kind)?<ExplodedScene compact/>:w?.category==='设备管理'?<DeviceVisualSummary kind={kind}/>:w?.category==='数据管理'?<DataVisualSummary kind={kind}/>:w?.category==='预警闭环'?<RiskVisualSummary kind={kind}/>:w?.category==='账号权限'?<AccountVisualSummary/>:<ConfigurationSummary kind={kind}/>}
 </div>{expanded&&<WorkspaceDrawer title={w?.name||'组件详情'} size="wide" onClose={()=>setExpanded(false)}><div className="component-open-row"><button onClick={()=>{setExpanded(false);goWorkspace(target)}}>进入完整工作区 ↗</button></div><ModuleWorkbench kind={kind}/></WorkspaceDrawer>}</div>
}
