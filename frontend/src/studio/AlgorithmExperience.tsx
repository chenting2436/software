import {RotationControl} from './RotationControl'
import {AlgorithmPresentation} from './AlgorithmPresentation'
import {presentationProfiles} from './presentationProfiles'
import {useMemo,useState} from 'react'
import {ArrowUpRight,ChevronLeft,ChevronRight,Layers3,LocateFixed,Mountain,Radio,Rotate3D,Waves} from 'lucide-react'
import type {AnalysisOutput} from './analysisEngine'
import {DispersionSurface} from './DispersionSurface'
import {ResultSpatialScene,type SpatialLayers} from './ResultSpatialScene'
export const experienceIds=new Set(Object.keys(presentationProfiles))
export function energyPeak(output:AnalysisOutput){
 const f=output.figures[0],m=f.matrix||[],bounds=f.range||[0,1,0,1];let row=0,col=0
 for(let r=0;r<m.length;r++)for(let c=0;c<m[r].length;c++)if(m[r][c]>(m[row]?.[col]??-Infinity)){row=r;col=c}
 return {frequency:bounds[0]+col/Math.max(1,(m[0]?.length||1)-1)*(bounds[1]-bounds[0]),velocity:bounds[2]+row/Math.max(1,m.length-1)*(bounds[3]-bounds[2]),energy:m[row]?.[col]||0}
}
export function AlgorithmExperience(props:{output:AnalysisOutput;selected:number;onSelect:(i:number)=>void;onCursor:(n:number)=>void;onProfessional:(i:number)=>void}){return ['phase-shift-active','event-location','slope-stability'].includes(props.output.id)?<SpatialExperience {...props}/>:<AlgorithmPresentation output={props.output} onProfessional={props.onProfessional} onCursor={props.onCursor}/>}
function SpatialExperience({output,selected,onSelect,onCursor,onProfessional}:{output:AnalysisOutput;selected:number;onSelect:(i:number)=>void;onCursor:(n:number)=>void;onProfessional:(i:number)=>void}){
 const phase=output.id==='phase-shift-active',location=output.id==='event-location'
 const [surfaceMode,setSurfaceMode]=useState<'surface'|'ridge'|'slices'>('surface'),[layers,setLayers]=useState<SpatialLayers>({ground:true,paths:true,context:true}),[condition,setCondition]=useState(0),[series,setSeries]=useState(0)
 const peak=useMemo(()=>energyPeak(output),[output]),points=output.figures.find(f=>f.kind==='scatter')?.points||[],eventIndex=selected%Math.max(1,points.length),event=points[eventIndex]||[0,0,0],residual=output.figures[1].lines?.[0]||[]
 const factor=output.figures[1].lines?.[series]?.[condition]
 return <div className="algorithm-experience" data-experience={output.id}>
  <div className="experience-layout">
   <section className="experience-stage">
    <div className="experience-stage-heading"><span>{phase?'能量聚焦':location?'震源定位':'边坡剖面'}</span><RotationControl/></div>
    {phase?<DispersionSurface figure={output.figures[0]} mode={surfaceMode} onCursor={onCursor}/>:<ResultSpatialScene output={output} selected={eventIndex} layers={layers} onSelect={onSelect}/>}
    <div className="experience-layer-bar" aria-label="空间视图图层">
     {phase?([['surface','能量面'],['ridge','脊线'],['slices','切片']] as const).map(([key,title])=><button key={key} aria-pressed={surfaceMode===key} onClick={()=>setSurfaceMode(key)}><Layers3 size={14}/>{title}</button>):([['ground',location?'地层':'岩体'],['paths',location?'传播路径':'候选滑面'],['context',location?'台站与事件':'地下水']] as const).map(([key,title])=><button key={key} aria-pressed={layers[key]} onClick={()=>setLayers(v=>({...v,[key]:!v[key]}))}><Layers3 size={14}/>{title}</button>)}
    </div>
   </section>
   <aside className="experience-rail" aria-label="成果概览">
    {phase?<>
     <div className="experience-panel peak-panel"><Waves size={21}/><span>聚焦峰值</span><div className="experience-number">{peak.velocity.toFixed(0)}<small>m/s</small></div><div className="experience-pair"><span>{peak.frequency.toFixed(1)} Hz</span><span>聚焦 {(peak.energy*100).toFixed(1)}%</span></div><div className="energy-swatch"/></div>
     <button className="experience-panel experience-link" onClick={()=>onProfessional(2)}><Radio size={19}/><span>接收波形<small>{output.figures[2].lines?.length||0} 个有效通道</small></span><ArrowUpRight size={16}/></button>
     <button className="experience-panel experience-link" onClick={()=>onProfessional(1)}><Waves size={19}/><span>速度随频率变化<small>逐频峰值</small></span><ArrowUpRight size={16}/></button>
    </>:location?<>
     <div className="experience-panel event-picker"><LocateFixed size={21}/><span>事件</span><div className="event-number"><button aria-label="上一个事件" disabled={points.length<2} onClick={()=>onSelect((eventIndex-1+points.length)%points.length)}><ChevronLeft size={17}/></button><strong>{String(eventIndex+1).padStart(2,'0')}<small> / {points.length}</small></strong><button aria-label="下一个事件" disabled={points.length<2} onClick={()=>onSelect((eventIndex+1)%points.length)}><ChevronRight size={17}/></button></div><div className="event-coordinates"><span><small>东向</small>{event[0].toFixed(1)}<em>m</em></span><span><small>北向</small>{event[1].toFixed(1)}<em>m</em></span></div></div>
     <button className="experience-panel station-summary" onClick={()=>onProfessional(1)}><span><Radio size={17}/>台站到时<ArrowUpRight size={14}/></span><div className="station-bars">{residual.map((v,i)=><i key={i} style={{height:12+Math.abs(v)*9,opacity:.4+Math.abs(v)*.13}}/>)}</div><small>{residual.length} 台站 · 查看残差</small></button>
     <button className="experience-panel experience-link" onClick={()=>onProfessional(2)}><LocateFixed size={19}/><span>事件平面分布<small></small></span><ArrowUpRight size={16}/></button>
    </>:<>
     <div className="experience-panel slope-condition"><Mountain size={21}/><span>工况</span><div className="condition-tabs">{['A','B'].map((s,i)=><button key={s} aria-pressed={series===i} onClick={()=>setSeries(i)}>系列 {s}</button>)}</div><div className="factor-gauge"><svg viewBox="0 0 180 112" role="img" aria-label={'安全系数 '+factor?.toFixed(2)}><path d="M25 94A65 65 0 0 1 155 94" fill="none" stroke="#86acbc" strokeOpacity=".15" strokeWidth="9" strokeLinecap="round"/><path d="M25 94A65 65 0 0 1 155 94" fill="none" stroke="#c4d5c6" strokeWidth="9" strokeLinecap="round" pathLength="100" strokeDasharray={Math.min(100,((factor||0)/2)*100)+' 100'}/><text x="90" y="80" textAnchor="middle">{factor?.toFixed(2)}</text><text className="gauge-label" x="90" y="103" textAnchor="middle">安全系数</text></svg></div><div className="condition-dots" aria-label="选择工况">{Array.from({length:6},(_,i)=><button key={i} aria-pressed={condition===i} aria-label={'工况 '+(i+1)} onClick={()=>setCondition(i)}>{i+1}</button>)}</div></div>
     <button className="experience-panel experience-link" onClick={()=>onProfessional(1)}><Waves size={19}/><span>工况对照<small></small></span><ArrowUpRight size={16}/></button>
     <button className="experience-panel experience-link" onClick={()=>onProfessional(0)}><Mountain size={19}/><span>剖面与候选滑面<small></small></span><ArrowUpRight size={16}/></button>
    </>}
   </aside>
  </div>
 </div>
}
