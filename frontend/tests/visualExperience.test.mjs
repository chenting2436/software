import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'
import postcss from 'postcss'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import {AlgorithmCover} from './src/studio/AlgorithmCover';
 import {AlgorithmExperience} from './src/studio/AlgorithmExperience';
 export * from './src/studio/presentationProfiles';export * from './src/studio/AlgorithmPresentation';
 export function experience(output){return renderToStaticMarkup(<AlgorithmExperience output={output} selected={0} onSelect={()=>{}} onCursor={()=>{}} onProfessional={()=>{}}/>)};
 export * from './src/studio/AlgorithmCover';export * from './src/studio/AlgorithmExperience';
 export * from './src/studio/cinematicTerrain';export * from './src/studio/sceneMotion';
 export {algorithmSpecs} from './src/studio/algorithms';
 export {computeAnalysis,defaultDataset,defaultParams} from './src/studio/analysisEngine';
 export function cover(id){return renderToStaticMarkup(<AlgorithmCover id={id}/>);}
 `,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server']})
const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const a=module.exports
test('all 31 algorithms have a compact semantic visual without chart rectangles or WebGL contexts',()=>{
 assert.deepEqual(Object.keys(a.algorithmVisuals).sort(),a.algorithmSpecs.map(v=>v.id).sort())
 for(const id of Object.keys(a.algorithmVisuals)){const html=a.cover(id);assert.ok(html.includes('data-visual="'+id+'"'));assert.ok(html.includes('aria-label="'+a.algorithmVisuals[id].intent+'"'));assert.ok(!html.includes('<canvas'));assert.ok(!html.includes('NaN'))}
})
test('all 31 methods have semantic first views with finite geometry and unchanged output',()=>{
 assert.deepEqual([...a.experienceIds].sort(),a.algorithmSpecs.map(s=>s.id).sort())
 for(const spec of a.algorithmSpecs){
  const output=a.computeAnalysis({id:spec.id,dataset:a.defaultDataset(spec.id),params:a.defaultParams(spec.id),excluded:[]}),before=JSON.stringify(output),html=a.experience(output)
  assert.ok(html.includes('data-experience="'+spec.id+'"'),spec.id)
  assert.ok(!html.includes('NaN')&&!html.includes('Infinity'),spec.id)
  assert.equal(JSON.stringify(output),before,spec.id)
  assert.equal(a.presentationProfiles[spec.id].views.length,3)
 }
})
test('semantic readouts use the selected exact figure and clamp sample bounds',()=>{
 const output={figures:[{x:'位置',y:'速度',matrix:[[1,4],[3,2]],range:[0,10,0,5]},{x:'时刻',y:'误差',lines:[[1,2,3]],range:[0,20,0,3]}]}
 assert.deepEqual(a.presentationReadout(output,120),{label:'位置',value:'10.00',detail:'峰值 4.000'})
 assert.deepEqual(a.presentationReadout(output,0,1),{label:'误差',value:'1.000',detail:'0.00 · 时刻'})
})
test('phase peak readout comes from the exact current matrix, without changing archived output',()=>{
 const output=a.computeAnalysis({id:'phase-shift-active',dataset:'L02',params:{...a.defaultParams('phase-shift-active'),'最低相速度':200,'最高相速度':720},excluded:['CH-03']}),before=JSON.stringify(output)
 const p=a.energyPeak(output),f=output.figures[0],r=Math.round((p.velocity-200)/520*(f.matrix.length-1)),c=Math.round((p.frequency-1)/31.5*(f.matrix[0].length-1))
 assert.equal(p.energy,Math.max(...f.matrix.flat()));assert.equal(p.energy,f.matrix[r][c]);assert.equal(JSON.stringify(output),before)
})
test('graded road and device anchors use the same authored height field',()=>{
 for(let i=0;i<=100;i++){const p=a.haulRoadPoint(i/100);assert.ok(Math.abs(a.cinematicHeight(p.x,p.z)-p.y)<1e-7)}
 assert.equal(a.cinematicHeight(0,0),-69)
 assert.notEqual(a.cinematicRadius(275,0),a.cinematicRadius(0,195))
})
test('terrain is deterministic, finite, and has a lower detail board variant',()=>{
 const full=a.makeCinematicTerrain(),compact=a.makeCinematicTerrain(true),repeat=a.makeCinematicTerrain(true)
 assert.ok(full.terrain.geometry.attributes.position.count>compact.terrain.geometry.attributes.position.count)
 const normals=full.terrain.geometry.attributes.normal;let up=0;for(let i=0;i<normals.count;i++)up+=normals.getY(i);assert.ok(up/normals.count>.5,'terrain surface normals must face the sky for correct lighting')
 assert.deepEqual(compact.terrain.geometry.attributes.position.array,repeat.terrain.geometry.attributes.position.array)
 for(const model of [full,compact,repeat]){assert.ok(model.benches.children.length>20);model.root.traverse(o=>{if(o.geometry){for(const key of ['position','normal'])if(o.geometry.attributes[key])for(const value of o.geometry.attributes[key].array)assert.ok(Number.isFinite(value));o.geometry.dispose()}if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())})}
})
test('2x orbit uses bounded frame time and cannot change playback frames',()=>{
 assert.equal(a.MOTION_MULTIPLIER,2)
 for(const kind of ['terrain','device','analysis'])assert.equal(a.orbitSpeed(kind),2*a.ORBIT_BASE_SPEED[kind])
 const previousSecond=30*(2*Math.PI/60/60*.55),currentSecond=2*Math.PI/60*a.orbitSpeed('device')
 assert.ok(Math.abs(currentSecond-2*previousSecond)<1e-12)
 assert.equal(a.SENSOR_RADIANS_PER_SECOND,.9);assert.equal(a.frameSeconds(1000,0),.08);assert.equal(a.frameSeconds(1033,1000),.033);assert.equal(a.frameSeconds(1,10),0)
})
test('all rotatable views expose the shared three-state rotation control',async()=>{
 for(const file of ['CinematicOverview','EquipmentGallery','DeviceShowroom','PlatformWorkbench','SensorScene']){const text=await readFile(root+'/src/studio/'+file+'.tsx','utf8');assert.ok(!text.includes('setAuto'));assert.ok(text.includes('<RotationControl/>'))}
 assert.equal(a.getRotationMode(),2);let events=0;const off=a.subscribeRotation(()=>events++);a.cycleRotation();assert.equal(a.getRotationMode(),0);assert.equal(a.orbitSpeed('device'),0);a.cycleRotation();assert.equal(a.orbitSpeed('device'),a.ORBIT_BASE_SPEED.device);a.cycleRotation();assert.equal(a.getRotationMode(),2);assert.equal(events,3);off();
 const hook=await readFile(root+'/src/studio/useAutoOrbit.ts','utf8');assert.ok(hook.includes('!document.hidden&&!drag.current'));assert.ok(hook.includes('IntersectionObserver'))
})
test('individual glass event cards and compact responsive catalogue have explicit final styles',async()=>{
 const css=postcss.parse(await readFile(root+'/src/studio/visualExperience.css','utf8'))
 let events=false,cols=false
 css.walkRules(r=>{if(r.selector==='.studio.studio .trace-studio .replay-events>button'){events=r.nodes.some(d=>d.prop==='border'&&d.value.includes('solid'))&&r.nodes.some(d=>d.prop==='backdrop-filter')}if(r.selector==='.studio .lab-catalog-grid'&&r.nodes.some(d=>d.value?.includes('repeat(4')))cols=true})
 assert.ok(events);assert.ok(cols)
})
