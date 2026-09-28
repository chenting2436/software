import {useEffect,useState,type Dispatch,type SetStateAction} from 'react'
import {Activity,ArrowLeft,Check,Columns2,FileText,HelpCircle,History,Home,Pin,Undo2,X} from 'lucide-react'
import {RibbonGroup,ScienceIcon,Tool,Modal} from './DesktopControls'
import {AnalysisFigure} from './AnalysisFigure'
import {AnalysisReviewAction} from './AnalysisReviewAction'
import {algorithmDesktopProfiles,activeAnalysisParams,channelCountFor,canMarkFigure,isSpatialFigure} from './algorithmDesktopProfiles'
import {specFor} from './algorithms'
import {datasetsFor,defaultParams,parameterMax,type AnalysisOutput,type AnalysisRequest,type Figure} from './analysisEngine'
import {exportFile,exportCSV} from './store'
import {goWorkspace} from './navigation'
import './spacWorkbench.css'
import './algorithmDesktop.css'

interface Archive {id:string;version:number;time:string;digest:string}
interface Props {
 id:string;name:string;deviceId?:string;taskId?:string
 request:AnalysisRequest;activeRequest:AnalysisRequest;output:AnalysisOutput
 setRequest:Dispatch<SetStateAction<AnalysisRequest>>
 busy:boolean;changed:boolean;allowed:boolean;notice:string;savedId:string;duration:number
 archive:Archive[];baseline:AnalysisOutput|null;compareId:string;setCompareId:(id:string)=>void
 baselineAnnotations:number[];annotations:number[];onAnnotations:(v:number[])=>void
 onRun:()=>void;onSave:()=>void;onExport:()=>void;onBack:()=>void;onDismiss:()=>void
}
type Dialog='data'|'params'|'source'|'records'|'markers'|'replace'|null

