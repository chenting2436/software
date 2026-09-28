import {RotationControl} from './RotationControl'
import {useLocalAuth} from './LocalLogin'
import {PRODUCT_VERSION} from './localSession'
import {useEffect, useRef, useState, type ReactNode} from 'react'
import {ArrowLeft, ArrowUpRight, BatteryMedium, ChevronDown, CircleHelp, Search, Layers3, LocateFixed, Map, Mountain, Play, Pause, Radio, Rotate3D, X, UserRound, Ellipsis, Monitor, Bell} from 'lucide-react'
import {useDemo, roles, type Role} from './store'
import {goWorkspace} from './navigation'
import {MineScene, type SceneLayers} from './MineScene'
import {platformFor, platforms, platformKinds, platformTelemetry, sceneTime} from './sceneCatalog'
import {EquipmentIcon} from './WidgetSummary'
import {useWorkspaceAppearance} from './ScientificUI'

export function CinematicShell({page,children,onSearch}:{page:string;children:ReactNode;onSearch?:(value:string)=>void}){
 const {state,control}=useDemo(),appearance=useWorkspaceAppearance(),auth=useLocalAuth()
 const header=useRef<HTMLElement>(null),[search,setSearch]=useState('')
 useEffect(()=>{header.current?.querySelectorAll('details').forEach(d=>d.open=false)},[page])
 useEffect(()=>{const menus=()=>document.querySelectorAll<HTMLDetailsElement>('.cinema-menu[open], .lab-more[open]');const close=(e:KeyboardEvent)=>{if(e.key==='Escape')menus().forEach(d=>d.open=false)};const outside=(e:PointerEvent)=>menus().forEach(d=>{if(!d.contains(e.target as Node))d.open=false});document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside)}},[])
 return <div className={`studio cinematic-shell cinematic-${page} ${appearance==='scientific'?'scientific-ui scientific-shell':''}`}>
  <header className="cinema-nav" ref={header}>
   <button className="cinema-brand" onClick={()=>goWorkspace({page:'overview'})} aria-label="矿大 · 返回矿区总览"><Mountain size={28}/><strong>矿大</strong></button>
   <nav aria-label="核心业务导航">{[['overview','总览','矿区总览'],['device','设备','设备管理'],['data','数据','数据管理'],['algorithm','算法','算法分析'],['trace','回溯','数据回溯']].map(([key,label,accessible])=><button key={key} aria-label={accessible} aria-current={page===key?'page':undefined} onClick={()=>goWorkspace({page:key})}>{label}</button>)}</nav>
   <div className="cinema-nav-end"><details className="cinema-menu cinema-search"><summary aria-label="搜索功能" title="搜索功能"><Search size={16}/></summary><div><form onSubmit={e=>{e.preventDefault();onSearch?.(search);header.current?.querySelectorAll('details').forEach(d=>d.open=false)}}><label>搜索功能<input autoComplete="off" aria-label="全局功能搜索" placeholder="设备、算法、组件…" value={search} onChange={e=>setSearch(e.target.value)}/></label><button type="submit">查找<ArrowUpRight size={14}/></button></form></div></details><details className="cinema-menu"><summary aria-label="更多工作台功能" title="更多"><Ellipsis size={18}/></summary><div>{[['designer','大屏编排'],['risk','预警闭环'],['library','全部功能'],['solution','客户方案'],['workflow','流程编排'],['account','账号管理'],['config','配置与审计']].map(([key,label])=><button key={key} aria-current={page===key?'page':undefined} onClick={()=>{goWorkspace({page:key});header.current?.querySelectorAll('details').forEach(d=>d.open=false)}}>{label}<ArrowUpRight size={12}/></button>)}</div></details><details className="cinema-menu cinema-account"><summary aria-label="登录管理" title={auth.user}><UserRound size={17}/></summary><div><strong>{auth.user}</strong><button onClick={()=>goWorkspace({page:'account'})}>账号管理<ArrowUpRight size={13}/></button><button onClick={auth.logout}>退出登录</button></div></details><button className="cinema-screen-link" onClick={()=>goWorkspace({page:'preview'})}><Monitor size={15}/>大屏</button><details className="cinema-menu cinema-about"><summary aria-label="版本信息" title="版本信息"><CircleHelp size={16}/></summary><div>V{PRODUCT_VERSION}</div></details></div>
  </header>
  {state.role!=='项目管理员'&&<div className="role-preview-banner"><span>角色预览 · {state.role}</span><button onClick={()=>control({role:'项目管理员'})}>退出预览</button></div>}<main className="cinema-main">{children}</main>
 </div>
}

