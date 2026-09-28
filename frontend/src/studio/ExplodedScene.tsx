import {useAutoOrbit} from './useAutoOrbit'
import { useEffect, useId, useRef, useState } from 'react'
import { useDemo } from './store'
import { MineMap } from './MineMap'

const layers = [
 ['表层台阶','松散覆盖层 · 厚度 12 m','#9bbab6'],
 ['风化岩层','中风化砂岩 · 厚度 26 m','#bacbd9'],
 ['监测目标层','煤系地层 · 厚度 18 m','#648aab'],
 ['含水层','裂隙含水带 · 厚度 22 m','#72afc8'],
 ['基岩层','完整砂岩 · 厚度 45 m','#344e69'],
]
const parts = [['天线罩','多频 GNSS 天线','#d6e4ec'],['接收单元','定位与时钟同步','#7b9cb9'],['采集主板','数据采集与边缘缓存','#4d948d'],['通信模块','4G / TCP 数据回传','#6391b8'],['电池底座','供电与状态监测','#425d77']]
export function ExplodedScene({compact=false,device=false,events=false,variant='',analysisScale=1,expanded=false,compare=false}:{compact?:boolean;device?:boolean;events?:boolean;variant?:string;analysisScale?:number;expanded?:boolean;compare?:boolean}) {
 const {visibleDevices,state,selectDevice}=useDemo()
 const [mapView,setMapView]=useState(false)
 const [mode,setMode]=useState(device),[spread,setSpread]=useState(55),[yaw,setYaw]=useState(-.55),[tilt,setTilt]=useState(.58),[zoom,setZoom]=useState(1),[layer,setLayer]=useState(2),[showPoints,setShowPoints]=useState(true)
 const drag=useRef<{x:number;y:number;yaw:number;tilt:number}|null>(null)
 const orbitHost=useAutoOrbit(setYaw,drag)
 const svgId=useId().replaceAll(':','')
 useEffect(()=>{if(variant)setSpread(expanded?95:35)},[expanded,variant])
 useEffect(()=>{if(variant)setYaw(-.55+analysisScale*.09)},[analysisScale,variant])
 const project=(x:number,y:number,z:number)=>{const u=x*Math.cos(yaw)-y*Math.sin(yaw),v=x*Math.sin(yaw)+y*Math.cos(yaw);return [340+u*zoom,230+(v*Math.sin(tilt)-z*Math.cos(tilt))*zoom]}
 const poly=(coords:number[][])=>coords.map(p=>project(p[0],p[1],p[2]).join(',')).join(' ')
 const records=mode?parts:layers
 const shapes=records.flatMap((l,i)=>{const w=mode?75:190-(i===0?8:0),h=mode?55:112,z=65-i*(13+spread*.4),t=mode?10:12;const corners=[[-w,-h],[w,-h],[w,h],[-w,h]];return [0,1,2,3].map(j=>({key:i+'s'+j,i,depth:(corners[j][0]*Math.sin(yaw)+corners[j][1]*Math.cos(yaw)),points:poly([[...corners[j],z],[...corners[(j+1)%4],z],[...corners[(j+1)%4],z-t],[...corners[j],z-t]]),fill:l[2],side:true})).concat([{key:i+'top',i,depth:999,points:poly(corners.map(c=>[...c,z])),fill:l[2],side:false}])})
 const select=visibleDevices.find(d=>d.id===state.selectedDevice)
 return <div ref={orbitHost} className={'exploded '+(compact?'exploded--compact':'')}>
  {!compact&&<div className="scene-toolbar"><div className="segmented"><button className={mapView?'active':''} onClick={()=>setMapView(true)}>平面地图</button><button className={!mode&&!mapView?'active':''} onClick={()=>{setMapView(false);setMode(false);setLayer(2)}}>矿区地质</button><button className={mode&&!mapView?'active':''} onClick={()=>{setMapView(false);setMode(true);setLayer(0)}}>设备拆解</button></div><span>拖动旋转 · 滚轮缩放 · 点击查看</span><button onClick={()=>{setYaw(-.55);setTilt(.58);setZoom(1);setSpread(55)}}>复位视角</button></div>}
  {mapView?<MineMap/>:<svg role="img" aria-label={mode?'监测设备三维爆炸图':'矿区地层三维爆炸图与监测地图'} viewBox="0 0 680 455" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,yaw,tilt}}} onPointerMove={e=>{if(drag.current){setYaw(drag.current.yaw+(e.clientX-drag.current.x)*.007);setTilt(Math.max(.2,Math.min(1.2,drag.current.tilt+(e.clientY-drag.current.y)*.004)))}}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onWheel={e=>setZoom(v=>Math.max(.65,Math.min(1.5,v-e.deltaY*.001)))}>
   <defs><radialGradient id={`${svgId}-halo`}><stop stopColor="#c6d7e7" stopOpacity=".65"/><stop offset="1" stopColor="#eff4f8" stopOpacity="0"/></radialGradient><pattern id={`${svgId}-grid`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#9ab3c8" strokeOpacity=".14"/></pattern></defs>
   <rect width="680" height="455" fill={`url(#${svgId}-grid)`}/><ellipse cx="350" cy="348" rx="250" ry="92" fill={`url(#${svgId}-halo)`}/>
   {[...records].reverse().map((_,r)=>{const i=records.length-1-r;return <g key={i} onClick={()=>setLayer(i)} className="scene-layer"><g opacity={layer===i?1:.78}>{shapes.filter(s=>s.i===i).sort((a,b)=>a.depth-b.depth).map(s=><polygon key={s.key} points={s.points} fill={s.fill} stroke={layer===i?'#1b58a1':'#fff'} strokeWidth={layer===i?1.8:.7} style={{filter:s.side?'brightness(.78)':'none'}}/>)}</g>{!mode&&i===0&&[1,.74,.49].map((v,j)=><polygon key={j} points={poly([[-155*v,-88*v,67+j*4],[155*v,-88*v,67+j*4],[155*v,88*v,67+j*4],[-155*v,88*v,67+j*4]])} fill={j%2?'#8dafa5':'#a9c2b9'} stroke="#dce8dc" strokeWidth="3"/>)}{mode&&i===2&&Array.from({length:9},(_,n)=><polygon key={n} points={poly([[-45+(n%3)*30,-30+Math.floor(n/3)*22,66-i*(13+spread*.4)],[-30+(n%3)*30,-30+Math.floor(n/3)*22,66-i*(13+spread*.4)],[-30+(n%3)*30,-17+Math.floor(n/3)*22,66-i*(13+spread*.4)],[-45+(n%3)*30,-17+Math.floor(n/3)*22,66-i*(13+spread*.4)]])} fill="#183c4f"/>)}</g>})}
   {!mode&&showPoints&&visibleDevices.map(d=>{const [x,y]=project(d.x,d.y,85);return <g key={d.id} onPointerDown={e=>e.stopPropagation()} onClick={()=>selectDevice(d.id)} className="scene-point" role="button" aria-label={d.id} tabIndex={0} onKeyDown={e=>e.key==='Enter'&&selectDevice(d.id)}><line x1={x} y1={y} x2={x} y2={y-13} stroke="#3e698e"/><circle cx={x} cy={y-15} r={state.selectedDevice===d.id?7:4.5} fill={d.status==='在线'?'#1b58a1':'#d8873b'} stroke="#fff" strokeWidth="2"/>{state.selectedDevice===d.id&&<><rect x={x-41} y={y-45} width="82" height="21" rx="4" fill="#173e65"/><text x={x} y={y-30} textAnchor="middle" fill="white" fontSize="11">{d.id}</text></>}</g>})}
   {!mode&&events&&Array.from({length:24},(_,i)=>{const p=project(Math.sin(i*2)*65,Math.cos(i*3)*45,-10-i%5*15);return <circle key={i} cx={p[0]} cy={p[1]} r={2+i%4} fill="#d99a57" opacity=".8"/>})}
   {!mode&&variant==='array-design'&&visibleDevices.slice(0,Math.round(8+analysisScale*2)).map(d=>{const p=project(d.x,d.y,83);return <ellipse key={d.id} cx={p[0]} cy={p[1]} rx={35+analysisScale*5} ry="18" fill="#67a7c022" stroke="#6e9cb2" strokeDasharray="3 4"/>})}
   {!mode&&['fracture-network','permeability','velocity-model'].includes(variant)&&Array.from({length:variant==='permeability'?16:8},(_,i)=>{const x=-90+i%4*50,y=-55+Math.floor(i/4)*37,z=-30+i%3*20;return <polygon key={i} points={poly([[x,y,z],[x+45,y-8,z+20+analysisScale*3],[x+48,y+26,z-15],[x+7,y+32,z-32]])} fill={variant==='velocity-model'?'#70a4c755':i%2?'#cd924944':'#56a2a944'} stroke={i%2?'#be8740':'#478b97'} strokeWidth="1"/>})}
   {!mode&&variant==='slope-stability'&&<polygon points={poly([[-125,-50,66],[125,-50,66],[90,20,-50],[-30,45,-70]])} fill="#d8a15444" stroke="#bd8640" strokeWidth="2" strokeDasharray="5 3"/>}
   {compare&&<g><rect x="28" y="70" width="152" height="41" rx="4" fill="#fff" stroke="#d8e3eb"/><text x="38" y="86" fontSize="10" fill="#478e86">基准模型 V1 / 对比视图</text><text x="38" y="101" fontSize="10" fill="#8a9fab">当前参数响应 {analysisScale.toFixed(2)}</text></g>}
   {records.map((r,i)=>{const p=project(mode?80:192,mode?50:100,65-i*(13+spread*.4));return <g key={r[0]} onClick={()=>setLayer(i)} className="scene-label"><path d={`M${p[0]},${p[1]} L${Math.min(p[0]+24,535)},${p[1]} L550,${100+i*53}`} fill="none" stroke={layer===i?'#1b58a1':'#9db0c2'} strokeWidth="1"/><circle cx={p[0]} cy={p[1]} r="3" fill="#1b58a1"/><text x="554" y={104+i*53} fill={layer===i?'#1b58a1':'#5b7288'} fontSize="12" fontWeight={layer===i?700:400}>{r[0]}</text></g>})}
   <g transform="translate(49 379)"><path d="M0 0 L28 0 M0 0 L-12 18 M0 0 L0 -31" stroke="#6287a7"/><text x="32" y="4" fontSize="11" fill="#7b91a5">E</text><text x="-22" y="28" fontSize="11" fill="#7b91a5">N</text><text x="-4" y="-37" fontSize="11" fill="#7b91a5">Z</text></g>
   <text x="30" y="35" fontSize="11" fill="#8197aa">KD / DIGITAL GEOLOGY</text><text x="30" y="52" fontSize="10" fill="#8197aa">示意模型 · 非真实测绘坐标</text>
  </svg>}
  <div className="scene-footer"><div><strong>{records[layer][0]}</strong><span>{records[layer][1]}{!mode&&select?` / ${select.id} · ${select.status}`:''}</span></div><label>分层展开<input aria-label="爆炸图展开程度" type="range" min="0" max="100" value={spread} onChange={e=>setSpread(+e.target.value)}/></label>{!compact&&<label><input type="checkbox" checked={showPoints} onChange={e=>setShowPoints(e.target.checked)}/>监测点位</label>}</div>
 </div>
}