export function AlgorithmDesktop(p:Props){
 const profile=algorithmDesktopProfiles[p.id],spec=specFor(p.id),computed=p.output.mode==='computed'
 const [primary,setPrimary]=useState(0),[dual,setDual]=useState(false),[secondary,setSecondary]=useState(1),[comparison,setComparison]=useState(false)
 const [cursor,setCursor]=useState(-1),[selected,setSelected]=useState(0),[slice,setSlice]=useState(100)
 const [menu,setMenu]=useState(''),[dialog,setDialog]=useState<Dialog>(null),[marking,setMarking]=useState(false),[reset,setReset]=useState(0)
 const [draft,setDraft]=useState<AnalysisRequest>(p.request),[formError,setFormError]=useState(''),[point,setPoint]=useState(50)
 const figure=p.output.figures[primary],editable=p.allowed&&!p.busy&&!p.changed
 const currentArchive=p.archive.find(a=>a.id===p.savedId),baselineArchive=p.archive.find(a=>a.id===p.compareId)
 const params=spec.params.filter(v=>activeAnalysisParams[p.id]?.includes(v[0])),channelCount=channelCountFor(p.id)
 const canMark=canMarkFigure(figure),spatial=isSpatialFigure(figure)
 const open=(name:Dialog)=>{setDraft(structuredClone(p.request));setFormError('');setDialog(name);setMenu('')}
 const close=()=>{setDialog(null);setMenu('')}
 const selectView=(index:number)=>{setPrimary(index);if(index===secondary)setSecondary((index+1)%3);setComparison(false);setCursor(-1);setMarking(false);setMenu('')}
 const resetView=()=>{setReset(v=>v+1);setCursor(-1);setSlice(100);setSelected(0);setMarking(false)}
 const requestRun=()=>{setMenu('');if(p.annotations.length)open('replace');else{close();p.onRun()}}
 const undo=()=>p.onAnnotations(p.annotations.slice(0,-1))
 const addMarker=(n:number)=>{if(editable&&Number.isFinite(n)&&n>=0&&n<=1)p.onAnnotations([...p.annotations,n].slice(-16))}
 const applyParameters=()=>{
  for(const param of params){const value=draft.params[param[0]];if(!Number.isFinite(value)||value<param[2]||value>parameterMax(p.id,param[0],param[3])){setFormError(`${param[0]}：请输入 ${param[2]}–${parameterMax(p.id,param[0],param[3])} 之间的数值。`);return}}
  if(p.id==='phase-shift-active'&&draft.params['最低相速度']>=draft.params['最高相速度']){setFormError('最低相速度必须小于最高相速度。');return}
  if(p.id==='event-detection'&&draft.params['STA 窗长']>=draft.params['LTA 窗长']){setFormError('STA 窗长必须小于 LTA 窗长。');return}
  if(channelCount&&channelCount-draft.excluded.length<(p.id==='beamforming'?3:2)){setFormError(p.id==='beamforming'?'至少保留三个台站。':'至少保留两个有效输入。');return}
  p.setRequest(draft);close()
 }
 const trace=()=>goWorkspace({page:'trace',task:p.savedId||p.taskId,device:p.deviceId,tab:'成果证据链'})
 const exportStructured=()=>exportFile(`${p.id}-${p.output.digest}.json`,JSON.stringify({request:p.activeRequest,result:p.output,annotations:p.annotations},null,2))
 const exportMarkers=()=>exportCSV(`${p.id}-${p.output.digest}-解释标记.csv`,['编号','归一化横轴','成果指纹'],p.annotations.map((v,i)=>[i+1,v,p.output.digest]))
 const exportFigureData=()=>{
  if(figure.matrix)exportCSV(`${p.id}-${primary+1}-矩阵.csv`,['行序号',...figure.matrix[0].map((_,i)=>`列 ${i+1}`)],figure.matrix.map((v,i)=>[i+1,...v]))
  else if(figure.lines)exportCSV(`${p.id}-${primary+1}-曲线.csv`,['采样序号',...figure.lines.map((_,i)=>figure.labels?.[i]||`曲线 ${i+1}`)],Array.from({length:Math.max(...figure.lines.map(v=>v.length))},(_,i)=>[i,...figure.lines!.map(v=>Number.isFinite(v[i])?v[i]:'')]))
  else exportStructured()
 }
 useEffect(()=>{setMarking(false)},[p.output.digest])
 const menus:Record<string,{name:string;run:()=>void;disabled?:boolean}[]>={
  '文件':[{name:computed?'打开内置数据…':'选择参考记录…',run:()=>open('data')},{name:'保存成果版本',run:p.onSave,disabled:!editable||!!p.savedId},{name:'导出报告',run:p.onExport},{name:'导出结构化成果',run:exportStructured},{name:'返回算法目录',run:p.onBack}],
  [profile.menu]:[...profile.views.map((name,i)=>({name,run:()=>selectView(i)})),{name:computed?'分析参数…':'模型记录…',run:()=>open('params')},{name:computed?'运行分析':'载入参考成果',run:requestRun,disabled:!p.allowed||p.busy}],
  '标记':[{name:'图面标记',run:()=>{setMarking(v=>!v);setComparison(false)},disabled:!editable||!canMark},{name:'解释标记…',run:()=>open('markers')},{name:'撤销标记',run:undo,disabled:!editable||!p.annotations.length},{name:'导出标记',run:exportMarkers,disabled:!p.annotations.length}],
  '显示':[{name:dual?'单图显示':'双图联看',run:()=>{setDual(v=>!v);setComparison(false)}},{name:'复位图面',run:resetView},...profile.views.map((name,i)=>({name,run:()=>selectView(i)}))],
  '成果':[{name:'版本对比',run:()=>setComparison(v=>!v)},{name:'输入记录…',run:()=>open('records')},{name:'输入追溯',run:trace,disabled:!p.savedId&&!p.taskId},{name:figure.matrix?'导出当前矩阵':figure.lines?'导出当前曲线':'导出成果数据',run:exportFigureData}],
  '帮助':[{name:'数据与方法',run:()=>open('source')}],
 }
 // Legacy authored scatter scenes store normalized display coordinates, not field measurements.
 const displayFigure=(f:Figure):Figure=>f.kind==='scatter'&&!f.range?{...f,x:'横向位置 / 归一化',y:'纵向位置 / 归一化',range:[0,1,0,1]}:f
 const plot=(index:number,output=p.output,compare=false)=><AnalysisFigure key={`${output.digest}/${index}/${reset}/${compare}`} figure={displayFigure(output.figures[index])} cursor={cursor} onCursor={setCursor} onPick={!compare&&!comparison&&marking&&editable?addMarker:undefined} slice={slice} selected={selected} onSelect={setSelected} compare={compare} annotations={compare?p.baselineAnnotations:p.annotations} responsive/>
 return <main className="spac-desktop algorithm-desktop" data-algorithm={p.id} onPointerDown={e=>{if(!(e.target as HTMLElement).closest('.spac-menu'))setMenu('')}} onKeyDown={e=>{if(e.key==='Escape')setMenu('')}}>
  <section className="spac-application" aria-label={`${p.name}独立工作窗口`}>
   <header className="spac-titlebar"><span className="spac-app-icon"><Activity size={17}/></span><h1>{p.name}</h1><span className="spac-title-meta">矿大{p.deviceId&&` / ${p.deviceId}`}</span><button onClick={p.onBack}><ArrowLeft size={13}/>返回算法目录</button></header>
   <nav className="spac-menubar" aria-label="算法菜单">{Object.entries(menus).map(([name,items])=><div className="spac-menu" key={name}><button className={name==='文件'?'spac-file-menu':''} aria-expanded={menu===name} onClick={()=>setMenu(menu===name?'':name)}>{name}</button>{menu===name&&<div className="spac-dropdown">{items.map(item=><button key={item.name} disabled={item.disabled} onClick={()=>{setMenu('');item.run()}}>{item.name}</button>)}</div>}</div>)}<span>{profile.code}</span></nav>
   <div className="spac-ribbon" aria-label="独立算法工具栏">
    <RibbonGroup name="文件"><Tool name="打开" kind="folder" onClick={()=>open('data')}/><Tool name={p.savedId?'已归档':'归档'} kind="save" disabled={!editable||!!p.savedId} onClick={p.onSave}/></RibbonGroup>
    <RibbonGroup name={profile.menu}>{profile.views.map((name,i)=><Tool key={name} name={name} kind={profile.icons[i]} active={!comparison&&primary===i} onClick={()=>selectView(i)}/>)}</RibbonGroup>
    <RibbonGroup name={computed?'处理':'模型'}><div className="algorithm-method-block"><strong>{profile.code}</strong><span>{p.request.dataset}</span><small>{computed?'本地处理':'参考模型'}</small></div><Tool name={computed?'参数':'模型记录'} kind="params" onClick={()=>open('params')}/><Tool name={p.busy?'处理中':computed?'运行':'载入'} kind="run" disabled={!p.allowed||p.busy} onClick={requestRun}/></RibbonGroup>
    <RibbonGroup name="图面"><Tool name="标记" kind="pick" active={marking} disabled={!editable||!canMark||comparison} onClick={()=>setMarking(v=>!v)}/><div className="algorithm-tool-stack"><button aria-pressed={dual&&!comparison} onClick={()=>{setDual(v=>!v);setComparison(false)}}><Columns2 size={15}/>{dual?'单图':'双图'}</button><button onClick={resetView}><Home size={15}/>复位</button><button disabled={!editable||!p.annotations.length} onClick={undo}><Undo2 size={15}/>撤销</button></div></RibbonGroup>
    <RibbonGroup name="成果"><Tool name="版本对比" kind="save" active={comparison} onClick={()=>setComparison(v=>!v)}/><Tool name="导出报告" kind="export" onClick={p.onExport}/><div className="algorithm-tool-stack"><button onClick={()=>open('records')}><FileText size={15}/>输入记录</button><button disabled={!p.savedId&&!p.taskId} onClick={trace}><History size={15}/>输入追溯</button><button onClick={()=>open('source')}><HelpCircle size={15}/>数据与方法</button></div></RibbonGroup>
   </div>
   <div className="spac-documentbar"><span className="spac-document-tab"><FileText size={14}/>{p.activeRequest.dataset} / {profile.code}{p.changed&&<b>*</b>}</span><span className="spac-project-meta">{p.output.metrics.slice(0,3).map(m=><span key={m.label} title={m.label}>{m.label} {m.value} {m.unit}</span>)}</span></div>
   {p.changed&&<div className="spac-pending"><span>输入已修改 · 图面仍为上次结果</span><button disabled={p.busy} onClick={()=>p.setRequest(structuredClone(p.activeRequest))}>撤回修改</button><button disabled={!p.allowed||p.busy} onClick={requestRun}>{computed?'重新计算':'重新载入'}</button></div>}
   {p.notice&&<div className="spac-notification" role="status">{p.notice}<button aria-label="关闭提示" onClick={p.onDismiss}><X size={13}/></button></div>}
   <div className="spac-workspace">
    <div className="spac-figure-head"><strong>{comparison?'版本对比':figure.title}</strong><div className="algorithm-figure-tools">
     {comparison?<><select aria-label="对比成果版本" value={p.compareId} onChange={e=>p.setCompareId(e.target.value)}><option value="">选择归档版本</option>{p.archive.map(v=><option key={v.id} value={v.id}>V{v.version} · {v.time} · {v.digest}</option>)}</select><button onClick={()=>setComparison(false)}>返回图面</button></>:<>
      {spatial&&<label>显示范围<input aria-label="空间显示范围" type="range" min="10" max="100" value={slice} onChange={e=>setSlice(+e.target.value)}/><output>{slice}%</output></label>}
      {figure.kind==='mechanism'&&<label>视图旋转<select aria-label="机制视图旋转" value={selected%6} onChange={e=>setSelected(+e.target.value)}>{[0,1,2,3,4,5].map(i=><option value={i} key={i}>{i*12}°</option>)}</select></label>}
      {figure.kind==='slope'&&<label>候选滑面<select aria-label="候选滑面" value={selected%7} onChange={e=>setSelected(+e.target.value)}>{[0,1,2,3,4,5,6].map(i=><option value={i} key={i}>S{i+1}</option>)}</select></label>}
      {marking&&<span className="algorithm-mark-mode"><Pin size={12}/>点击横轴位置标记</span>}
      <button onClick={()=>open('markers')} title="联动解释标记"><Pin size={14}/>{p.annotations.length}</button>
     </>}
    </div></div>
    <div className={`algorithm-figures ${comparison||dual?'paired':''}`}>
     <article className="algorithm-primary-figure">{(dual||comparison)&&<header>{comparison?`当前 / ${p.output.digest}`:profile.views[primary]}</header>}{plot(primary)}</article>
     {comparison?<article><header>{baselineArchive?`V${baselineArchive.version} / ${baselineArchive.digest}`:'历史成果'}</header>{p.baseline?plot(primary,p.baseline,true):<div className="algorithm-empty"><ScienceIcon kind="save"/><p>{p.archive.length?'选择上方归档版本':'暂无归档版本'}</p><button disabled={!editable||!!p.savedId} onClick={p.onSave}>归档当前成果</button></div>}</article>:dual&&<article><header><select aria-label="联看图面" value={secondary} onChange={e=>setSecondary(Number(e.target.value))}>{profile.views.map((name,i)=>i===primary?null:<option value={i} key={name}>{name}</option>)}</select></header>{plot(secondary)}</article>}
    </div>
    <div className="spac-result-tabs" role="tablist" aria-label="算法成果视图">{profile.views.map((v,i)=><button key={v} role="tab" aria-selected={primary===i&&!comparison} title={p.output.figures[i].title} onClick={()=>selectView(i)}>{v}</button>)}<button role="tab" aria-selected={comparison} onClick={()=>setComparison(true)}>版本对比</button><span>{currentArchive?`V${currentArchive.version}`:'工作副本'} · {p.output.digest}</span></div>
   </div>
   <footer className="spac-statusbar"><span className="spac-ready"><Check size={13}/>{p.busy?'正在处理':p.changed?'输入待运行':p.savedId?'已归档':!p.allowed?'只读':'就绪'}</span><span>{cursor>=0&&canMark?`${figure.x.split('/')[0]} ${(figure.range?figure.range[0]+cursor*(figure.range[1]-figure.range[0]):cursor*Math.max(1,...(figure.lines||[]).map(a=>a.length-1))).toFixed(2)}`:spatial?'拖动旋转 · Ctrl + 滚轮缩放':profile.code}</span><span>{spatial||figure.kind==='scatter'?`对象 ${String(selected+1).padStart(2,'0')}`:`${p.annotations.length} 个标记`}</span><div><span>{computed?'合成校验数据':'内置参考模型'}{p.duration>0&&` · ${p.duration.toFixed(0)} ms`}</span><button onClick={()=>open('source')}>帮助</button></div></footer>
  </section>

  {dialog==='data'&&<Modal title={computed?'打开数据':'选择参考记录'} onClose={close} footer={<><button onClick={close}>取消</button><button disabled={!p.allowed||p.busy} onClick={()=>{p.setRequest(v=>({...v,dataset:draft.dataset}));close()}}>打开</button></>}><div className="spac-data-choices">{datasetsFor(p.id).map(d=><button key={d.id} className={draft.dataset===d.id?'selected':''} onClick={()=>setDraft(v=>({...v,dataset:d.id}))}><ScienceIcon kind={profile.icons[0]}/><span><strong>{d.name}</strong><small>{computed?d.source:'内置参考记录 · 固定模型'}</small></span></button>)}</div><p className="spac-dialog-note">切换输入后需{computed?'运行':'载入'}，原图面与归档保持不变。</p></Modal>}
  {dialog==='params'&&<Modal title={computed?`${profile.menu}参数`:'模型记录'} onClose={close} footer={<><button onClick={close}>关闭</button>{computed&&<><button disabled={!p.allowed||p.busy} onClick={()=>setDraft(v=>({...v,params:Object.fromEntries(Object.entries(defaultParams(p.id)).filter(([k])=>activeAnalysisParams[p.id]?.includes(k))),excluded:[]}))}>默认值</button><button disabled={!p.allowed||p.busy} onClick={applyParameters}>应用</button></>}</>}>
   {computed?<><fieldset disabled={!p.allowed||p.busy}><legend>处理参数</legend>{params.map(v=><label key={v[0]} className="spac-form-row"><span>{v[0]}</span><input type="number" aria-label={v[0]} min={v[2]} max={parameterMax(p.id,v[0],v[3])} step={v[2]<1?.01:1} value={Number.isFinite(draft.params[v[0]])?draft.params[v[0]]:''} onChange={e=>setDraft(s=>({...s,params:{...s.params,[v[0]]:e.target.value===''?NaN:Number(e.target.value)}}))}/><small>{v[4]}</small></label>)}{!params.length&&<p>此方法使用固定处理配置；可选择有效输入。</p>}</fieldset>{channelCount>0&&<fieldset disabled={!p.allowed||p.busy}><legend>{p.id==='hvsr'?'有效窗口':p.id==='beamforming'?'有效台站':'有效通道'} · {channelCount-draft.excluded.length}/{channelCount}</legend><div className="algorithm-channel-grid">{Array.from({length:channelCount},(_,i)=>`CH-${String(i+1).padStart(2,'0')}`).map((c,i)=><label key={c}><input type="checkbox" checked={!draft.excluded.includes(c)} onChange={e=>setDraft(v=>({...v,excluded:e.target.checked?v.excluded.filter(x=>x!==c):[...v.excluded,c]}))}/>{p.id==='hvsr'?`窗 ${i+1}`:c}</label>)}</div></fieldset>}<p className="spac-dialog-note">应用后点击“运行”更新结果。只列出当前本地处理实际使用的参数。</p></>:<><dl><dt>记录</dt><dd>{p.activeRequest.dataset}</dd><dt>版本</dt><dd>{p.output.version}</dd><dt>指纹</dt><dd>{p.output.digest}</dd></dl><p>{p.output.method}</p><p className="spac-dialog-note">固定成果可旋转、切片、联看、标记和归档；视图操作不重新求解工程模型。</p></>}
   {formError&&<p role="alert" className="algorithm-form-error">{formError}</p>}
  </Modal>}
  {dialog==='markers'&&<Modal title="解释标记" onClose={close} footer={<><button disabled={!p.annotations.length} onClick={exportMarkers}>导出 CSV</button><button onClick={close}>关闭</button></>}><div className="algorithm-marker-add"><label>横轴位置 / %<input aria-label="标记横轴百分比" type="number" min="0" max="100" step=".1" value={Number.isFinite(point)?point:''} onChange={e=>setPoint(e.target.value===''?NaN:+e.target.value)}/></label><button disabled={!editable||!Number.isFinite(point)||point<0||point>100} onClick={()=>addMarker(point/100)}>添加</button></div><div className="algorithm-marker-list">{p.annotations.map((n,i)=><div key={i}><button onClick={()=>{setCursor(n);close()}}>P{i+1}<span>{(n*100).toFixed(2)}%</span></button><button aria-label={`删除标记 ${i+1}`} disabled={!editable} onClick={()=>p.onAnnotations(p.annotations.filter((_,j)=>i!==j))}><X size={13}/></button></div>)}{!p.annotations.length&&<p>暂无解释标记。</p>}</div><p className="spac-dialog-note">记录归一化横轴位置，用于图面联看，不代替速度或 P/S 到时拾取结果。</p></Modal>}
  {dialog==='records'&&<Modal title="输入记录" onClose={close} footer={<><button onClick={exportStructured}>导出 JSON</button>{p.savedId&&<AnalysisReviewAction taskId={p.savedId} desktop/>}<button onClick={close}>关闭</button></>}><dl><dt>输入批次</dt><dd>{p.activeRequest.dataset}</dd><dt>关联设备</dt><dd>{p.deviceId||'独立数据批次'}</dd><dt>成果版本</dt><dd>{currentArchive?`V${currentArchive.version}`:'工作副本'}</dd><dt>成果指纹</dt><dd>{p.output.digest}</dd></dl><details className="algorithm-record-params"><summary>冻结输入与通道</summary><dl>{Object.entries(p.activeRequest.params).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>排除：{p.activeRequest.excluded.join('、')||'无'}</p></details><h3 className="algorithm-dialog-title">历史版本</h3><div className="algorithm-archive-list">{p.archive.map(t=><button key={t.id} onClick={()=>goWorkspace({page:'algorithm',id:p.id,task:t.id,device:p.deviceId})}><FileText size={14}/><strong>V{t.version}</strong><span>{t.digest}</span><small>{t.time}</small></button>)}{!p.archive.length&&<p>暂无归档。</p>}</div></Modal>}
  {dialog==='source'&&<Modal title="数据与方法" onClose={close}><h2>{p.name}</h2><dl><dt>输入</dt><dd>{p.output.source}</dd><dt>方法</dt><dd>{p.output.method}</dd><dt>引擎</dt><dd>{p.output.version}</dd></dl><p>在工具栏选择图面，使用图内工具缩放、导出；参数经应用和运行后更新，归档会冻结当时的输入与成果。</p><p className="spac-dialog-note">当前使用本地合成记录或内置参考模型，未连接现场设备。关联设备只表示业务上下文，不改变数据来源。参考成果的图层和视图操作不是数值求解，不能作为现场安全结论。</p></Modal>}
  {dialog==='replace'&&<Modal title={computed?'重新计算':'重新载入'} onClose={close} footer={<><button onClick={close}>取消</button><button onClick={exportStructured}>导出当前成果</button><button disabled={!p.allowed||p.busy} onClick={()=>{close();p.onRun()}}>继续并清空标记</button></>}><p>当前有 {p.annotations.length} 个解释标记。更新结果后将清空当前标记；已归档版本不受影响。</p></Modal>}
 </main>
}
