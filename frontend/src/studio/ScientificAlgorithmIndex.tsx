import {useMemo,useState} from 'react'
import {FolderOpen,Search,ArrowRight,FunctionSquare,FileChartColumn} from 'lucide-react'
import {algorithmSpecs} from './algorithms'
import {moduleCatalog} from '../data/catalog'
import {analysisGroups,computeAnalysis,defaultDataset,defaultParams,localMethods} from './analysisEngine'
import {computeSpac,spacDefaults,spacSource} from './spacSampleEngine'
import type {Figure} from './analysisEngine'
import {AnalysisFigure} from './AnalysisFigure'
import {WorkbenchStatus} from './ScientificUI'

export function ScientificAlgorithmIndex({group,setGroup,query,setQuery,onOpen,count}:{group:string;setGroup:(v:string)=>void;query:string;setQuery:(v:string)=>void;onOpen:(id:string)=>void;count:number}){
 const [selected,setSelected]=useState('phase-shift-active')
 const list=algorithmSpecs.filter(a=>(group==='全部'||analysisGroups.find(g=>g.name===group)?.ids.includes(a.id))&&`${moduleCatalog.find(m=>m.id===a.id)?.name} ${a.output}`.toLowerCase().includes(query.toLowerCase()))
 const current=list.find(a=>a.id===selected)||list[0]
 const output=useMemo(()=>{
  if(!current)return null
  if(current.id==='spac'){const result=computeSpac({dataset:'SPAC-A01',params:spacDefaults});return {figures:[{kind:'heat',title:'SPAC 频散能量',x:'频率 / Hz',y:'相速度 / m·s⁻¹',matrix:result.energy.filter((_,i)=>i%3===0).map(row=>row.filter((_,i)=>i%2===0)),range:[2,30,100,1000]} as Figure],metrics:[{label:'通道',value:'7',unit:'道'},{label:'频带',value:'2–30',unit:'Hz'},{label:'距离组',value:'3',unit:'组'}],method:'空间自相关系数与 J₀ 模型匹配',source:spacSource}}
  return computeAnalysis({id:current.id,dataset:defaultDataset(current.id),params:defaultParams(current.id),excluded:[]})
 },[current?.id])
 return <section className="science-methods"><header className="science-page-title"><h1>算法</h1><span>{algorithmSpecs.length} 个方法 · {count} 份归档</span></header><div className="science-method-layout"><aside className="science-tree"><h2><FolderOpen size={16}/>方法库</h2>{['全部',...analysisGroups.map(g=>g.name)].map(g=><button key={g} aria-pressed={group===g} onClick={()=>setGroup(g)}><span>{g}</span><small>{g==='全部'?algorithmSpecs.length:analysisGroups.find(a=>a.name===g)?.ids.length}</small></button>)}</aside><section className="science-method-list"><label className="science-search"><Search size={15}/><input aria-label="查找算法或成果" placeholder="查找方法" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="science-method-rows">{list.map(a=><button key={a.id} aria-pressed={current?.id===a.id} onClick={()=>setSelected(a.id)} onDoubleClick={()=>onOpen(a.id)}>{(localMethods.has(a.id)||a.id==='spac')?<FunctionSquare size={17}/>:<FileChartColumn size={17}/>}<span>{moduleCatalog.find(m=>m.id===a.id)?.name}</span><small>{(localMethods.has(a.id)||a.id==='spac')?'计算':'审阅'}</small></button>)}{!list.length&&<div className="empty">没有匹配的方法</div>}</div></section><section className="science-method-preview">{current&&output?<><div className="science-documentbar"><strong>{moduleCatalog.find(m=>m.id===current.id)?.name}</strong><button className="primary" onClick={()=>onOpen(current.id)}>打开独立窗口 <ArrowRight size={14}/></button></div><AnalysisFigure key={current.id} figure={output.figures[0]}/><div className="science-preview-metrics">{output.metrics.map(m=><span key={m.label}><small>{m.label}</small><b>{m.value} <em>{m.unit}</em></b></span>)}</div><details className="science-method-note"><summary>方法与数据来源</summary><p>{output.method}</p><p>{output.source}</p></details></>:<div className="empty">选择一个方法</div>}</section></div><WorkbenchStatus><span>{list.length} 个可见方法</span><span>双击方法打开独立窗口</span></WorkbenchStatus></section>
}
