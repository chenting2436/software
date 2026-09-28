import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`
 import React from 'react';
 import {renderToStaticMarkup} from 'react-dom/server';
 import {DemoProvider,canRole,seedDevices,PacketData,roles,captureSnapshot} from './src/studio/store';
 import {computeAnalysis,defaultParams,defaultDataset} from './src/studio/analysisEngine';
 import {renderAnalysisFigures} from './src/studio/analysisReport';
 import {ModuleWorkbench,CompactWidget} from './src/studio/ModuleWorkbench';
 import {algorithmSpecs} from './src/studio/algorithms';
 import {resultIds,resultMetrics} from './src/studio/algorithmResults';
 import {widgetCatalog} from './src/data/catalog';
 export {StatusRing} from './src/studio/WidgetSummary';
 export {isWidgetClick,widgetControlSelector} from './src/studio/widgetInteraction';
 export {canRole,seedDevices,PacketData,roles,algorithmSpecs,resultIds,resultMetrics,widgetCatalog,captureSnapshot,computeAnalysis,defaultParams,defaultDataset,renderAnalysisFigures};
 export function render(kind,compact=false){return renderToStaticMarkup(<DemoProvider>{compact?<CompactWidget kind={kind}/>:<ModuleWorkbench kind={kind}/>}</DemoProvider>)}
 `,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},external:['react','react-dom/server']})
