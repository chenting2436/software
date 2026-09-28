import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
const root=fileURLToPath(new URL('..',import.meta.url))
const result=await build({stdin:{contents:`export * from './src/studio/surfaceData';export * from './src/studio/cinematicTerrain';export {computeAnalysis,defaultParams,defaultDataset} from './src/studio/analysisEngine'`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'})
const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const a=module.exports
test('spatial energy picks use the computed matrix and the same physical bounds',()=>{
 const out=a.computeAnalysis({id:'phase-shift-active',dataset:a.defaultDataset('phase-shift-active'),params:a.defaultParams('phase-shift-active'),excluded:[]}),f=out.figures[0]
 const first=a.sampleEnergySurface(f,0,0),last=a.sampleEnergySurface(f,1,1)
 assert.equal(first.frequency,f.range[0]);assert.equal(first.velocity,f.range[2]);assert.equal(first.energy,f.matrix[0][0])
 assert.equal(last.frequency,f.range[1]);assert.equal(last.velocity,f.range[3]);assert.equal(last.energy,f.matrix.at(-1).at(-1))
})
test('surface bounds are clamped without changing the archived matrix',()=>{
 const f={matrix:[[1,2],[3,4]],range:[5,25,100,800]},before=JSON.stringify(f)
 assert.deepEqual(a.sampleEnergySurface(f,-2,4),{row:1,col:0,frequency:5,velocity:800,energy:3,cursor:0});assert.equal(JSON.stringify(f),before)
 assert.throws(()=>a.sampleEnergySurface({matrix:[]},0,0),/矩阵为空/)
})
test('new velocity parameters propagate into the spatial result',()=>{
 const params={...a.defaultParams('phase-shift-active'),'最低相速度':180,'最高相速度':700}
 const out=a.computeAnalysis({id:'phase-shift-active',dataset:a.defaultDataset('phase-shift-active'),params,excluded:[]})
 assert.equal(a.sampleEnergySurface(out.figures[0],.5,0).velocity,180)
 assert.equal(a.sampleEnergySurface(out.figures[0],.5,1).velocity,700)
})
test('authored mine and device placement share a deterministic terrain height',()=>{
 assert.equal(a.cinematicHeight(0,0),-69)
 for(const p of [[210,100],[-170,20],[0,180],[700,600],[-350,-150]]){assert.ok(Number.isFinite(a.cinematicHeight(...p)));assert.equal(a.cinematicHeight(...p),a.cinematicHeight(...p))}
 for(let i=0;i<360;i++){const angle=i/180*Math.PI;assert.ok(a.cinematicRadius(Math.cos(angle)*240,Math.sin(angle)*190)>0)}
})
