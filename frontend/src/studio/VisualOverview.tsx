import {ArrowUpRight,Radio,Database,Orbit,History,MonitorPlay} from 'lucide-react'
import {useDemo,PacketData} from './store'
import {MissionControl} from './MissionControl'
import {PlatformGallery} from './PlatformWorkbench'
export function VisualOverview({onNavigate,onSensor}:{onNavigate:(key:string)=>void;onSensor:(id:string)=>void}){
 const {state,visibleDevices}=useDemo(),packets=PacketData(visibleDevices,state.frame,state.mapping)
 const entries=[{key:'device',title:'设备管理',icon:Radio,count:visibleDevices.length,unit:'台设备',sub:'设备 · 部件 · 链路'},{key:'data',title:'数据管理',icon:Database,count:packets.filter(p=>p.status==='已入库').length,unit:'路入库',sub:'回传 · 解析 · 质量'},{key:'algorithm',title:'算法中心',icon:Orbit,count:31,unit:'项算法',sub:'输入 · 过程 · 成果'},{key:'trace',title:'数据回溯',icon:History,count:state.history.length,unit:'份归档',sub:'历史 · 对照 · 证据'}]
 return <div className="visual-overview"><div className="visual-page-heading"><div><small>矿大 · 土行孙 V2.3</small><h1>矿山全域感知工作站</h1></div><button className="primary" onClick={()=>onNavigate('preview')}><MonitorPlay size={16}/>打开综合大屏</button></div><div className="visual-module-nav">{entries.map((e,i)=><button key={e.key} onClick={()=>onNavigate(e.key)}><e.icon size={22}/><div><small>0{i+1} / {e.sub}</small><h2>{e.title}</h2></div><strong>{e.count}<small>{e.unit}</small></strong><ArrowUpRight size={15}/></button>)}</div><MissionControl onNavigate={onNavigate}/><div className="visual-section-heading"><div><small>DEVICE COLLECTION</small><h2>四域设备 · 独立数字档案</h2></div><button onClick={()=>onNavigate('device')}>全部设备与传感器 <ArrowUpRight size={14}/></button></div><PlatformGallery onOpen={onSensor}/></div>
}
