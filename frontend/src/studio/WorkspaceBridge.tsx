import {hardwareModels,sensorFamily} from './hardware'
import {ArrowLeft,ArrowRight,Database,History,Orbit,Radio} from 'lucide-react'
import {useDemo} from './store'
import {goWorkspace,type WorkspaceRoute} from './navigation'
import {platformFor} from './sceneCatalog'
import {PlatformWorkbench} from './PlatformWorkbench'
import {SensorStudio} from './SensorStudio'
import {DeviceStudio} from './BusinessStudio'
import {supportsTwin} from './hardware'
export function DeviceWorkspace({id}:{id:string}){const {visibleDevices}=useDemo(),device=visibleDevices.find(d=>d.id===id);if(!device)return <div className="empty">设备不存在或不在当前角色范围内。</div>;const kind=platformFor(device);return <><div className="workspace-device-nav"><button onClick={()=>goWorkspace({page:'device'})}><ArrowLeft size={14}/>设备总览</button><h1>{supportsTwin(device)?hardwareModels[sensorFamily(device)].title:device.name}</h1><span className="sensor-status"><i/>{device.status}</span><WorkspaceBridge route={{page:'device',device:id}}/></div>{kind?<PlatformWorkbench key={id} kind={kind}/>:supportsTwin(device)?<SensorStudio deviceId={id} showTitle={false}/>:<DeviceStudio focus="deviceDetail"/>}</>}
export function WorkspaceBridge({route}:{route:WorkspaceRoute}){
 const {state,visibleDevices}=useDemo(),task=state.tasks.find(t=>t.id===route.task),id=task?.analysis?task.source?.deviceId:route.device
 if(!id||!visibleDevices.some(d=>d.id===id))return null
 const algorithm=id.startsWith('GNSS')?'gnss-prediction':/^(MS|DAQ|DEEP)/.test(id)?'event-detection':undefined
 return <div className="workspace-bridge">{route.page!=='device'&&<span>{id}</span>}{[{page:'device',label:'设备档案',icon:Radio},{page:'data',label:'查看采集数据',icon:Database},{page:'algorithm',label:'进入分析',icon:Orbit},{page:'trace',label:'历史回溯',icon:History}].filter(r=>r.page!==route.page).map(r=><button key={r.page} aria-label={r.label} title={r.label} onClick={()=>goWorkspace({page:r.page,id:r.page==='device'?id:r.page==='algorithm'?algorithm:undefined,device:id,task:r.page==='trace'?route.task:undefined})}><r.icon size={14}/></button>)}</div>
}
