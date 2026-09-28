import { useEffect, useState } from 'react'
import {LocalLogin} from './LocalLogin'
import {WorkspaceTitleContext} from './WorkspaceDrawer'
import { DemoProvider, useDemo } from './store'
import { CinematicShell, CinematicOverview } from './CinematicOverview'
import { DeviceShowroom } from './DeviceShowroom'
import { platformFor } from './sceneCatalog'
import { DeviceHub } from './SensorStudio'
import { DataHub } from './DataHub'
import { TraceStudio } from './TraceStudio'
import { BoardStudio } from './BoardStudio'
import { AlgorithmStudio } from './AlgorithmStudio'
import { RiskStudio, AccountStudio, RecordsStudio } from './BusinessStudio'
import { SolutionStudio } from './SolutionStudio'
import { ModuleWorkbench } from './ModuleWorkbench'
import { parseRoute, routeHash, goWorkspace, moduleRoute, type WorkspaceRoute } from './navigation'
import { DeviceWorkspace, WorkspaceBridge } from './WorkspaceBridge'
import { WorkflowEditor } from '../components/WorkflowEditor'
import { widgetCatalog, widgetCategoryOrder, moduleCatalog } from '../data/catalog'
import './studio.css'
import './product.css'
import './scene.css'
import './lab.css'
import './cinematic.css'
import './haze.css'
import './clean.css'
import './widgetInteraction.css'
import './glassRestore.css'
import './visualExperience.css'
import './productRefinement.css'
import './interactionRefinement.css'
import './deliveryPolish.css'
import './businessInteraction.css'
import {GlassLibrary} from './GlassLibrary'
import {SpacWorkbench} from './SpacWorkbench'
import {WorkspaceAppearanceProvider,appearanceForRoute} from './ScientificUI'

export function StudioApp() { return <LocalLogin><DemoProvider><StudioShell/></DemoProvider></LocalLogin> }
function StudioShell() {
 const { state, storageError, selectDevice } = useDemo()
 const [route,setRoute]=useState(()=>parseRoute(location.hash)),[query,setQuery]=useState(''),[category,setCategory]=useState('全部'),[configTab,setConfigTab]=useState('auditLog')
 const page=route.page, platform=route.id?platformFor({id:route.id}):undefined
 useEffect(()=>{
  const apply=()=>{const r=parseRoute(location.hash);setRoute(r);if(r.device||r.page==='device'&&r.id)selectDevice(r.device||r.id!);requestAnimationFrame(()=>window.scrollTo(0,history.state?.scrollY||0))}
  const nav=(event:Event)=>{const next=(event as CustomEvent<WorkspaceRoute>).detail;history.replaceState({...history.state,scrollY:window.scrollY},'');history.pushState({scrollY:0},'',routeHash(next));apply()}
  apply();window.addEventListener('kuangda:navigate',nav);window.addEventListener('hashchange',apply);window.addEventListener('popstate',apply)
  return()=>{window.removeEventListener('kuangda:navigate',nav);window.removeEventListener('hashchange',apply);window.removeEventListener('popstate',apply)}
 },[])
 const navigate=(key:string)=>goWorkspace({page:key})
 if(page==='preview')return <BoardStudio presentation onBack={()=>navigate('designer')}/>
 if(page==='designer')return <div className="studio dedicated-board"><BoardStudio onBack={()=>navigate('overview')} onPreview={()=>navigate('preview')}/></div>
 const immersive=page==='overview'||page==='device'&&!!platform
 return <WorkspaceAppearanceProvider value={appearanceForRoute(route)}><CinematicShell page={page} onSearch={value=>{setQuery(value);if(page!=='library')navigate('library')}}>
  {storageError&&<p className="error" role="alert">{storageError}</p>}
  <div className={immersive?'immersive-page':'haze-workspace'}>
   {page==='overview'&&<CinematicOverview/>}
   {page==='device'&&(platform?<DeviceShowroom key={platform} kind={platform} initialTab={route.tab}/>:route.id?<DeviceWorkspace key={route.id} id={route.id}/>:<DeviceHub/>)}
   {page==='data'&&<DataHub key={route.device} deviceId={route.device} onOpenModule={kind=>goWorkspace(moduleRoute(kind))}/>}
   {page==='algorithm'&&(route.id==='spac'&&!route.task?<SpacWorkbench key={state.role} deviceId={route.device}/>:<AlgorithmStudio key={routeHash(route)+':'+state.role} fixedId={route.id} deviceId={route.device} datasetId={route.dataset} taskId={route.task}/>)}
   {page==='trace'&&<><WorkspaceBridge route={route}/><TraceStudio key={routeHash(route)} deviceId={route.device} initialTab={route.tab||'历史回放'} initialFrame={route.frame?Number(route.frame):undefined} initialSnapshot={route.snapshot} taskId={route.task}/></>}
   {page==='workspace'&&route.id&&<><div className="workspace-path"><button onClick={()=>history.back()}>← 返回</button><strong>{widgetCatalog.find(w=>w.kind===route.id)?.name}</strong></div><WorkspaceTitleContext.Provider value={widgetCatalog.find(w=>w.kind===route.id)?.name||''}><ModuleWorkbench key={route.id} kind={route.id}/></WorkspaceTitleContext.Provider></>}
   
   {page==='risk'&&<RiskStudio key={route.id} initialId={route.id}/>}
   {page==='account'&&<AccountStudio/>}
   {page==='solution'&&<SolutionStudio/>}
   {page==='workflow'&&<WorkflowEditor selectedIds={moduleCatalog.map(m=>m.id)}/>}
   {page==='config'&&<><div className="tabs">{['auditLog','configurationVersion','protocolLibrary','releaseRollback','shiftHandover'].map(k=><button className={configTab===k?'active':''} key={k} onClick={()=>setConfigTab(k)}>{widgetCatalog.find(w=>w.kind===k)?.name}</button>)}</div><RecordsStudio key={configTab} kind={configTab}/></>}
   {page==='library'&&<GlassLibrary query={query} setQuery={setQuery} category={category} setCategory={setCategory}/>} 
  </div>
 </CinematicShell></WorkspaceAppearanceProvider>
}
