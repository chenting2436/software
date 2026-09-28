import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import {MethodVisual} from './src/studio/MethodVisual';
 export * from './src/studio/MethodVisual';export * from './src/studio/slopeGeometry';
 export * from './src/studio/demoSignals';export * from './src/studio/terrainContours';export * from './src/studio/cinematicTerrain';
 export * from './src/studio/analysisEngine';export * from './src/studio/telemetry';
 export function render(output,position,selected){return renderToStaticMarkup(<svg><MethodVisual output={output} position={position} selected={selected} onSelect={()=>{}} glass='#aaddef22'/></svg>)};
 `,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server']})
const m={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports);const a=m.exports
test('slope strata share an identical boundary without overlapping side polygons',()=>{
 for(let i=0;i<a.slopeLayers.length;i++){
  const layer=a.slopeLayers[i],points=a.slopeBand(layer.offset,layer.thickness),upper=points.slice(0,5),lower=points.slice(5).reverse()
  assert.equal(points.length,10)
  upper.forEach(([x,y],j)=>{assert.equal(lower[j][0],x);assert.equal(y-lower[j][1],layer.thickness)})
  if(i<3)assert.deepEqual(lower,a.slopeBand(a.slopeLayers[i+1].offset,a.slopeLayers[i+1].thickness).slice(0,5))
 }
})
test('elevation contours drape on the local height field and have deterministic finite geometry',()=>{
 const first=a.terrainContours(42),second=a.terrainContours(42);assert.deepEqual(first,second);assert.ok(first.length>600);assert.equal(first.length%6,0)
 for(let i=0;i<first.length;i+=3){assert.ok(Number.isFinite(first[i+1]));assert.ok(Math.abs(first[i+1]-a.cinematicHeight(first[i],first[i+2])-1.2)<1e-8)}
})
test('complex observation signals are reproducible, bounded and contain nonconstant increments',()=>{
 for(const type of ['GNSS','微震节点','边坡雷达','气象站','数采板','巡检无人机','雷达巡检车','深地感知站']){
  const values=Array.from({length:121},(_,i)=>a.observationValue(type,4,i)),diff=values.slice(1).map((v,i)=>Number((v-values[i]).toFixed(4)))
  assert.ok(values.every(v=>Number.isFinite(v)&&v>=0),type);assert.ok(new Set(diff).size>60,type)
  assert.deepEqual(values,Array.from({length:121},(_,i)=>a.observationValue(type,4,i)))
 }
})
test('new GNSS input adds stages while legacy input and frozen result remain unchanged',()=>{
 const request={id:'gnss-prediction',dataset:'GNSS-24H',params:a.defaultParams('gnss-prediction'),excluded:[]},legacy=a.computeAnalysis(request),before=JSON.stringify(legacy)
 assert.deepEqual(legacy.figures[0].lines[0].slice(0,48),Array.from({length:48},(_,i)=>2+i*.18+.22*Math.sin(i*.42+4)))
 const next=a.computeAnalysis({...request,dataset:'GNSS-24H-V2'});assert.notEqual(next.digest,legacy.digest);assert.notDeepEqual(next.figures[0].lines[0],legacy.figures[0].lines[0]);assert.equal(JSON.stringify(legacy),before)
 assert.ok(next.figures[0].lines[0].slice(48).every(Number.isNaN));assert.ok(next.source.includes('合成'))
})
test('23 formerly similar methods have distinct visual grammars and valid boundary interactions',()=>{
 assert.equal(Object.keys(a.methodVisualKinds).length,23);assert.equal(new Set(Object.values(a.methodVisualKinds)).size,23)
 for(const id of Object.keys(a.methodVisualKinds)){
  const output=a.computeAnalysis({id,dataset:a.defaultDataset(id),params:a.defaultParams(id),excluded:[]}),before=JSON.stringify(output)
  for(const [p,s] of [[0,0],[45,2],[100,5]]){
   const html=a.render(output,p,s);assert.ok(html.includes('data-method-visual="'+a.methodVisualKinds[id]+'"'),id);assert.ok(!/NaN|Infinity|undefined/.test(html),id)
   const readout=a.methodReadout(output,p,s);if(readout)assert.ok(!/NaN|Infinity|undefined/.test(JSON.stringify(readout)),id)
  }
  assert.equal(JSON.stringify(output),before,id)
 }
})
test('home inspector is nonmodal, terrain is local and ledger preserves import/edit/export actions',async()=>{
 const home=await readFile(root+'/src/studio/CinematicOverview.tsx','utf8'),business=await readFile(root+'/src/studio/BusinessStudio.tsx','utf8'),sensor=await readFile(root+'/src/studio/SensorStudio.tsx','utf8')
 assert.ok(home.includes('floating-device-status'));assert.ok(!home.includes('WorkspaceDrawer')&&!home.includes('CesiumReference'));assert.ok(home.includes("terrainStyle={region?'elevation':'natural'}"))
 assert.ok(!sensor.includes('信号观测 /'));assert.ok(sensor.includes('实时通道'))
 for(const text of ['ledger-inline-counts','pageSize=shortViewport?4:6','导出台账','下载模板','设备档案编辑','risk-stage-buttons','risk-evidence-buttons'])assert.ok(business.includes(text),text)
 assert.ok(business.includes('!note.trim()'))
})
