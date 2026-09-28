import { useState } from 'react'
import { useDemo, type Device, type Risk } from './store'
export function MineMap({compact=false,devices,selectedId,onSelect,risks}:{compact?:boolean;devices?:Device[];selectedId?:string;onSelect?:(id:string)=>void;risks?:Risk[]}){
 const demo=useDemo(),[showTerrain,setShowTerrain]=useState(true),[showRisk,setShowRisk]=useState(true)
 const visibleDevices=devices||demo.visibleDevices,selectDevice=onSelect||demo.selectDevice,state={...demo.state,selectedDevice:selectedId||demo.state.selectedDevice,risks:risks||demo.state.risks}
 const selected=visibleDevices.find(d=>d.id===state.selectedDevice)
 return <div className={'mine-map '+(compact?'is-compact':'')}><svg viewBox="0 0 680 400" role="img" aria-label="矿区监测平面地图">
 <rect width="680" height="400" fill="#e9efed"/>
 <path d="M0 42Q180 0 280 65T680 22V0H0ZM0 280Q120 210 185 312T410 358T680 316V400H0Z" fill="#dde7df"/>
 {showTerrain&&Array.from({length:13},(_,i)=><path key={i} d={`M${-150+i*32} 0 Q${150+i*22} 86 ${20+i*27} 201 T${120+i*41} 420`} fill="none" stroke="#c8d4c8" strokeWidth=".8" opacity=".65"/>)}
 <path d="M62 298L101 120 225 61 476 91 553 204 478 317 252 354Z" fill="#d6ded5" stroke="#afbfad" strokeWidth="1.5"/>
 {[1,.85,.69,.53,.37].map((s,i)=><path key={i} d="M106 242L123 144 235 91 445 108 505 210 435 287 250 314Z" transform={`translate(${315*(1-s)},${206*(1-s)}) scale(${s})`} fill={i%2?'#b8c5b4':'#cad5c4'} stroke="#eef1e8" strokeWidth={5/s}/>)}
 <path d="M11 344L93 298 115 266 156 250 175 168 247 132 420 148 461 210 415 252 256 271" stroke="#adab99" strokeWidth="14" fill="none" strokeLinejoin="round"/><path d="M11 344L93 298 115 266 156 250 175 168 247 132 420 148 461 210 415 252 256 271" stroke="#e9e4d4" strokeWidth="10" fill="none" strokeLinejoin="round"/>
 <path d="M497 283L577 273 656 177" stroke="#f5f1e5" strokeWidth="13" fill="none"/><path d="M576 273L598 345" stroke="#f5f1e5" strokeWidth="9" fill="none"/>
 {[0,1,2,3].map(i=><g key={i} transform={`translate(${554+i%2*41} ${295+Math.floor(i/2)*30}) rotate(-10)`}><rect width="29" height="20" fill="#afbac0" stroke="#f8fafb"/><path d="M0 3H29" stroke="#8499a6"/></g>)}
 <path d="M33 84L83 44 570 68 624 227 534 367 186 380 43 292Z" fill="none" stroke="#658d9c" strokeDasharray="5 5" strokeWidth="1"/>
 <text x="288" y="62" fill="#6b8378" fontSize="13" letterSpacing="5">北帮监测区</text><text x="125" y="351" fill="#6b8378" fontSize="12" letterSpacing="3">南帮监测区</text><text x="514" y="169" fill="#6b8378" fontSize="12">东帮监测区</text><text x="548" y="379" fill="#809095" fontSize="10">矿区作业站</text>
 {showRisk&&state.risks.filter(r=>r.stage<4).map((r,i)=>{const d=visibleDevices.find(d=>d.id===r.device);return d?<ellipse key={r.id} cx={330+d.x*1.45} cy={194+d.y*1.3} rx={37+i*3} ry="22" fill="#dbae6440" stroke="#c49142" strokeDasharray="4 4"/>:null})}
 {visibleDevices.map(d=>{const x=330+d.x*1.45,y=194+d.y*1.3;return <g key={d.id} className="map-point" role="button" aria-label={`地图测点 ${d.id}`} tabIndex={0} onKeyDown={e=>e.key==='Enter'&&selectDevice(d.id)} onClick={()=>selectDevice(d.id)}><circle cx={x} cy={y} r={state.selectedDevice===d.id?8:5} fill={d.status==='在线'?'#1b58a1':'#c58a40'} stroke="white" strokeWidth="2"/>{state.selectedDevice===d.id&&<><rect x={x-47} y={y-33} width="94" height="21" rx="3" fill="#234d70"/><text x={x} y={y-18} textAnchor="middle" fill="white" fontSize="11">{d.id}</text></>}</g>})}
 <g transform="translate(633 37)"><path d="M0 5 L-7 29 L0 23 L7 29Z" fill="#547687"/><text x="0" y="0" textAnchor="middle" fill="#547687" fontSize="11">N</text></g><path d="M33 367v7h90v-7M78 368v6" stroke="#638493" fill="none"/><text x="34" y="390" fontSize="9" fill="#6f8b9a">0</text><text x="81" y="390" fontSize="9" fill="#6f8b9a">示意比例尺</text>
 </svg>{!compact&&<div className="map-controls"><label><input type="checkbox" checked={showTerrain} onChange={e=>setShowTerrain(e.target.checked)}/>地形等高线</label><label><input type="checkbox" checked={showRisk} onChange={e=>setShowRisk(e.target.checked)}/>风险区域</label><span>{selected?.id} · {selected?.status} / 离线示意地图</span></div>}</div>
}
