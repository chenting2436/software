import type {ScienceIconKind} from './DesktopControls'
import type {Figure} from './analysisEngine'

export interface AlgorithmDesktopProfile {
  code:string
  menu:string
  views:[string,string,string]
  icons:[ScienceIconKind,ScienceIconKind,ScienceIconKind]
}
const profile=(code:string,menu:string,views:AlgorithmDesktopProfile['views'],icons:AlgorithmDesktopProfile['icons']):AlgorithmDesktopProfile=>({code,menu,views,icons})
// Explicit, domain-specific workspaces. The view order follows the saved engine figures.
export const algorithmDesktopProfiles:Record<string,AlgorithmDesktopProfile>={
 'shot-gather':profile('SHOT','炮集整理',['炮集波形','测线炮点','振幅谱'],['wave','array','spectrum']),
 taup:profile('TAU-P','慢度扫描',['τ-p 能量','输入炮集','扫描响应'],['spectrum','wave','pick']),
 fk:profile('F-K','频率波数',['f-k 能量谱','输入炮集','通道频谱'],['spectrum','wave','pick']),
 'phase-shift-active':profile('PHASE SHIFT','相移分析',['频散能量','能量脊线','输入炮集'],['spectrum','pick','wave']),
 'slant-stack':profile('SLANT STACK','倾斜叠加',['扫描能量','输入炮集','叠加响应'],['spectrum','wave','pick']),
 hrlrt:profile('HRLRT','高分辨率',['高分辨率谱','常规对照','迭代残差'],['spectrum','spectrum','pick']),
 'dispersion-pick':profile('DISPERSION','频散拾取',['能量图','峰值曲线','输入炮集'],['spectrum','pick','wave']),
 'surface-inversion':profile('SURFACE INVERSION','面波反演',['速度模型','响应拟合','迭代残差'],['profile','pick','spectrum']),
 'section-imaging':profile('SECTION','剖面成像',['速度剖面','层状模型','测线位置'],['profile','model','array']),
 spac:profile('SPAC ARCHIVE','空间自相关',['自相关曲线','距离组','频散成果'],['pick','array','spectrum']),
 remi:profile('REMI','微动频散',['ReMi 能量','窗口质量','线性台阵'],['spectrum','wave','array']),
 maps:profile('MAPS','干涉分析',['互相关道集','相关叠加','台站对'],['wave','pick','array']),
 fh:profile('F-H','汉克尔变换',['F-H 能量','积分环','径向响应'],['spectrum','polar','pick']),
 'cmp-ts':profile('CMP-TS','共中点叠加',['叠加剖面','中点分箱','覆盖次数'],['profile','array','spectrum']),
 beamforming:profile('BEAMFORMING','波束分析',['方位慢度','圆形台阵','波束功率'],['polar','array','pick']),
 hvsr:profile('H/V','谱比分析',['H/V 谱比','三分量谱','窗口谱比'],['pick','wave','spectrum']),
 'passive-inversion':profile('JOINT INVERSION','联合反演',['速度模型','频散拟合','H/V 约束'],['profile','pick','spectrum']),
 'array-design':profile('ARRAY','台阵设计',['几何覆盖','深度切片','台站方位'],['array','profile','polar']),
 'event-detection':profile('STA/LTA','事件检测',['连续波形','触发特征','能量包络'],['wave','pick','spectrum']),
 'ps-pick':profile('P/S','到时复核',['事件波形','到时特征','通道包络'],['wave','pick','spectrum']),
 'velocity-model':profile('VELOCITY','速度模型',['分层速度体','速度切片','候选模型'],['model','profile','pick']),
 'event-location':profile('LOCATION','事件定位',['事件与射线','到时残差','平面投影'],['model','wave','array']),
 'magnitude-energy':profile('SOURCE SPECTRUM','震源参数',['位移谱拟合','震级能量','幅值校正'],['pick','array','spectrum']),
 'moment-tensor':profile('MOMENT TENSOR','震源机制',['机制极性','响应对照','候选解'],['tensor','wave','array']),
 'stress-inversion':profile('STRESS','应力反演',['赤平投影','主应力轴','角度失配'],['polar','model','pick']),
 'fracture-network':profile('DFN','裂缝网络',['裂缝面','产状投影','密度剖面'],['model','polar','profile']),
 permeability:profile('SRV','渗流情景',['SRV 包络','渗透率切片','连通路径'],['model','profile','network']),
 'event-attributes':profile('EVENT ATTRIBUTES','时空属性',['事件群','时深密度','属性演变'],['model','spectrum','pick']),
 'slope-stability':profile('SLOPE','稳定性分析',['滑动面','工况对照','工程地层'],['profile','pick','model']),
 'gnss-prediction':profile('GNSS','位移预测',['观测与预测','拟合残差','时段增量'],['pick','wave','spectrum']),
 'multi-risk':profile('RISK FUSION','多源研判',['证据关联','时序对照','空间关联'],['network','pick','model']),
}

export const activeAnalysisParams:Record<string,string[]>={
 'shot-gather':['道间距','炮点号'],taup:['慢度上限','时间窗'],fk:['波数上限','频率上限'],
 'phase-shift-active':['最低相速度','最高相速度'],'slant-stack':['叠加道数','窗长'],
 'dispersion-pick':['能量门槛'],beamforming:['慢度上限','中心频率'],
 'event-detection':['STA 窗长','LTA 窗长','触发比'],'ps-pick':['P 窗长'],
 'gnss-prediction':['历史窗口','预测时长'],
}
export const channelCountFor=(id:string)=>id==='gnss-prediction'?0:id==='hvsr'?8:id==='beamforming'?12:24
export const isSpatialFigure=(f:Figure)=>f.kind==='geometry'&&!['array','pairs','circle','survey','bins'].includes(f.variant||'')
export const canMarkFigure=(f:Figure)=>['wave','lines','heat','profile'].includes(f.kind)
