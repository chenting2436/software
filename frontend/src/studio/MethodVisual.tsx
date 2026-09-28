import type {ReactNode} from 'react'
import type {AnalysisOutput} from './analysisEngine'

const range=(n:number)=>Array.from({length:n},(_,i)=>i)
const ink=['#b5e2e4','#ead0a5','#a6badd','#afd3bd']
const finite=(a:number[])=>a.filter(Number.isFinite)
const extent=(a:number[])=>{const b=finite(a);return [Math.min(0,...b),Math.max(.001,...b)]}
export function tracePath(a:number[],x:number,y:number,w:number,h:number,min?:number,max?:number){
 const [lo,hi]=extent(a);let pen=false
 return a.map((v,i)=>{if(!Number.isFinite(v)){pen=false;return ''}const p=`${pen?'L':'M'}${x+i/Math.max(1,a.length-1)*w},${y+h-(v-(min??lo))/Math.max(.00001,(max??hi)-(min??lo))*h}`;pen=true;return p}).join(' ')
}
export const methodVisualKinds:Record<string,string>={
 'shot-gather':'shot-ray-fan',taup:'moveout-scan',fk:'wavenumber-fan','slant-stack':'aligned-sum',hrlrt:'dual-mode-resolution','dispersion-pick':'ridge-knots',remi:'window-selection',maps:'pair-correlation',
 'surface-inversion':'candidate-model-fan','passive-inversion':'joint-constraint','section-imaging':'continuous-curtain','cmp-ts':'midpoint-fold',fh:'radial-integral',hvsr:'resonance-components','array-design':'station-coverage',
 'event-detection':'trigger-windows','ps-pick':'arrival-ribbons','velocity-model':'orthogonal-slices','magnitude-energy':'spectrum-energy','stress-inversion':'stress-ellipsoid',permeability:'connected-flow','event-attributes':'time-depth-migration','multi-risk':'evidence-confluence',
}

export function methodReadout(output:AnalysisOutput,position:number,selected:number){
 const f=output.figures,t=position/100,id=output.id,m=f.find(x=>x.matrix)?.matrix||[],row=Math.round(t*Math.max(0,m.length-1)),col=Math.round(t*Math.max(0,(m[0]?.length||1)-1))
 if(id==='gnss-prediction'){const a=f[0].lines||[],i=Math.round(t*Math.max(0,(a[0]?.length||1)-1)),observed=Number.isFinite(a[0]?.[i]),value=observed?a[0][i]:a[1]?.[i],hours=i/Math.max(1,(a[0]?.length||1)-1)*(f[0].range?.[1]||0);return {label:observed?'位移观测':'模型外推',value:Number.isFinite(value)?value.toFixed(3):'—',detail:hours.toFixed(1)+' h · mm'}}
 if(id==='taup'||id==='slant-stack')return {label:'扫描慢度',value:((f[0].range?.[2]||0)+t*((f[0].range?.[3]||1)-(f[0].range?.[2]||0))).toFixed(2),detail:'ms/m · 峰值 '+Math.max(...(m[row]||[0]).map(Math.abs)).toFixed(3)}
 if(id==='hrlrt')return {label:selected%2?'常规对照':'高分辨率',value:'双模态',detail:'分辨率对照'}
 if(id==='dispersion-pick'){const a=f[1].lines?.[0]||[],i=selected%Math.max(1,a.length);return {label:'拾取频点 '+(i+1),value:Number.isFinite(a[i])?a[i].toFixed(1):'无有效值',detail:'m/s · 门槛筛选后成果'}}
 if(id==='remi'){const a=f[1].matrix?.[selected%9]||[0];return {label:'观察窗口 '+(selected%9+1),value:Math.max(...a).toFixed(3),detail:'窗口能量'}}
 if(id==='surface-inversion'||id==='passive-inversion')return {label:'候选模型',value:String(Math.round(t*((f[0].lines?.length||1)-1))+1).padStart(2,'0'),detail:id==='passive-inversion'?'频散 + 共振双重约束':'速度剖面 + 拟合残差'}
 if(id==='array-design')return {label:'选中台站',value:String(selected+1).padStart(2,'0'),detail:'台站覆盖'}
 if(id==='fh')return {label:'积分环',value:String(selected%6+1).padStart(2,'0'),detail:'径向响应'}
 if(id==='event-detection'||id==='ps-pick'){const a=f[1].lines?.[0]||[],i=Math.round(t*Math.max(0,a.length-1));return {label:'短长时能量比',value:(a[i]||0).toFixed(3),detail:(t*2).toFixed(3)+' s · 候选事件需复核'}}
 if(id==='magnitude-energy'){const point=f[1].points?.[selected]||[0,0,0];return {label:'事件 '+(selected+1),value:point[1].toFixed(2),detail:'归档属性 · 谱拟合见左侧'}}
 if(id==='velocity-model'||id==='section-imaging'||id==='cmp-ts'||id==='permeability')return {label:'剖切位置 '+(col+1),value:Math.max(...m.map(r=>r[col]),0).toFixed(1),detail:id==='permeability'?'切片峰值 / mD':'剖面峰值 / m·s⁻¹'}
 if(id==='event-attributes')return {label:'观察时段 '+(col+1),value:Math.max(...m.map(r=>r[col]),0).toFixed(3),detail:'时段—深度密度峰值'}
 return null
}

