import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {readFile} from 'node:fs/promises'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import {AlgorithmDesktop} from './src/studio/AlgorithmDesktop';
 export * from './src/studio/algorithmDesktopProfiles';
 export * from './src/studio/analysisEngine';export * from './src/studio/algorithms';
 export function render(props){return renderToStaticMarkup(<AlgorithmDesktop {...props}/>)}
`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server'],loader:{'.css':'empty'},logOverride:{'empty-import-meta':'silent'}})
const m={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),m,m.exports)
const api=m.exports
const request=id=>({id,dataset:api.defaultDataset(id),params:api.defaultParams(id),excluded:[]})
function html(id,extra={}){const r=request(id),output=api.computeAnalysis(r),noop=()=>{};return api.render({id,name:id,request:r,activeRequest:r,output,setRequest:noop,busy:false,changed:false,allowed:true,notice:'',savedId:'',duration:0,archive:[],baseline:null,baselineAnnotations:[],compareId:'',setCompareId:noop,annotations:[],onAnnotations:noop,onRun:noop,onSave:noop,onExport:noop,onBack:noop,onDismiss:noop,...extra})}
test('31 algorithms have explicit individual menu and view profiles',()=>{
 assert.deepEqual(Object.keys(api.algorithmDesktopProfiles).sort(),api.algorithmSpecs.map(s=>s.id).sort())
 assert.equal(new Set(Object.values(api.algorithmDesktopProfiles).map(p=>p.code)).size,31)
 for(const spec of api.algorithmSpecs){const p=api.algorithmDesktopProfiles[spec.id];assert.equal(p.views.length,3);assert.equal(new Set(p.views).size,3);assert.equal(p.icons.length,3);const page=html(spec.id);for(const view of p.views)assert.ok(page.includes(view),spec.id+'/'+view);assert.ok(page.includes(p.menu));assert.ok(!page.includes('cinematic-shell'))}
})
test('readonly roles can inspect but cannot run or archive',()=>{
 const page=html('fk',{allowed:false})
 assert.ok([...page.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].find(m=>m[0].includes('<span>运行</span>'))?.[0].includes('disabled=""'))
 assert.ok(page.includes('只读'))
 assert.ok(page.includes('输入记录')&&page.includes('导出报告')&&page.includes('数据与方法'))
})
test('pending changes remain visible and cannot be archived as the old result',()=>{
 const page=html('phase-shift-active',{changed:true})
 assert.ok(page.includes('输入已修改 · 图面仍为上次结果'))
 assert.ok(page.includes('撤回修改')&&page.includes('重新计算'))
 assert.ok([...page.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].find(m=>m[0].includes('<span>归档</span>'))?.[0].includes('disabled=""'))
})
test('reference models have load/review controls instead of pretending to solve',()=>{
 const page=html('event-location')
 assert.ok(page.includes('<span>载入</span>'))
 assert.ok(page.includes('<span>模型记录</span>'))
 assert.ok(page.includes('内置参考模型'))
 assert.ok(!page.includes('<span>运行</span>'))
})
test('effective parameter and channel controls follow implemented local methods',()=>{
 assert.deepEqual(api.activeAnalysisParams['phase-shift-active'],['最低相速度','最高相速度'])
 assert.ok(!api.activeAnalysisParams['surface-inversion'])
 assert.equal(api.channelCountFor('gnss-prediction'),0)
 assert.equal(api.channelCountFor('hvsr'),8)
 assert.equal(api.channelCountFor('beamforming'),12)
 for(const spec of api.algorithmSpecs){for(const key of api.activeAnalysisParams[spec.id]||[])assert.ok(spec.params.some(p=>p[0]===key))}
})
test('spatial controls and markability distinguish numerical plots from scene navigation',()=>{
 assert.equal(api.isSpatialFigure({kind:'geometry',variant:'location'}),true)
 assert.equal(api.isSpatialFigure({kind:'geometry',variant:'circle'}),false)
 assert.equal(api.canMarkFigure({kind:'heat'}),true)
 assert.equal(api.canMarkFigure({kind:'mechanism'}),false)
 assert.equal(api.canMarkFigure({kind:'geometry'}),false)
})
test('responsive plotting is opt-in and the desktop CSS cannot reset cinematic pages',async()=>{
 const figure=await readFile(root+'/src/studio/AnalysisFigure.tsx','utf8')
 const css=await readFile(root+'/src/studio/algorithmDesktop.css','utf8')
 assert.ok(figure.includes('responsive=false'))
 assert.ok(figure.includes('getScreenCTM()')&&figure.includes('matrix.inverse()'))
 assert.ok(figure.includes('ResizeObserver'))
 assert.ok(!/(^|\n)\s*(body|html|\.studio|\.cinematic|\.board)/.test(css))
})
