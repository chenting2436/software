import {RotationControl} from './RotationControl'
import {WorkspaceDrawer} from './WorkspaceDrawer'
import {useState} from 'react'
import {ArrowUpRight, BatteryMedium, Box, Radio, Rotate3D, Layers3, Camera, History} from 'lucide-react'
import {useDemo} from './store'
import {DeviceModelView} from './DeviceModelView'
import {InspectionFeed,TelemetryChart,ImageComparison} from './SceneMedia'
import {platforms,platformTelemetry,observationFrame,type PlatformKind} from './sceneCatalog'
import {goWorkspace} from './navigation'
import {CinemaBack} from './CinematicOverview'

export function DeviceShowroom({initialTab,kind='drone'}:{initialTab?:string;kind?:PlatformKind}){
 const {state,visibleDevices}=useDemo(),spec=platforms[kind],device=visibleDevices.find(d=>d.id===spec.id)
 const [part,setPart]=useState(spec.parts[0].id),[explode,setExplode]=useState(0),[panel,setPanel]=useState(initialTab==='monitor'?'monitor':'')

 if(!device)return <div className="cinema-not-found"><CinemaBack/><h1>该设备不在当前角色范围内</h1></div>
 const current=spec.parts.find(p=>p.id===part)!,telemetry=platformTelemetry(kind,state.frame,device)
 const readings:Record<string,[string,string,string]>={airframe:['固定翼','垂直起降','复合式巡检平台'],rotor:['04','动力单元','独立旋翼机构'],camera:['可见光','光电云台','巡检视景'],battery:[String(telemetry.battery),'%','剩余电量'],avionics:[device.status==='离线'?'中断':String(telemetry.signal),'dBm','MAVLink · RTK']}
 const reading=kind==='drone'?readings[part]:[part==='battery'?String(telemetry.battery):current.value,part==='battery'?'%':current.unit,spec.protocol.replace('（样例）','')]
 const titles:Record<PlatformKind,[string,string]>={satellite:['卫星遥感','广域监测'],drone:['无人机','航空巡检'],rover:['地面雷达','移动巡检'],deep:['深地感知','立体探测']}
 return <section className="device-showroom" aria-label={`${spec.name}数字档案`}>
  <div className="showroom-stage"><DeviceModelView kind={kind} cinematic selected={part} onSelect={setPart} explode={explode} auto/></div>
  <div className="showroom-heading"><CinemaBack label="设备总览" onClick={()=>goWorkspace({page:'device'})}/><h1>{titles[kind][0]}</h1><span className={`cinema-status ${telemetry.online?'':'is-warning'}`}><i/>{device.status}</span></div>
  <nav className="showroom-parts" aria-label="选择设备部件">{spec.parts.map((p,i)=><button key={p.id} aria-pressed={part===p.id} onClick={()=>setPart(p.id)}><small>{String(i+1).padStart(2,'0')}</small><span>{p.name}</span><span className="showroom-part-line"/></button>)}</nav>
  <aside className="showroom-reading" aria-live="polite"><h2>{current.name}</h2><div className="showroom-measure"><strong>{reading[0]}</strong><span>{reading[1]}</span></div><small>{reading[2]}</small><div className="showroom-health"><span><BatteryMedium size={15}/>{telemetry.battery}%</span><span><Radio size={15}/>{telemetry.online?'链路连通':'链路中断'}</span></div><div className="showroom-signal"><TelemetryChart kind={kind} frame={observationFrame(device,state.frame)}/></div><button onClick={()=>setPanel('monitor')}><Camera size={15}/>{kind==='satellite'?'遥感影像':'巡检画面'}<ArrowUpRight size={14}/></button><button onClick={()=>goWorkspace({page:'data',device:device.id})}>关联采集数据<ArrowUpRight size={14}/></button></aside>
  <footer className="showroom-bottom"><div className="showroom-controls"><RotationControl/><button aria-pressed={explode>0} onClick={()=>setExplode(v=>v?0:1)}><Layers3 size={16}/>{explode>0?'收拢结构':'展开结构'}</button></div><div className="showroom-related"><button onClick={()=>goWorkspace({page:'trace',device:device.id})}><History size={14}/>历史回溯</button><button onClick={()=>goWorkspace({page:'workspace',id:`${kind}Twin`})}><Box size={14}/>完整设备工作区<ArrowUpRight size={13}/></button></div></footer>
  {panel==='monitor'&&<WorkspaceDrawer title={kind==='satellite'?'影像对照':'巡检画面'} size="media" className="inspection-dialog" onClose={()=>setPanel('')}>{kind==='satellite'?<ImageComparison/>:<InspectionFeed kind={kind} devices={visibleDevices} frame={state.frame}/>}</WorkspaceDrawer>}
 </section>
}
