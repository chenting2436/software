import type { Device } from './store'
export type SensorFamily='gnss'|'micro'|'daq'
export interface HardwarePart { id:string; name:string; description:string; shape:'box'|'cylinder'|'pcb'; width:number; depth:number; height:number; z:number; color:string; metrics:[string,string][] }
export interface HardwareModel { family:SensorFamily; title:string; model:string; protocol:string; power:string; parts:HardwarePart[]; flow:string[] }
const part=(id:string,name:string,description:string,shape:HardwarePart['shape'],width:number,depth:number,height:number,z:number,color:string,metrics:[string,string][]):HardwarePart=>({id,name,description,shape,width,depth,height,z,color,metrics})
export const hardwareModels:Record<SensorFamily,HardwareModel>={
 gnss:{family:'gnss',title:'GNSS 位移监测终端',model:'KD-GNSS G2 / 概念结构',protocol:'MQTT / TCP · 4G 回传',power:'12 V / 内置后备电池',flow:['卫星信号','多频接收','解算与时钟','数据封装','4G 回传'],parts:[
  part('antenna','多频天线罩','接收多星座卫星信号，提供定位与授时输入。','cylinder',93,93,18,100,'#d4e1e8',[['卫星星座','GPS / BDS / Galileo'],['可见卫星','28 颗（样例）'],['载噪比','42.6 dB·Hz']]),
  part('rf','射频接收单元','信号滤波与低噪声放大，输出数字基带信号。','pcb',76,68,5,81,'#486e69',[['频点','B1 / B2 / L1 / L2'],['射频温度','36.2 °C'],['通道状态','锁定']]),
  part('clock','定位解算主板','进行样例定位解算与 PPS 时间同步。','pcb',78,70,7,62,'#286f79',[['解状态','固定解（样例）'],['授时状态','PPS 锁定'],['输出频率','1 Hz']]),
  part('communication','通信模块','封装标准报文，进行心跳、缓存补传及回执管理。','pcb',72,66,8,41,'#314f77',[['协议','MQTT / TCP'],['心跳周期','30 s'],['重传队列','0 条']]),
  part('power','电池与电源管理','监测电池电量、电压及负载，提供后备供电。','box',74,63,15,17,'#4c647b',[['额定电压','12 V'],['样例功耗','3.6 W'],['电源保护','过压 / 欠压']]),
  part('housing','安装底座','提供固定、接地、防护与对外连接接口。','cylinder',94,94,12,0,'#7692a7',[['安装方式','基座固定'],['防护设计','密封结构示意'],['安装倾角','0.3°（样例）']]),
 ]},
 micro:{family:'micro',title:'三分量微震传感器',model:'KD-MS S3 / 独立探头',protocol:'模拟差分信号 → 独立数采板',power:'无独立电池 / 由数采侧供电',flow:['岩体微振动','三轴感应','信号调理','屏蔽线缆','数采输入'],parts:[
  part('housing','密封上盖','保护内部敏感元件，隔离外部环境影响。','cylinder',62,62,13,108,'#97afbc',[['结构类型','密封式概念探头'],['环境温度','24.8 °C'],['安装状态','已耦合']]),
  part('sensor-z','垂向 Z 感应单元','展示磁体与线圈形成的垂向振动检测结构。','cylinder',45,45,23,80,'#bc8e57',[['方向','Z / 垂向'],['噪声样例','0.06 mV'],['通道状态','正常']]),
  part('sensor-x','水平 X 感应单元','展示水平方向的机械敏感单元。','cylinder',44,44,20,57,'#ba945f',[['方向','X / 水平'],['噪声样例','0.08 mV'],['耦合状态','稳定']]),
  part('sensor-y','水平 Y 感应单元','与 X、Z 共同形成三分量观测。','cylinder',44,44,20,34,'#b98d57',[['方向','Y / 水平'],['噪声样例','0.07 mV'],['有效通道','3 / 3']]),
  part('conditioning','信号调理与接口','对微弱信号进行调理，并通过屏蔽电缆连接数采。','pcb',48,44,6,17,'#2a7f70',[['输出类型','模拟差分'],['屏蔽状态','已接地'],['接入对象','独立 DAQ 数采板']]),
  part('mount','耦合底座','通过机械耦合将岩体振动传递到感应单元。','cylinder',65,65,13,0,'#597486',[['安装方式','孔内 / 基岩耦合示意'],['连接方式','屏蔽电缆'],['供电说明','无探头独立电池']]),
 ]},
 daq:{family:'daq',title:'多通道数据采集板',model:'KD-DAQ D8 / 独立采集设备',protocol:'TCP / MQTT · Ethernet',power:'24 V DC / 外部后备电源',flow:['模拟输入','调理与滤波','ADC 采样','同步时间戳','缓存与回传'],parts:[
  part('shield','屏蔽与散热组件','为模拟与数字区域提供电磁屏蔽及散热。','box',126,84,6,63,'#9aafbd',[['屏蔽分区','模拟 / 数字'],['板卡温度','38.6 °C'],['散热状态','正常']]),
  part('adc','ADC 与模拟前端','展示多通道同步采样和抗混叠滤波。','pcb',116,78,7,43,'#277c6d',[['输入通道','8 路'],['样例采样率','2000 Hz'],['分辨率设计','24 bit（概念）']]),
  part('clock','同步时钟单元','为不同监测通道分配统一时间戳。','pcb',110,75,6,29,'#317a8b',[['时钟源','GNSS PPS / 本地'],['同步偏差','±0.8 μs（样例）'],['锁定状态','已锁定']]),
  part('communication','处理器与数据缓存','完成数据封装、断网缓存、补传和链路回执。','pcb',118,78,8,15,'#2e625c',[['回传协议','TCP / MQTT'],['样例缓存','18.2 MB'],['丢包样例','0.00%']]),
  part('power','电源与隔离底板','将外部供电转换为各部件所需电压。','box',132,88,8,0,'#466277',[['输入供电','24 V DC'],['样例功耗','8.4 W'],['后备电源','外部 UPS / 电池']]),
 ]},
}
export function sensorFamily(device:Pick<Device,'type'>):SensorFamily{return device.type==='数采板'?'daq':device.type.includes('微震')?'micro':'gnss'}
export const supportsTwin=(d:Pick<Device,'type'>)=>['GNSS','微震节点','微震传感器','数采板'].includes(d.type)
export function seedAcquisitionDevices():Device[]{return ['北帮','南帮','东帮'].map((area,i)=>({id:`DAQ-${101+i}`,name:`${area}独立数采板 ${i+1}`,type:'数采板',area,status:'在线',battery:100,signal:-48,rate:'2000 Hz',x:92,y:-70+i*70,owner:['陈工','李工','王工'][i],model:'KD-DAQ D8',linkedDevice:['MS-002','MS-010','MS-018'][i]}))}
