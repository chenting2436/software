import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import {DemoProvider} from './src/studio/store';import {RecordsStudio} from './src/studio/BusinessStudio';import {BoardStudio} from './src/studio/BoardStudio';
 import {OperationPanel} from './src/studio/OperationPanel';
 export * from './src/studio/channelConfig';export * from './src/studio/protocolConfig';export * from './src/studio/operationProfiles';
 export function renderKind(kind){return renderToStaticMarkup(<DemoProvider><RecordsStudio kind={kind}/></DemoProvider>)}
 export function board(){return renderToStaticMarkup(<DemoProvider><BoardStudio/></DemoProvider>)}
 export function operation(kind,index,allowed=true){return renderToStaticMarkup(<DemoProvider><OperationPanel kind={kind} index={index} action={'步骤'+index} fields={['对象','范围','参数','内容']} current={{id:'REC-1',values:['北帮','','',''],version:1,status:'草稿',updated:'2026/09/26',history:['创建']}} allowed={allowed} onApply={()=>{}}/></DemoProvider>)}
 `,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},external:['react','react-dom/server'],logOverride:{'empty-import-meta':'silent'}})
const m={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports);const api=m.exports
test('channel mapping is numerical, duplicate probe binding is rejected, storage uses enabled channels',()=>{
 const c=api.defaultChannels('数采板');assert.ok(api.validChannelConfig(c));assert.equal(c.channels.length,8);assert.equal(api.mappedValue(1250,{scale:.002,offset:1}),3.5)
 assert.equal(api.storageEstimate(c).bytesPerSecond,9000);c.channels[1].enabled=false;assert.equal(api.storageEstimate(c).bytesPerSecond,6000)
 c.channels[0].source='MS-002';c.channels[2].source='MS-002';c.channels[2].axis='X';assert.equal(api.channelErrors(c).length,1)
 assert.ok(!api.validChannelConfig({...c,rate:NaN}));assert.ok(!api.validChannelConfig({...c,gain:0}))
})
test('waveforms vary with sampling and gain; calibration fits coefficients and rejects invalid input',()=>{
 const a=api.sampleChannel(1000,1),b=api.sampleChannel(1000,4);assert.equal(a.length,b.length);assert.ok(a.every((v,i)=>Math.abs(v*4-b[i])<1e-12));assert.notDeepEqual(a,api.sampleChannel(2000,1));assert.ok(a.every(Number.isFinite))
 const f=api.fitCalibration([10,20,30,40],[1,3,5,7]);assert.ok(Math.abs(f.scale-.2)<1e-9);assert.ok(Math.abs(f.offset+1)<1e-9);assert.ok(f.error<1e-9)
 assert.throws(()=>api.fitCalibration([1,1,1],[1,2,3]));assert.throws(()=>api.fitCalibration([1,2,3],[3,2,1]))
})
test('all adapter versions parse their own sample, reject bad values and show actual version differences',()=>{
 for(const a of api.adapters){for(const v of a.versions){const r=api.parseProtocolSample(api.protocolSample(a,v),a,v);assert.ok(r.passed,a.id+v.id);assert.equal(r.rows[0].value,5800*v.scale);assert.ok(!api.parseProtocolSample(api.protocolSample(a,v,true),a,v).passed)}assert.ok(api.versionDiff(...a.versions).some(d=>d.changed))}
 const a=api.adapters[0],v=a.versions[1];for(const input of ['null','{}','[]','not json',JSON.stringify({device_id:'GNSS-001',value:null,seq:1,status:'OK'}),JSON.stringify({device_id:'GNSS-001',value:1,seq:-1,status:'OK'}),'x'.repeat(262145)])assert.ok(!api.parseProtocolSample(input,a,v).passed)
})
test('a mixed sample cannot be marked passed; versions with required status reject missing status',()=>{
 const a=api.adapters[0],v=a.versions[1],good=JSON.parse(api.protocolSample(a,v)),bad={...good,value:'bad'}
 const r=api.parseProtocolSample(JSON.stringify([good,bad]),a,v);assert.equal(r.total,2);assert.equal(r.rows.length,1);assert.equal(r.passed,false)
 delete good.status;assert.ok(!api.parseProtocolSample(JSON.stringify(good),a,v).passed)
 assert.ok(!api.validProtocol({active:'x',releases:[{}]}))
})
test('business profiles have different view modes for every feature, with functional local primitives',()=>{
 for(const [kind,modes] of Object.entries(api.operationProfiles)){assert.equal(new Set(modes).size,modes.length,kind);for(let i=0;i<modes.length;i++){const html=api.operation(kind,i);assert.ok(html.includes('data-operation-view="'+modes[i]+'"'));assert.ok(!html.includes('第 1 次演示'));assert.ok(!html.includes('<textarea'));assert.ok(!/NaN|Infinity/.test(html))}}
 assert.deepEqual(api.thresholdRuns([1,4,5,6,1,6],3,2),[false,false,true,true,false,false]);assert.deepEqual(api.reorderPackets([3,1,2,2],true),[1,2,3])
 assert.equal(api.validOperation(api.defaultOperation()),true);assert.equal(api.validOperation({...api.defaultOperation(),stage:9}),false)
})
test('channel and protocol workspaces replace generic receipt panels and keep meaningful controls',()=>{
 const channel=api.renderKind('channelManager'),protocol=api.renderKind('protocolLibrary')
 assert.ok(channel.includes('data-view="channel-wiring"'));assert.ok(protocol.includes('data-view="adapter-catalog"'));assert.ok(channel.includes('保存配置'));assert.ok(protocol.includes('GNSS · JSON'))
 for(const html of [channel,protocol])assert.ok(!html.includes('执行回执与结果')&&!html.includes('<textarea'))
})
test('board exposes an unscaled removal toolbar and library removal; undo persists even when clean',async()=>{
 const html=api.board();assert.ok(html.includes('board-selection-toolbar')&&html.includes('选择编排组件')&&html.includes('取消添加矿区监测总览'))
 const source=await readFile(root+'/src/studio/BoardStudio.tsx','utf8');assert.ok(source.includes("if(!presentation&&can('config'))try{localStorage.setItem(BOARD_DRAFT_KEY,JSON.stringify(doc))}"));assert.ok(!source.includes('if(!presentation&&dirty)try{localStorage'))
 const sensor=await readFile(root+'/src/studio/SensorScene.tsx','utf8');assert.ok(sensor.includes('sensor-tool-left')&&sensor.includes('sensor-tool-right'));assert.ok(!sensor.includes('sensor-explode-control'))
})
