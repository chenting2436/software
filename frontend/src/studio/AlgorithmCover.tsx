import {MethodGlyph,distinctGlyphIds} from './MethodGlyph'
import {useId} from 'react'

type Family='wave'|'ridge'|'array'|'earth'|'event'|'fracture'|'risk'
export const algorithmVisuals:Record<string,{family:Family;intent:string;variant:number}>={
 'shot-gather':{family:'wave',intent:'地面激发 · 阵列接收',variant:0},
 taup:{family:'wave',intent:'分离不同传播速度',variant:1},
 fk:{family:'ridge',intent:'识别波的方向与速度',variant:0},
 'phase-shift-active':{family:'ridge',intent:'对齐波动 · 聚焦能量',variant:1},
 'slant-stack':{family:'wave',intent:'叠加增强有效信号',variant:2},
 hrlrt:{family:'ridge',intent:'分辨相邻传播模式',variant:2},
 'dispersion-pick':{family:'ridge',intent:'沿能量脊线提取速度',variant:3},
 'surface-inversion':{family:'earth',intent:'由地表波反推地下结构',variant:0},
 'section-imaging':{family:'earth',intent:'展开测线下方的地层',variant:1},
 spac:{family:'array',intent:'环形阵列感知地下',variant:0},
 remi:{family:'ridge',intent:'从环境噪声中寻找面波',variant:4},
 maps:{family:'wave',intent:'多道信号寻找共同特征',variant:3},
 fh:{family:'ridge',intent:'分离深浅层的传播响应',variant:5},
 'cmp-ts':{family:'earth',intent:'连接相邻测点的地下图像',variant:2},
 beamforming:{family:'array',intent:'定位信号来向',variant:1},
 hvsr:{family:'array',intent:'识别场地共振',variant:2},
 'passive-inversion':{family:'earth',intent:'用环境振动还原地层',variant:3},
 'array-design':{family:'array',intent:'布设台站 · 查看覆盖',variant:3},
 'event-detection':{family:'event',intent:'从背景振动中找出事件',variant:0},
 'ps-pick':{family:'wave',intent:'识别先后到达的波',variant:4},
 'velocity-model':{family:'earth',intent:'建立地下波速空间模型',variant:4},
 'event-location':{family:'event',intent:'多站交汇 · 定位震源',variant:1},
 'magnitude-energy':{family:'event',intent:'比较事件释放的能量',variant:2},
 'moment-tensor':{family:'fracture',intent:'还原岩体破裂方向',variant:0},
 'stress-inversion':{family:'fracture',intent:'观察岩体受力方向',variant:1},
 'fracture-network':{family:'fracture',intent:'识别地下裂隙连接',variant:2},
 permeability:{family:'fracture',intent:'追踪裂隙中的流动路径',variant:3},
 'event-attributes':{family:'event',intent:'观察事件的聚集与演变',variant:3},
 'slope-stability':{family:'risk',intent:'查看边坡潜在滑动范围',variant:0},
 'gnss-prediction':{family:'risk',intent:'观察地表位移趋势',variant:1},
 'multi-risk':{family:'risk',intent:'多源证据汇合定位风险',variant:2},
}
const series=(n:number)=>Array.from({length:n},(_,i)=>i)
const iso=(x:number,y:number,z=0)=>[160+x*.92-y*.7,92+x*.23+y*.38-z]
const polygon=(pts:number[][])=>pts.map(p=>iso(p[0],p[1],p[2]).join(',')).join(' ')
/** Lightweight authored visual index; never creates a WebGL context per card. */
export function AlgorithmCover({id,large=false}:{id:string;large?:boolean}){
 const key=useId().replace(/[^a-zA-Z0-9]/g,''),v=algorithmVisuals[id]||algorithmVisuals['event-location'],n=v.variant
 const glass='url(#'+key+'glass)',metal='url(#'+key+'metal)',light='url(#'+key+'light)'
 return <svg className={'algorithm-cover '+(large?'is-large':'')} viewBox="0 0 320 176" role="img" aria-label={v.intent} data-visual={id}>
 <defs>
  <linearGradient id={key+'glass'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8f1ed" stopOpacity=".4"/><stop offset=".4" stopColor="#7bb3c1" stopOpacity=".12"/><stop offset="1" stopColor="#668fad" stopOpacity=".32"/></linearGradient>
  <linearGradient id={key+'metal'} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d5ece9"/><stop offset=".45" stopColor="#92c4cf"/><stop offset="1" stopColor="#375c70"/></linearGradient>
  <linearGradient id={key+'light'}><stop stopColor="#76b7c6" stopOpacity=".1"/><stop offset=".6" stopColor="#b9ebdf"/><stop offset="1" stopColor="#e4cba3"/></linearGradient>
  <radialGradient id={key+'glow'}><stop stopColor="#80bac7" stopOpacity=".22"/><stop offset="1" stopColor="#80bac7" stopOpacity="0"/></radialGradient>
 </defs>
 <ellipse cx="160" cy="132" rx="118" ry="37" fill={'url(#'+key+'glow)'}/>
 {distinctGlyphIds.has(id)?<MethodGlyph id={id} glass={glass} light={light}/>:<>
 {v.family==='wave'&&<g>
  <polygon points={polygon([[-96,-42,-15],[96,-42,-15],[96,42,-15],[-96,42,-15]])} fill={glass} stroke="#badbe4" strokeOpacity=".24"/>
  {series(8).map(i=>{const x=-77+i*22+(n===1?12*Math.sin(i*.5):0),[px,py]=iso(x,-31,0);return <g key={i}><path d={'M'+px+' '+py+'v-15'} stroke="#a9ccd3" strokeWidth="2"/><ellipse cx={px} cy={py-15} rx="4" ry="2.5" fill={metal}/><path d={series(65).map(j=>{const y=-24+j*1.1,z=4+Math.sin(j*.54-i*(n===2?.06:n===1?1.12:n===3?-.4:.52))*Math.exp(-1*((j-28-i*(n===4?1.1:0))/13)**2)*(n===3?17:12),p=iso(x,y,z);return (j?'L':'M')+p.join(',')}).join(' ')} fill="none" stroke={i%3===0?'#e1c99b':'#a3d9db'} strokeWidth="1.1" opacity=".85"/></g>})}
  <circle cx="78" cy="108" r="4" fill="#e5c48d"/><ellipse className="cover-pulse" cx="78" cy="108" rx="20" ry="9" fill="none" stroke="#e5c48d" opacity=".5"/>
 </g>}
 {v.family==='ridge'&&<g>
  <polygon points={polygon([[-88,-52,-23],[88,-52,-23],[88,52,-23],[-88,52,-23]])} fill={glass} stroke="#c7e1e3" strokeOpacity=".24"/>
  {series(13).map(i=>{const x=-84+i*14,pts=series(60).map(j=>{const y=-50+j*100/59,centre=Math.sin(x*.018+n*.42)*22,height=(n===2?35:46)*Math.exp(-1*((y-centre)/(n===5?19:13))**2)+(n===2?19*Math.exp(-1*((y-centre-24)/7)**2):0);return iso(x,y,-18+height)});return <path key={i} d={pts.map((p,j)=>(j?'L':'M')+p.join(',')).join(' ')} fill="none" stroke={i===7?'#f1d3a0':light} strokeWidth={i===7?2:1.3} opacity={.48+i*.035}/>})}
  <path d={series(60).map(i=>{const x=-84+i*168/59,y=Math.sin(x*.018+n*.42)*22;return (i?'L':'M')+iso(x,y,28).join(',')}).join(' ')} fill="none" stroke="#e9ce9f" strokeWidth="1.7" strokeDasharray={n===3?'0 0':'3 4'}/>
  {n===0&&<path d="M229 115l20-7-4 8m4-8-9-1" stroke="#b0dfe4" fill="none"/>}
 </g>}
 {v.family==='array'&&<g>
  {[72,53,32].map((r,i)=><ellipse key={r} cx="159" cy="100" rx={r*1.45} ry={r*.52} fill={i===0?glass:'none'} stroke="#8cb5c6" strokeOpacity=".32"/>)}
  {series(n===3?9:12).map(i=>{const a=i*Math.PI*2/(n===3?9:12)+n*.15,x=159+Math.cos(a)*104,y=100+Math.sin(a)*38;return <g key={i}><path d={'M'+x+' '+y+'L159 '+(n===2?46:92)} stroke="#7dbece" strokeOpacity=".35"/><path d={'M'+x+' '+y+'v-12'} stroke="#c4dce0" strokeWidth="2"/><circle cx={x} cy={y-12} r="3.5" fill={metal}/></g>})}
  {n===2?series(4).map(i=><ellipse key={i} cx="159" cy={88-i*14} rx={20-i*3} ry="7" fill={glass} stroke="#e3cfa6" strokeOpacity={1-i*.18}/>):<><path d={n===1?'M159 97L246 55L220 104Z':'M159 93L193 55L132 56Z'} fill="#a1d4d5" fillOpacity=".18" stroke="#c1e1da" strokeOpacity=".45"/><circle cx="159" cy="92" r="5" fill="#e6c597"/></>}
 </g>}
 {v.family==='earth'&&<g>
  {series(4).map(i=>{const z=48-i*(n===4?18:n===1?29:24);return <g key={i}><polygon points={polygon([[-81,-43,z],[81,-43,z],[81,43,z],[-81,43,z]])} fill={glass} stroke={i===n%4?'#d6d1aa':'#90b6c2'} strokeOpacity=".6"/><polygon points={polygon([[-81,43,z],[81,43,z],[81,43,z-10],[-81,43,z-10]])} fill={i===n%4?'#bfaf80':'#5b889d'} opacity=".36"/>{series(6).map(j=><path key={j} d={series(20).map(k=>(k?'L':'M')+iso(-78+k*8,-37+j*14,z+3+Math.sin(k*.45+n+i)*3).join(',')).join(' ')} stroke="#a8cad1" strokeWidth=".55" fill="none" opacity=".35"/>)}</g>})}
  <path d={'M'+iso(10,-42,57).join(',')+'L'+iso(10,42,-31).join(',')} stroke="#e7c28d" strokeWidth="2"/>
 </g>}
 {v.family==='event'&&<g>
  {[0,1,2].map(i=><polygon key={i} points={polygon([[-84,-47,30-i*28],[84,-47,30-i*28],[84,47,30-i*28],[-84,47,30-i*28]])} fill={glass} stroke="#9abfcf" strokeOpacity=".22"/>)}
  {series(n===3?22:11).map(i=>{const p=iso(Math.sin(i*1.7)*58,Math.cos(i*2.1)*28,3-i%3*11);return <circle key={i} cx={p[0]} cy={p[1]} r={n===2?2+i%4:2} fill={i%5===0?'#e7c18b':'#9bd8d9'} opacity=".7"/>})}
  {n===1&&series(6).map(i=>{const a=i*Math.PI/3,p=iso(Math.cos(a)*81,Math.sin(a)*44,40);return <g key={i}><path d={'M'+p.join(',')+'L165 107'} stroke="#a9dbd7" strokeOpacity=".5"/><circle cx={p[0]} cy={p[1]} r="3.5" fill="#d2e5ea"/></g>})}
  <ellipse className="cover-pulse" cx="165" cy="107" rx="24" ry="12" fill="none" stroke="#ebc78c" strokeOpacity=".7"/><circle cx="165" cy="107" r="5" fill="#efcf9d"/>
 </g>}
 {v.family==='fracture'&&<g>
  {n<2?<><circle cx="159" cy="84" r="47" fill={glass} stroke="#a8c7d4" strokeOpacity=".45"/><ellipse cx="159" cy="84" rx="19" ry="47" transform="rotate(38 159 84)" fill="none" stroke="#d0dcdd" strokeOpacity=".7"/><ellipse cx="159" cy="84" rx="47" ry="16" transform="rotate(-28 159 84)" fill="#8fc3cf" fillOpacity=".12" stroke="#b4d8d7" strokeOpacity=".6"/>{[[159,19,159,58],[233,112,189,94],[88,118,127,99]].map(([x,y,x2,y2],i)=><g key={i}><path d={'M'+x+' '+y+'L'+x2+' '+y2} stroke={i===0?'#e5c792':'#8dbbcf'} strokeWidth="2"/><circle cx={x2} cy={y2} r="3" fill="#cadfe2"/></g>)}</>:<>{series(7).map(i=>{const x=-65+i%4*39,y=-26+Math.floor(i/4)*38,z=38-i%3*25;return <polygon key={i} points={polygon([[x,y,z],[x+31,y-9,z+20],[x+36,y+19,z-30],[x+4,y+24,z-43]])} fill={glass} stroke={i%3===0?'#d6b784':'#9cc6d4'} strokeOpacity=".6"/>})}{n===3&&<path className="cover-flow" d="M94 50C142 70 124 130 174 117S180 66 235 108" stroke="#e8d0a1" strokeWidth="2" strokeDasharray="3 7" fill="none"/>}</>}
 </g>}
 {v.family==='risk'&&<g>
  {series(4).map(i=><path key={i} d={'M66 '+(43+i*18)+'L125 '+(32+i*18)+'L205 '+(88+i*11)+'L269 '+(77+i*11)+'v16l-66 13-79-55-58 12Z'} fill={glass} stroke="#aac9d2" strokeOpacity=".38"/>)}
  {n===0?<><path d="M126 34Q150 117 219 116L205 90Z" fill="#d9bc85" fillOpacity=".3" stroke="#e5c58f"/><path d="M164 47l31 23-11-1m11 1-3-10" fill="none" stroke="#eac88e" strokeWidth="2"/></>:n===1?<><path d="M96 33v-17m-6 0h12M227 72V55m-6 0h12" stroke="#bddee2" strokeWidth="2"/><path d="M103 21C138 17 170 55 221 47" fill="none" stroke="#e5c692" strokeWidth="2" strokeDasharray="3 4"/></>:<>{[[97,19],[225,36],[67,115]].map(([x,y],i)=><g key={i}><path d={'M'+x+' '+y+'L173 83'} stroke="#bdd5d3" strokeOpacity=".6"/><circle cx={x} cy={y} r="8" fill={glass} stroke="#a7c9ce"/></g>)}<circle cx="173" cy="83" r="12" fill="#d7b477" fillOpacity=".45" stroke="#e6c28e"/></>}
 </g>}
 </>}
 </svg>
}