/** Method-specific visual grammar. Curves/cuts use output arrays; spatial outlines are illustrative. */
export function MethodVisual({output,position,selected,onSelect,glass}:{output:AnalysisOutput;position:number;selected:number;onSelect:(n:number)=>void;glass:string}){
 const id=output.id,f=output.figures,t=position/100,m=f.find(x=>x.matrix)?.matrix||[],waves=f.find(x=>x.kind==='wave')?.lines||[],q=Math.round(t*Math.max(0,(m[0]?.length||1)-1))
 const node=(i:number,label:string,children:ReactNode)=><g key={i} className={'domain-node '+(selected===i?'is-selected':'')} role="button" tabIndex={0} aria-label={label} onClick={()=>onSelect(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i)}}}>{children}</g>
 const line=(a:number[],x:number,y:number,w:number,h:number,color=ink[0],opacity=1,key=0,min?:number,max?:number)=><path key={key} d={tracePath(a,x,y,w,h,min,max)} fill="none" stroke={color} strokeWidth="1.65" opacity={opacity}/>
 const panel=(x:number,y:number,w:number,h:number,label:string)=><g><rect x={x} y={y} width={w} height={h} rx="18" fill={glass} stroke="#d1ebec" strokeOpacity=".16"/><text x={x+17} y={y+27}>{label}</text></g>
 const cursor=(x:number,y:number,h:number)=><path d={`M${x} ${y}v${h}`} stroke={ink[1]} strokeWidth="1.4" strokeOpacity=".8" strokeDasharray="3 6"/>

 if(id==='shot-gather')return <g data-method-visual={methodVisualKinds[id]}>
  <path d="M70 130Q385 112 725 138L725 186Q380 160 70 181Z" fill={glass} stroke="#c7e5e5" strokeOpacity=".22"/>
  <circle cx="92" cy="125" r="8" fill={ink[1]}/><text x="76" y="99">激发</text>
  {range(Math.min(12,waves.length)).map(i=>{const x=162+i*47;return node(i,'接收道 '+(i+1),<><path d={`M92 128Q${(92+x)/2} ${200+(x-92)*.15} ${x} 132`} stroke={selected===i?ink[1]:ink[0]} strokeOpacity={selected===i?.9:.17} fill="none"/><path d={`M${x} 130v-19`} stroke={ink[0]}/><circle cx={x} cy="108" r="5" fill={selected===i?ink[1]:ink[0]}/><text x={x} y="86" textAnchor="middle">{i+1}</text></>)})}
  {panel(80,284,640,135,'接收记录 · '+(selected+1))}{line(waves[selected%Math.max(1,waves.length)]||[],103,327,590,68)}{cursor(103+t*590,320,80)}
 </g>
 if(id==='taup'||id==='slant-stack'){
  const stack=id==='slant-stack',row=Math.round(t*Math.max(0,m.length-1)),scan=m[row]||[],count=Math.min(7,waves.length)
  return <g data-method-visual={methodVisualKinds[id]}>{panel(60,60,435,362,stack?'通道移位':'截距时间扫描')}{panel(522,60,226,362,stack?'相干叠加':'慢度切片')}
   {waves.slice(0,count).map((a,i)=>{const shift=Math.round(i*t*19),aligned=stack?a.map((_,j)=>a[j+shift]||0):a;return line(aligned,82,112+i*39,387,30,ink[i%3],.64,i,-1.4,1.4)})}
   <path d={`M${100+t*190} 98L${100+t*190+(stack?0:165)} 371`} stroke={ink[1]} strokeWidth="2" strokeOpacity=".75"/>
   {range(5).map(i=>line(m[Math.min(m.length-1,Math.round(i*(m.length-1)/4))]||[],542,125+i*46,180,37,ink[0],.18,i))}
   {line(scan,542,176,180,148,ink[1])}<text x="543" y="397">扫描行 {row+1} / {m.length}</text>
  </g>
 }
 if(id==='fk'){
  const flat=finite(m.flat()),max=Math.max(.0001,...flat),col=m.map(row=>row[q])
  return <g data-method-visual={methodVisualKinds[id]}><path d="M395 375L104 128Q396 15 697 128Z" fill={glass} stroke="#c0e2e5" strokeOpacity=".3"/>
   {[.28,.52,.76,1].map((r,i)=><path key={i} d={`M${395-291*r} ${375-247*r}Q395 ${375-360*r} ${395+302*r} ${375-247*r}`} fill="none" stroke="#b1d6df" strokeOpacity=".15"/>)}
   {range(40).map(i=>{const r=i/39,a=-2.42+r*1.69,amp=Math.max(0,col[i]||0)/max*.7+.2,x=395+Math.cos(a)*340*amp,y=375+Math.sin(a)*340*amp;return <path key={i} d={`M395 375L${x} ${y}`} stroke={ink[i%9===0?1:0]} strokeWidth="3" opacity={.18+amp*.7}/>})}
   <circle cx="395" cy="375" r="7" fill={ink[1]}/><text x="107" y="117">负波数</text><text x="645" y="117">正波数</text><text x="331" y="428">当前频率切片 {q+1}</text>
  </g>
 }
 if(id==='hrlrt'||id==='dispersion-pick'||id==='remi'){
  const picking=id==='dispersion-pick',remi=id==='remi',matrix=id==='hrlrt'&&selected%2===1?f[1].matrix||m:m,lo=Math.min(...finite(matrix.flat())),hi=Math.max(...finite(matrix.flat())),cols=matrix[0]?.length||1
  const mesh=(x:number,y:number,w:number,h:number)=>range(22).map(j=>{const c=Math.round(j/21*(cols-1)),values=matrix.map(row=>row[c]);return <path key={j} d={values.map((v,r)=>`${r?'L':'M'}${x+j/21*w+r/matrix.length*46},${y+h-r/matrix.length*h-(v-lo)/Math.max(.001,hi-lo)*65}`).join(' ')} fill="none" stroke={Math.abs(j/21-t)<.05?ink[1]:ink[0]} opacity={.3+j*.02} strokeWidth="1.4"/>})
  return <g data-method-visual={methodVisualKinds[id]}>{remi?<>{range(9).map(i=>node(i,`查看时间窗 ${i+1}`,<><rect x={65+i*74} y="60" width="63" height="65" rx="12" fill={glass} stroke={selected===i?ink[1]:'#c0dfe733'}/>{line(f[1].matrix?.[i]||[],73+i*74,88,46,25,ink[0],.8)}<text x={96+i*74} y="80" textAnchor="middle">{i+1}</text></>))}<path d={`M${96+selected%9*74} 135L400 185`} fill="none" stroke={ink[1]} strokeDasharray="3 6"/>{mesh(110,215,520,167)}</>:<>{mesh(90,135,535,230)}{picking?<>{(f[1].lines?.[0]||[]).map((v,i,a)=>Number.isFinite(v)?node(i,'拾取频点 '+(i+1),<circle cx={90+i/Math.max(1,a.length-1)*535} cy={120+(1-(v-100)/800)*90} r={selected===i?5:2.5} fill={selected===i?ink[1]:ink[0]}/>):null)}<text x="86" y="65">拾取路径</text><text x="590" y="431">有效频点</text></>:<>{[0,1].map(i=>node(i,i?'常规分辨率对照':'高分辨率模态',<><rect x={110+i*310} y="55" width="270" height="43" rx="14" fill={glass} stroke={selected%2===i?ink[1]:'#b0d5df33'}/><text x={245+i*310} y="81" textAnchor="middle">{i?'常规对照':'高分辨率'}</text></>))}</>}</>}
  </g>
 }
 if(id==='maps'){
  const a=waves[selected%Math.max(1,waves.length)]||[],total=f[1].lines?.[0]||[]
  return <g data-method-visual={methodVisualKinds[id]}><circle cx="126" cy="216" r="29" fill={glass} stroke={ink[1]}/><text x="126" y="221" textAnchor="middle">基准站</text>
   {range(Math.min(8,waves.length)).map(i=>node(i,`查看台站对 ${i+1}`,<><path d={`M155 216Q210 216 271 ${73+i*43}`} stroke={selected===i?ink[1]:ink[0]} strokeOpacity={selected===i?.9:.2} fill="none"/><circle cx="275" cy={73+i*43} r="13" fill={glass} stroke={selected===i?ink[1]:'#8bbac8'}/><text x="275" y={77+i*43} textAnchor="middle">{i+1}</text></>))}
   {panel(341,59,394,169,'双台相关')}{line(a,363,109,350,93)}{cursor(538,102,110)}{panel(341,254,394,166,'相关叠加')}{line(total,363,302,350,92,ink[1])}{cursor(538,298,102)}
  </g>
 }
 if(id==='surface-inversion'||id==='passive-inversion'){
  const models=f[0].lines||[],choice=Math.round(t*Math.max(0,models.length-1)),hi=Math.max(1,...models.flat())
  return <g data-method-visual={methodVisualKinds[id]}>{panel(66,50,356,380,'候选速度模型')}{models.map((a,j)=><path key={j} d={a.map((v,i)=>`${i?'L':'M'}${98+v/hi*192},${106+i/Math.max(1,a.length-1)*292}`).join(' ')} fill="none" stroke={j===choice?ink[1]:ink[0]} strokeWidth={j===choice?2.8:1} opacity={j===choice?1:.21}/>)}{range(6).map(i=>{const a=models[choice]||[],v=a[Math.min(a.length-1,i*10)]||0,w=29+v/hi*29,y=108+i*48;return <g key={i}><path d={`M325 ${y}l${w} -13 24 12-${w} 13Z`} fill={glass} stroke={ink[i%3]} strokeOpacity=".5"/><path d={`M325 ${y}v42l24 12v-42Z`} fill={ink[i%3]} fillOpacity=".2"/><path d={`M349 ${y+12}l${w} -13v42l-${w} 13Z`} fill={glass} stroke={ink[i%3]} strokeOpacity=".35"/></g>})}<text x="92" y="94">浅</text><text x="92" y="413">深</text>
   {panel(451,50,284,177,'频散约束')}{f[1].lines?.map((a,i)=>line(a,470,100,247,105,ink[i],i?.9:.55,i))}
   {panel(451,249,284,181,id==='passive-inversion'?'共振约束':'迭代收敛')}{f[2].lines?.map((a,i)=>line(a,470,300,247,104,ink[i],.85,i))}
  </g>
 }
 if(id==='section-imaging'||id==='cmp-ts'){
  const cmp=id==='cmp-ts',hi=Math.max(1,...m.flat()),lo=Math.min(...m.flat())
  return <g data-method-visual={methodVisualKinds[id]}>{cmp?range(10).map(i=><g key={i}><path d={`M${82+i*64} 75L${390+t*50} 170L${714-i*57} 75`} stroke={ink[i%3]} opacity=".23" fill="none"/><circle cx={82+i*64} cy="75" r="4" fill={ink[0]}/></g>):<path d="M82 119Q395 83 705 132" fill="none" stroke={ink[1]} strokeWidth="2"/>}
   {range(10).map(j=>{const row=m[Math.round(j/9*Math.max(0,m.length-1))]||[],top=row.map((v,i)=>[85+i/Math.max(1,row.length-1)*616,185+j*19+(v-lo)/Math.max(1,hi-lo)*27]);return <path key={j} d={top.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')+top.slice().reverse().map(([x,y])=>`L${x},${y+19}`).join(' ')+'Z'} fill={glass} stroke={ink[j%3]} strokeOpacity=".35"/>})}
   {cursor(85+t*616,156,246)}<text x="84" y="442">{cmp?'共中点叠加':'连续地层剖面'}</text><text x="561" y="442">切片 {q+1}</text>
  </g>
 }
 if(id==='hvsr')return <g data-method-visual={methodVisualKinds[id]}>{panel(65,61,285,352,'三分量振幅谱')}{f[1].lines?.map((a,i)=><g key={i}>{line(a,90,135+i*83,230,60,ink[i])}<text x="90" y={120+i*83}>{['X','Y','Z'][i]}</text></g>)}<path d="M366 237h46m-9-7 9 7-9 7" stroke={ink[1]} fill="none"/>{panel(431,61,311,352,'场地共振 · H/V')}{f[0].lines?.slice(0,-1).map((a,i)=>line(a,453,133,266,239,ink[0],.13,i,0,6))}{line(f[0].lines?.at(-1)||[],453,133,266,239,ink[1],1,50,0,6)}{cursor(453+t*266,109,273)}</g>
 if(id==='fh')return <g data-method-visual={methodVisualKinds[id]}>{range(6).map(i=>node(i,`积分环 ${i+1}`,<ellipse cx="291" cy="255" rx={50+i*31} ry={23+i*16} fill={i===0?glass:'none'} stroke={selected%6===i?ink[1]:ink[0]} strokeWidth={selected%6===i?2.5:1} opacity={selected%6===i?1:.3}/>))}{range(18).map(i=>{const a=i*Math.PI/9;return <circle key={i} cx={291+Math.cos(a)*205} cy={255+Math.sin(a)*103} r="4" fill={ink[0]}/>})}<path d={`M291 255L${291+Math.cos(t*Math.PI*2)*206} ${255+Math.sin(t*Math.PI*2)*104}`} stroke={ink[1]} strokeWidth="2"/>{panel(533,100,214,278,'径向积分响应')}{line(f[2].lines?.[0]||[],550,157,177,181,ink[1])}<text x="99" y="420">同心阵列 · 径向传播</text></g>
 if(id==='array-design')return <g data-method-visual={methodVisualKinds[id]}><path d="M92 134L516 63L703 213L282 404Z" fill={glass} stroke="#bfe1e9" strokeOpacity=".3"/>{range(9).map(i=>{const x=142+i%3*153+Math.floor(i/3)*34,y=156+Math.floor(i/3)*72-i%3*24;return node(i,`查看台站覆盖 ${i+1}`,<><ellipse cx={x} cy={y} rx={38+t*36} ry={19+t*18} fill={selected===i?'#dfc59616':'#9dd0d705'} stroke={selected===i?ink[1]:ink[0]} strokeOpacity={selected===i?.8:.24}/><path d={`M${x} ${y}v-22`} stroke={ink[0]}/><circle cx={x} cy={y-23} r="5" fill={selected===i?ink[1]:ink[0]}/></>)})}<text x="103" y="444">布设与覆盖 · 几何示意</text><text x="544" y="444">台站 {selected+1}</text></g>
 if(id==='event-detection'||id==='ps-pick'){
  const ps=id==='ps-pick',a=waves[selected%Math.max(1,waves.length)]||[],ratio=f[1].lines||[],channel=Math.min(3,waves.length),sample=Math.round(t*Math.max(0,a.length-1))
  return <g data-method-visual={methodVisualKinds[id]}>{panel(70,60,665,ps?340:187,ps?'三分量候选到时':'连续观测记录')}
   {ps?range(channel).map(i=><g key={i}>{line(waves[i],100,135+i*80,603,56,ink[i])}<text x="92" y={119+i*80}>{['X','Y','Z'][i]}</text><rect x={100+t*550} y={128+i*80} width="44" height="68" rx="10" fill="#e9d0a414" stroke={ink[1]} strokeOpacity=".6"/></g>):<>{line(a,100,114,603,105)}<rect x={100+t*525} y="104" width="78" height="126" rx="12" fill="#e4c99b14" stroke={ink[1]} strokeOpacity=".5"/>{panel(70,270,665,155,'能量触发依据')}{ratio.map((v,i)=>line(v,100,312,603,83,ink[i],i?.5:1,i,0,Math.max(6,...ratio.flat())))}</>}
   <text x="99" y="452">样本 {sample+1}</text><text x="542" y="452">{ps?'到时需人工复核':'观察窗与门槛分离'}</text>
  </g>
 }
 if(id==='velocity-model'){
  const volume=f[1].matrix||[],lo=Math.min(...volume.flat()),hi=Math.max(...volume.flat()),col=Math.round(t*Math.max(0,(volume[0]?.length||1)-1))
  return <g data-method-visual={methodVisualKinds[id]}><path d="M174 154L437 72L659 171L393 261ZM174 154V356L393 443V261M393 443L659 349V171" fill={glass} stroke="#acd3df" strokeOpacity=".38"/>
   {range(12).map(i=>{const y=155+i*16,v=volume[Math.round(i/11*(volume.length-1))]?.[col]||0;return <path key={i} d={`M${174+t*263} ${y-t*82}L${393+t*266} ${y+107-t*90}`} fill="none" stroke={ink[0]} strokeWidth="12" opacity={.13+(v-lo)/Math.max(1,hi-lo)*.38}/>})}
   <path d={`M${174+t*263} ${154-t*82}L${393+t*266} ${261-t*90}V${443-t*94}L${174+t*263} ${356-t*80}Z`} fill="#e6cba419" stroke={ink[1]} strokeWidth="1.6"/>
   <text x="98" y="77">纵向切片</text><text x="579" y="413">截面 {col+1}</text>
  </g>
 }
 if(id==='magnitude-energy')return <g data-method-visual={methodVisualKinds[id]}>{panel(61,62,444,355,'位移谱与拐角拟合')}{f[0].lines?.map((a,i)=>line(a,88,129,388,250,ink[i],i?.9:.62,i))}{cursor(88+t*388,110,278)}{panel(531,62,206,355,'事件相对属性')}{(f[1].points||[]).slice(0,18).map(([x,y,g],i)=>node(i,`参考事件 ${i+1}`,<circle cx={563+x/100*143} cy={124+y/100*255} r={3+g*2} fill={selected===i?ink[1]:ink[0]} opacity={selected===i?1:.4}/>))}</g>
 if(id==='stress-inversion')return <g data-method-visual={methodVisualKinds[id]}><g transform={`translate(306 242) rotate(${position*1.8})`}><ellipse rx="164" ry="103" fill={glass} stroke="#cae3e9" strokeOpacity=".4"/>{range(7).map(i=><ellipse key={i} rx={36+i*19} ry="103" fill="none" stroke="#abd4dc" strokeOpacity=".15"/>)}{[0,120,240].map((angle,i)=><g key={i} transform={`rotate(${angle})`}><path d="M0 -188V-32m-7-13 7 13 7-13" stroke={ink[i]} strokeWidth="3" fill="none"/><text x="10" y="-161">σ{i+1}</text></g>)}</g>{panel(523,93,217,305,'方向失配')}{line(f[2].lines?.[0]||[],545,149,172,207,ink[1])}<text x="164" y="443">主应力构型 · 参考方向</text></g>
 if(id==='permeability')return <g data-method-visual={methodVisualKinds[id]}><ellipse cx="390" cy="251" rx="286" ry="158" fill={glass} stroke="#b4dae0" strokeOpacity=".23" strokeDasharray="3 7"/>{range(8).map(i=>{const y=139+i*29,d=`M101 ${y}C254 ${y-82},292 ${350-i*19},409 ${250+i*8}S584 ${122+i*23},702 ${160+i*24}`;return node(i,'连通路径 '+(i+1),<><path d={d} stroke={selected===i?ink[1]:ink[0]} strokeWidth={selected===i?5:2} fill="none" opacity={selected===i?.8:.28}/><path className="domain-flow-path" d={d} stroke={selected===i?'#fff0cc':ink[0]} strokeDasharray="2 21" strokeWidth="3" fill="none" opacity=".8"/></>)})}{cursor(125+t*560,90,320)}<text x="80" y="71">连通簇</text><text x="541" y="438">影响体积 · 路径示意</text></g>
 if(id==='event-attributes'){
  const density=f[1].matrix||[],col=Math.round(t*Math.max(0,(density[0]?.length||1)-1)),a=f[2].lines||[]
  return <g data-method-visual={methodVisualKinds[id]}>{panel(65,53,671,255,'时段—深度演变')}{range(38).map(i=>{const c=Math.round(i/37*((density[0]?.length||1)-1)),column=density.map(r=>r[c]),peak=Math.max(...column),depth=column.indexOf(peak);return node(i,'观察时段 '+(i+1),<><path d={`M${98+i*16} 113V${125+depth*4.2}`} stroke={ink[0]} strokeOpacity=".13"/><circle cx={98+i*16} cy={125+depth*4.2} r={3+peak*7} fill={c<=col?ink[i%7===0?1:0]:'#658994'} opacity={c<=col?.76:.15}/></>)})}{cursor(98+t*592,95,185)}{panel(65,328,671,105,'数量 / 能量')}{a.map((v,i)=>line(v,220,352,493,62,ink[i],.86,i))}</g>
 }
 if(id==='multi-risk'){
  const lines=f.find(x=>x.lines)?.lines||[]
  return <g data-method-visual={methodVisualKinds[id]}>{['位移','微震','降雨'].map((name,i)=>node(i,`查看${name}证据`,<>{panel(66,60+i*125,387,108,name)}{line(lines[i]||[],152,88+i*125,271,57,ink[i],.9,i)}<path d={`M463 ${113+i*125}C527 ${113+i*125} 549 238 600 238`} fill="none" stroke={selected===i?ink[1]:ink[i]} opacity={selected===i?1:.3} strokeWidth={selected===i?2.5:1.2}/></>))}{cursor(152+t*271,89,306)}<circle cx="646" cy="238" r="47" fill={glass} stroke={ink[1]} strokeOpacity=".65"/><circle cx="646" cy="238" r="65" fill="none" stroke={ink[1]} strokeOpacity=".15"/><text x="646" y="243" textAnchor="middle">关联风险</text></g>
 }
 return null
}
