import {RotationControl} from './RotationControl'
import {useState} from 'react'
import {ArrowUpRight, BatteryMedium, Radio, Rotate3D, Layers3} from 'lucide-react'
import {useDemo} from './store'
import {DeviceModelView} from './DeviceModelView'
import {SensorScene} from './SensorScene'
import {platforms,platformKinds,type PlatformKind} from './sceneCatalog'
import {hardwareModels,supportsTwin,sensorFamily,type SensorFamily} from './hardware'
import {goWorkspace} from './navigation'

const families = [...platformKinds,'gnss','micro','daq'] as const
type Family = typeof families[number]
const shortNames:Record<Family,string>={satellite:'卫星遥感',drone:'无人机',rover:'地面雷达',deep:'深地感知',gnss:'GNSS 终端',micro:'微震传感器',daq:'独立数采板'}
const letters:Record<Family,string>={satellite:'空',drone:'天',rover:'地',deep:'深',gnss:'GNSS',micro:'MS',daq:'DAQ'}

export function EquipmentGallery(){
 const {visibleDevices,selectDevice}=useDemo()
 const [family,setFamily]=useState<Family>('drone'),[deviceId,setDeviceId]=useState(''),[part,setPart]=useState(''),[explode,setExplode]=useState(0)
 const devicesFor=(f:Family)=>visibleDevices.filter(d=>platformKinds.includes(f as PlatformKind)?d.id===platforms[f as PlatformKind].id:supportsTwin(d)&&sensorFamily(d)===f)
 const available=families.filter(f=>devicesFor(f).length),chosen=available.includes(family)?family:available[0]
 if(!chosen)return <div className="empty">当前角色下没有设备</div>
 const devices=devicesFor(chosen),device=devices.find(d=>d.id===deviceId)||devices[0],isPlatform=platformKinds.includes(chosen as PlatformKind),spec=isPlatform?platforms[chosen as PlatformKind]:hardwareModels[chosen as SensorFamily]
 const open=()=>{selectDevice(device.id);goWorkspace({page:'device',id:device.id,device:device.id})}
 return <section className={`equipment-gallery ${isPlatform?'':'equipment-sensor-gallery'}`} aria-label="设备展厅">
  <div className="equipment-model">{isPlatform?<DeviceModelView key={chosen} kind={chosen as PlatformKind} cinematic auto explode={explode} selected={part} onSelect={id=>{setPart(id)}}/>:<SensorScene key={chosen} family={chosen as SensorFamily} cinematic selected={part} onSelect={setPart}/>}</div>
  <nav className="equipment-selector" aria-label="设备类型">{available.map((f,i)=><button key={f} aria-pressed={chosen===f} onClick={()=>{setFamily(f);setPart('');setDeviceId('');setExplode(0)}}><small>{String(i+1).padStart(2,'0')}</small><span>{shortNames[f]}</span><b>{devicesFor(f).length.toString().padStart(2,'0')}</b></button>)}</nav>
  <div className="equipment-heading"><small>{letters[chosen]} / {device.id}</small><h2>{shortNames[chosen]}</h2><span className={`cinema-status ${device.status==='在线'?'':'is-warning'}`}><i/>{device.status}</span></div>
  <aside className="equipment-readout"><span>运行状态</span><div><BatteryMedium size={17}/><strong>{chosen==='micro'?'有线供电':`${device.battery}%`}</strong><small>供电</small></div><div><Radio size={17}/><strong>{device.status==='离线'?'中断':`${device.signal}`}</strong><small>{device.status==='离线'?'通信链路':'dBm'}</small></div>{part&&<p className="equipment-current-part">{spec.parts.find(p=>p.id===part)?.name}</p>}<label>当前设备<select aria-label="展厅设备" value={device.id} onChange={e=>setDeviceId(e.target.value)}>{devices.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select></label><button className="primary" onClick={open}>设备档案<ArrowUpRight size={15}/></button><button onClick={()=>goWorkspace({page:'data',device:device.id})}>采集数据<ArrowUpRight size={15}/></button></aside>
  <footer className="equipment-footer"><span>{devices.length} 台设备 · {spec.parts.length} 个部件</span>{isPlatform&&<div><RotationControl/><button aria-pressed={explode>0} onClick={()=>setExplode(v=>v?0:1)}><Layers3 size={15}/>{explode?'收拢':'拆解'}</button></div>}<small>参考外观 / 概念结构</small></footer>
 </section>
}