export function CinematicOverview(){
 const {state,visibleDevices,selectDevice,control,storageError}=useDemo()
 const [layers,setLayers]=useState<SceneLayers>({paths:true,coverage:false,underground:false,sensors:true}),[focus,setFocus]=useState(0),[inspecting,setInspecting]=useState(false),[region,setRegion]=useState(false)
 const selected=visibleDevices.find(d=>d.id===state.selectedDevice)||visibleDevices[0],kind=platformFor(selected),telemetry=kind?platformTelemetry(kind,state.frame,selected):null
 const choose=(id:string)=>{selectDevice(id);setInspecting(true)}
 const online=visibleDevices.filter(d=>d.status==='在线').length,risks=state.risks.filter(r=>r.stage<4&&visibleDevices.some(d=>d.id===r.device))
 return <section className={`cinema-overview ${inspecting?'is-inspecting':''}`} aria-label="矿山安全监测总览">
  <div className="cinema-world"><MineScene cinematic terrainStyle={region?'elevation':'natural'} auto devices={visibleDevices} selected={selected?.id||''} frame={state.frame} onSelect={choose} layers={layers} focus={focus}/></div>
  <div className="cinema-vignette"/>
  <div className="overview-status-rail"><button title="设备状态" onClick={()=>goWorkspace({page:'device'})}><Radio size={15}/><b>{online}<small> / {visibleDevices.length}</small></b><span>在线</span></button><button title="预警事件" onClick={()=>goWorkspace({page:'risk'})}><Bell size={15}/><b className={risks.length?'is-warning':''}>{risks.length}</b><span>预警</span></button></div>
  <div className="cinema-scene-tools"><button aria-pressed={region} onClick={()=>{setRegion(v=>!v);setInspecting(false);setFocus(0)}} title="切换本地高程模型"><Map size={16}/><span>{region?'地貌视图':'地形高程'}</span></button>{<><button aria-pressed={layers.underground} onClick={()=>setLayers(v=>({...v,underground:!v.underground}))}><Layers3 size={16}/><span>{layers.underground?'返回地表':'地下结构'}</span></button><RotationControl/></>}</div>
  {region&&<div className="terrain-elevation-key"><span>相对高程 / m</span><i/><div><span>−70</span><span>40</span><span>150</span><span>230</span></div></div>}
  {inspecting&&selected&&<aside className="cinema-inspector floating-device-status" aria-label="选中设备状态" onKeyDown={e=>{if(e.key==='Escape')setInspecting(false)}}><div className="cinema-inspector-id"><span>{selected.id}</span><button onClick={()=>setInspecting(false)} aria-label="关闭设备状态"><X size={16}/></button></div><h2>{selected.name}</h2><span className={`cinema-status ${selected.status==='在线'?'':'is-warning'}`}><i/>{selected.status}</span><div className="cinema-readings"><div><BatteryMedium size={18}/><strong>{selected.type==='微震节点'?'有线':`${telemetry?.battery??selected.battery}%`}</strong><small>供电</small></div><div><Radio size={17}/><strong>{selected.status==='离线'?'中断':`${telemetry?.signal??selected.signal}`}</strong><small>{selected.status==='离线'?'通信链路':'dBm'}</small></div></div><div className="cinema-inspector-actions"><button onClick={()=>setFocus(v=>v+1)}><LocateFixed size={15}/>定位</button><button className="cinema-light-button" onClick={()=>goWorkspace({page:'device',id:selected.id,device:selected.id})}>设备详情<ArrowUpRight size={14}/></button></div><button className="cinema-text-link" onClick={()=>goWorkspace({page:'data',device:selected.id})}>查看关联数据<ArrowUpRight size={13}/></button></aside>}
  <div className="cinema-bottom"><div className="cinema-device-dock" aria-label="空天地深设备">{platformKinds.map(k=>{const d=visibleDevices.find(d=>d.id===platforms[k].id);return d&&<button key={k} aria-pressed={inspecting&&selected?.id===d.id} onClick={()=>choose(d.id)}><EquipmentIcon type={d.type} size={19}/><span>{k==='satellite'?'卫星':k==='drone'?'无人机':k==='rover'?'雷达车':'深地站'}</span></button>})}</div><div className="cinema-bottom-line"><div className="cinema-replay"><button onClick={()=>control({playing:!state.playing,frame:state.frame>=120?0:state.frame})} aria-label={state.playing?'暂停工况回放':'播放工况回放'}>{state.playing?<Pause size={13}/>:<Play size={13}/>}</button><time>{sceneTime(state.frame)}</time><input aria-label="矿区工况时间" type="range" min="0" max="120" value={state.frame} onChange={e=>control({frame:+e.target.value,playing:false})}/></div><button className="cinema-analysis-entry" onClick={()=>goWorkspace({page:'algorithm',id:'phase-shift-active'})}>频散分析<ArrowUpRight size={13}/></button></div></div>
  {storageError&&<p className="cinema-storage-error" role="alert">{storageError}</p>}
 </section>
}

export function CinemaBack({label='返回矿区',onClick}:{label?:string;onClick?:()=>void}){return <button className="cinema-back" onClick={onClick||(()=>goWorkspace({page:'overview'}))}><ArrowLeft size={14}/>{label}</button>}
