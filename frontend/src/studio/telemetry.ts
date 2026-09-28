import {observationValue} from './demoSignals'
import type { Device, Task, Risk } from './store'
export interface Packet { id:string; device:string; area:string; protocol:string; raw:number; value:number; metric:string; unit:string; status:string; delay:number; trace:string; frame:number; mapping:number }
export interface SourceRef { deviceId:string; frame:number; mapping:number; packet:Packet; inputLabel:string }
export interface HistorySnapshot { id:string; time:string; label:string; frame:number; devices:Device[]; packets:Packet[]; tasks:Task[]; risks:Risk[]; actor:string }
export function packetData(devices:Device[],frame:number,mapping:number):Packet[]{return devices.map(d=>{
 const i=Math.max(0,(Number(d.id.match(/\d+$/)?.[0])||1)-1)
 const daq=d.type==='数采板',micro=d.type.includes('微震'),special:Record<string,[string,string,string,number]>={'巡检无人机':['MAVLink','离地高度','m',126+8*Math.sin(frame/13)],'雷达巡检车':['TCP / Radar','巡检速度','m/s',3+Math.sin(frame/18)],'遥感卫星':['FILE','观测任务进度','%',Math.max(0,Math.min(100,frame/120*100))],'深地感知站':['MQTT','关联探头幅值','mV',.2+Math.abs(Math.sin(frame/8))*.13]},p=special[d.type],base=observationValue(d.type,i,frame)
 return {id:`MSG-${d.id}-F${String(frame).padStart(3,'0')}`,device:d.id,area:d.area,protocol:p?p[0]:micro?'模拟差分 / DAQ':daq?'TCP':d.type==='GNSS'?'MQTT':['HTTP','FILE'][i%2],raw:Math.round(base*1000),value:Number((base*mapping).toFixed(3)),metric:p?p[1]:micro?'振动幅值':daq?'板卡温度':d.type==='气象站'?'雨量':'累计位移',unit:p?p[2]:micro?'mV':daq?'°C':'mm',status:d.status==='离线'?'中断':i===7&&mapping===1?'解析失败':'已入库',delay:d.status==='离线'?42:Number((.3+i%5*.2).toFixed(1)),trace:`TRACE-${d.id}-F${String(frame).padStart(3,'0')}`,frame,mapping}
})}
export const frameTime=(frame:number)=>{const seconds=9*3600+Math.max(0,Math.floor(frame))*30;return `${String(Math.floor(seconds/3600)%24).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
export function historicalDevices(base:Device[],frame:number):Device[]{return base.map((d,i):Device=>({...d,status:i===0&&frame>=40&&frame<56?'离线':i===1&&frame>=78&&frame<90?'待维护':'在线',battery:i===0&&frame>=70?18:Math.max(45,95-Math.floor(frame/6)-i%6),signal:i===0&&frame>=40&&frame<56?-110:-56-i%20,parts:i===1&&frame>=78&&frame<90?{'sensor-z':'噪声异常'}:{}}))}
export const replayEvents=[{frame:0,title:'监测开始',detail:'设备与采样通道稳定运行'}, {frame:40,title:'GNSS 链路中断',detail:'心跳丢失，原始数据中断'}, {frame:56,title:'通信恢复',detail:'恢复回传，补传数据进入质量检查'}, {frame:70,title:'低电量工况',detail:'后备电源余量低于样例门槛'}, {frame:78,title:'微震通道异常',detail:'Z 向噪声升高，进入人工复核'}, {frame:90,title:'通道恢复',detail:'校准完成，三分量采集恢复'}, {frame:112,title:'成果复核',detail:'核对数据质量、算法版本与处置记录'}]
export function sourceFor(task:Pick<Task,'algorithm'|'input'|'source'>,devices:Device[],frame:number,mapping:number):SourceRef|null{
 if(task.source)return task.source
 if(!task.input)return null
 const direct=devices.find(d=>d.id===task.input),family=/gnss|multi-risk|slope/.test(task.algorithm)?'GNSS':'微震节点'
 const area=task.input.includes('南帮')?'南帮':task.input.includes('东帮')?'东帮':'北帮'
 const device=direct||devices.find(d=>d.type===family&&d.area===area)||devices.find(d=>d.type===family)||devices[0]
 if(!device)return null
 const packet=packetData(devices,frame,mapping).find(p=>p.device===device.id)!
 return {deviceId:device.id,frame,mapping,packet,inputLabel:task.input}
}