const module={exports:{}}
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const api=module.exports
test('dashboard fallback opens clicks but never drags or nested controls',()=>{
 assert.equal(api.isWidgetClick({x:10,y:10},{x:12,y:12},false),true)
 assert.equal(api.isWidgetClick({x:10,y:10},{x:40,y:10},false),false)
 assert.equal(api.isWidgetClick(null,{x:0,y:0},true),false)
 for(const selector of ['button','[role="button"]','canvas','[data-widget-interactive]'])assert.ok(api.widgetControlSelector.includes(selector))
})
test('status ring total, zero counters and individual segments select their exact filter',()=>{
 const selected=[],tree=api.StatusRing({values:[12,1,0],labels:['在线','离线','维护'],onSelect:i=>selected.push(i)})
 const elements=[];function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return}elements.push(node);visit(node.props?.children)}visit(tree)
 elements.find(e=>e.props?.['aria-label']==='查看全部 13 项').props.onClick()
 elements.find(e=>e.props?.['aria-label']==='查看离线 1 项').props.onClick()
 elements.find(e=>e.props?.['aria-label']==='查看维护 0 项').props.onClick()
 let stopped=false;elements.filter(e=>e.type==='circle'&&e.props.onClick)[1].props.onClick({stopPropagation(){stopped=true}})
 assert.deepEqual(selected,[null,1,2,1]);assert.equal(stopped,true)
})
test('all algorithm summaries have a keyboard-accessible whole-chart action',()=>{
 for(const a of api.algorithmSpecs){const html=api.render('algorithm-'+a.id,true);assert.equal((html.match(/summary-plot-trigger/g)||[]).length,1,a.id);assert.ok(html.includes('成果"'),a.id)}
})
test('dashboard actionable content includes devices, risk points, stages, accounts, packets and time',()=>{
 for(const [kind,label] of [['deviceOnline','查看离线 1 项'],['riskSummary','查看 GNSS-001 预警'],['riskReport','查看现场处置事件'],['accountManager','查看账号 矿大项目组'],['accountManager','查看算法工程师账号'],['rawMessageQuery','查看 UAV-201 回传数据'],['historyPlayback','回放当前时刻'],['quality','查看隔离 1 项']])assert.ok(api.render(kind,true).includes(label),kind+'/'+label)
 assert.ok(api.render('siteMap',true).includes('data-widget-interactive'))
 assert.ok(api.render('gnssTwin',true).includes('data-widget-interactive'))
})
test('visitor dashboard summaries respect the device scope and risk scope',()=>{
 const previous=globalThis.localStorage
 globalThis.localStorage={getItem:()=>JSON.stringify({role:'客户访客',devices:api.seedDevices(),tasks:[],accounts:[]})}
 try{assert.ok(api.render('deviceOnline',true).includes('查看在线 12 项'));const html=api.render('riskSummary',true);assert.ok(html.includes('查看 GNSS-001 预警'));assert.ok(!html.includes('GNSS-017'));assert.ok(api.render('deviceOnline',true).includes('查看维护 / 其他 0 项'))}
 finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
})
test('all 31 algorithms have unique specifications and result structures',()=>{
 assert.equal(api.algorithmSpecs.length,31)
 assert.equal(new Set(api.algorithmSpecs.map(a=>a.id)).size,31)
 assert.deepEqual(api.algorithmSpecs.map(a=>a.id).sort(),api.resultIds.sort())
 for(const a of api.algorithmSpecs){assert.equal(a.params.length,3);assert.equal(a.steps.length,4);assert.equal(a.actions.length,3);for(const [,value,min,max] of a.params)assert.ok(value>=min&&value<=max);assert.equal(api.resultMetrics(a.id).length,3);assert.notDeepEqual(api.resultMetrics(a.id,1),api.resultMetrics(a.id,2))}
})
test('all component workspaces and dashboard cards can render',()=>{
 assert.equal(api.widgetCatalog.length,154)
 assert.equal(new Set(api.widgetCatalog.map(w=>w.kind)).size,154)
 for(const w of api.widgetCatalog){assert.equal(w.defaultW,1);assert.equal(w.defaultH,1);assert.ok(api.render(w.kind).length>150,w.kind);const summary=api.render(w.kind,true);assert.ok(summary.includes(`aria-label="打开${w.name}"`),w.kind);assert.ok(!summary.includes('进入工作区')&&!summary.includes('compact-description'),w.kind)}
})
test('device dropout propagates to message status and recovery restores ingestion',()=>{
 const devices=api.seedDevices();assert.equal(devices.length,24)
 const first=devices[0];assert.equal(api.PacketData(devices,0,1)[0].status,'已入库')
 first.status='离线';assert.equal(api.PacketData(devices,0,1)[0].status,'中断')
 first.status='在线';assert.equal(api.PacketData(devices,0,1)[0].status,'已入库')
 assert.equal(api.PacketData(devices,0,1)[7].status,'解析失败')
 assert.equal(api.PacketData(devices,0,1.1)[7].status,'已入库')
 assert.notEqual(api.PacketData(devices,0,1)[0].value,api.PacketData(devices,100,1)[0].value)
})
test('role operation matrix denies unauthorized writes',()=>{
 for(const domain of ['device','data','algorithm','risk','account','config']){assert.equal(api.canRole('客户访客',domain),false);assert.equal(api.canRole('项目管理员',domain),true)}
 assert.equal(api.canRole('算法工程师','algorithm'),true);assert.equal(api.canRole('算法工程师','device'),false)
 assert.equal(api.canRole('设备管理员','data'),true);assert.equal(api.canRole('设备管理员','account'),false)
 assert.equal(api.canRole('风险处置员','risk'),true);assert.equal(api.canRole('风险处置员','config'),false)
})
test('report figures render independently of the current workspace tab',()=>{
 const result=api.computeAnalysis({id:'fk',dataset:'L01',params:api.defaultParams('fk'),excluded:[]});const report=api.renderAnalysisFigures(result)
 assert.equal((report.match(/role="img"/g)||[]).length,3);for(const f of result.figures)assert.ok(report.includes(f.title));assert.ok(report.includes('CH-01'))
 assert.ok(!api.renderAnalysisFigures({...result,figures:[{...result.figures[0],title:'<script>bad()</script>'}]}).includes('<script>bad()</script>'))
})
test('operation snapshots keep frozen input but do not duplicate heavy figure arrays',()=>{
 const request={id:'fk',dataset:'L01',params:api.defaultParams('fk'),excluded:[]},result=api.computeAnalysis(request),task={id:'AN-CHECK',analysis:{request,result,digest:result.digest}};
 const snapshot=api.captureSnapshot({frame:36,devices:api.seedDevices(),mapping:1,tasks:[task],risks:[],role:'项目管理员'},'test');
 assert.equal(snapshot.tasks[0].analysis.result,undefined);assert.deepEqual(snapshot.tasks[0].analysis.request,request);assert.equal(task.analysis.result,result)
})
test('dashboard summaries are distinct and contain no repeated footer or description',()=>{
 const risk=api.render('riskSummary',true),report=api.render('riskReport',true),account=api.render('accountManager',true),ledger=api.render('deviceLedger',true),data=api.render('rawMessageQuery',true)
 assert.ok(risk.includes('风险测点分布'))
 assert.ok(report.includes('data-summary="report"')&&!report.includes('风险测点分布'))
 assert.ok(account.includes('summary-avatar-group')&&!account.includes('个演示账号'))
 assert.ok(ledger.includes('summary-fleet')&&!ledger.includes('mini-table'))
 assert.ok(data.includes('summary-signal')&&!data.includes('mini-table'))
 for(const w of api.widgetCatalog){const html=api.render(w.kind,true);assert.ok(html.includes('data-summary-kind="'+w.kind+'"'));assert.equal((html.match(/<header>/g)||[]).length,1,w.kind);assert.ok(!html.includes('进入工作区')&&!html.includes('compact-description'),w.kind)}
})
