import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import {StudioApp} from './src/studio/StudioApp';import {DataStageView} from './src/studio/DataStageView';
 import {DemoProvider,seedDevices,PacketData} from './src/studio/store';
 export * from './src/studio/localSession';export {dataStageKinds} from './src/studio/DataStageView';
 export function renderApp(){return renderToStaticMarkup(<StudioApp/>)}
 export function renderStage(stage,id){const p=PacketData(seedDevices(),36,1).find(p=>p.device===id);return renderToStaticMarkup(<DemoProvider><DataStageView stage={stage} packet={p} onDetail={()=>{}}/></DemoProvider>)}
 `,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},external:['react','react-dom/server'],logOverride:{'empty-import-meta':'silent'}})
const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);const api=module.exports
function storage(){const map=new Map();return {map,getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
const auth=storage();globalThis.sessionStorage=auth;globalThis.location={hash:'#/data'}
test('local credentials are exact and session persistence never contains a password',()=>{
 assert.equal(api.validLocalCredentials('root','root'),true);assert.equal(api.validLocalCredentials('ROOT','root'),false);assert.equal(api.validLocalCredentials('root','root '),false);assert.equal(api.validLocalCredentials('guest','root'),false)
 const s=storage();api.saveLocalSession(s,{user:'root',createdAt:1});assert.deepEqual(api.readLocalSession(s),{user:'root',createdAt:1});assert.ok(!s.getItem(api.LOCAL_SESSION_KEY).includes('password'))
 s.setItem('saved-board','keep');api.clearLocalSession(s);assert.equal(api.readLocalSession(s),null);assert.equal(s.getItem('saved-board'),'keep')
 for(const raw of ['bad','{}','null','{"user":"guest","createdAt":1}','{"user":"root"}']){s.setItem(api.LOCAL_SESSION_KEY,raw);assert.equal(api.readLocalSession(s),null)}
})
test('login blocks all app routes until local session exists, without rewriting the deep link',()=>{
 for(const route of ['overview','device/GNSS-001','data','algorithm/slope-stability','trace','risk','designer','preview']){
  globalThis.location.hash='#/'+route;api.clearLocalSession(auth);const locked=api.renderApp();assert.ok(locked.includes('local-login'),route);assert.ok(!locked.includes('board-canvas')&&!locked.includes('cinematic-shell'),route)
  api.saveLocalSession(auth,{user:'root',createdAt:1});assert.ok(!api.renderApp().includes('local-login'),route);assert.equal(globalThis.location.hash,'#/'+route)
 }
 api.clearLocalSession(auth);assert.ok(api.renderApp().includes('local-login'))
})
test('delivery header exposes login management and a version-only help popover',()=>{
 api.saveLocalSession(auth,{user:'root',createdAt:1});globalThis.location.hash='#/overview';const html=api.renderApp()
 for(const label of ['登录管理','退出登录','账号管理','版本信息','V'+api.PRODUCT_VERSION])assert.ok(html.includes(label),label)
 assert.ok(!html.includes('当前演示角色'));const about=html.split('cinema-about')[1].split('</details>')[0];assert.ok(!about.includes('<p>')&&!about.includes('指南'))
})
test('four top-level workspaces do not repeat the global navigation title',()=>{
 for(const [route,title] of [['device','设备'],['data','数据'],['algorithm','算法'],['trace','回溯']]){globalThis.location.hash='#/'+route;const html=api.renderApp();assert.ok(!html.includes('<h1>'+title+'</h1>'),route)}
 globalThis.location.hash='#/designer';const html=api.renderApp();assert.ok(html.includes('退出大屏编排'));assert.ok(html.includes('保存并预览'));assert.ok(!html.includes('核心业务导航'))
})
test('data stages render six distinct surfaces and preserve device context',()=>{
 assert.equal(new Set(api.dataStageKinds).size,6)
 for(let stage=0;stage<6;stage++){const html=api.renderStage(stage,'GNSS-001');assert.ok(html.includes('GNSS-001'));assert.ok(!/NaN|undefined|Infinity/.test(html));assert.ok(html.includes(stage===0?'data-signal-panel':`data-stage-view="${api.dataStageKinds[stage]}"`))}
 const mapping=api.renderStage(2,'GNSS-001');assert.ok(mapping.includes('原始值')&&mapping.includes('累计位移'));assert.ok(api.renderStage(3,'GNSS-001').includes('09:20:00 中断'))
 assert.ok(api.renderStage(4,'GNSS-001').includes('历史索引'));assert.ok(api.renderStage(5,'GNSS-001').includes('选择算法'))
})
test('reference badges are removed from the result toolbar but source and export remain accessible',async()=>{
 const source=await readFile(root+'/src/studio/AlgorithmLab.tsx','utf8'),start=source.indexOf('{(device||tab!=='),end=source.indexOf('{sourceOpen&&');assert.ok(start>0&&end>start);const toolbar=source.slice(start,end)
 assert.ok(!toolbar.includes('参考成果')&&!toolbar.includes('lab-outcome-metrics'));assert.ok(source.includes('数据与方法')&&source.includes('output.source')&&source.includes('exportReport'))
 const power=await readFile(root+'/src/studio/SensorStudio.tsx','utf8');assert.ok(power.includes('power-card-device')&&power.includes('power-card-reading'));assert.ok(!power.includes('% 后备电量'))
})
