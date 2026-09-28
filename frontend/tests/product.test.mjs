import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('..',import.meta.url))
const result=await build({stdin:{contents:`export * from './src/studio/boardLayout';export * from './src/studio/telemetry';export * from './src/studio/hardware';export {seedDevices} from './src/studio/store';export {widgetCatalog} from './src/data/catalog';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react']})
const module={exports:{}}
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const a=module.exports,valid=new Set(a.widgetCatalog.map(w=>w.kind))
test('all 1–12 module layouts fully cover a 12×12 board without holes or overlap',()=>{
 for(let n=1;n<=12;n++){
  const cells=new Set(),rects=a.boardRects(n);assert.equal(rects.length,n)
  for(const [x,y,w,h] of rects){for(const v of [x,y,w,h])assert.ok(Number.isInteger(v));assert.ok(x>=0&&y>=0&&x+w<=12&&y+h<=12)
   for(let i=x;i<x+w;i++)for(let j=y;j<y+h;j++){const key=`${i},${j}`;assert.ok(!cells.has(key),`duplicate ${n}/${key}`);cells.add(key)}
  }
  assert.equal(cells.size,144)
 }
 assert.deepEqual(a.boardRects(13),[])
})
test('9/10/12 templates have real, distinct modules and mixed sizes',()=>{
 assert.deepEqual(Object.values(a.boardTemplates).map(v=>v.length),[9,10,12])
 for(const [name,kinds] of Object.entries(a.boardTemplates)){assert.equal(new Set(kinds).size,kinds.length);for(const k of kinds)assert.ok(valid.has(k),k);const tiles=a.arrangeBoard(a.makePage(name));assert.ok(new Set(tiles.map(t=>`${t.w}x${t.h}`)).size>1)}
})
test('saved layout and primary swaps survive reload exactly',()=>{
 const doc=a.newBoard(),p=doc.pages[0],first=p.items[0],last=p.items[8]
 doc.pages[0]=a.reorderBoard(p,first.id,last.id)
 assert.equal(a.arrangeBoard(doc.pages[0])[0].item.kind,last.kind)
 const loaded=a.normalizeBoard(JSON.parse(JSON.stringify(doc)),valid)
 assert.deepEqual(a.arrangeBoard(loaded.pages[0]),a.arrangeBoard(doc.pages[0]))
 assert.equal(p.items[0],first)
})
test('legacy migration preserves all 25 components in pages and does not overwrite source',()=>{
 const old=a.widgetCatalog.slice(0,25).map((w,i)=>({uid:`test-${i}`,kind:w.kind,x:i%3,y:Math.floor(i/3)})),before=JSON.stringify(old)
 const doc=a.migrateBoard(old,valid)
 assert.deepEqual(doc.pages.map(p=>p.items.length),[12,12,1]);assert.equal(JSON.stringify(old),before)
 assert.deepEqual(doc.pages.flatMap(p=>p.items.map(i=>i.kind)),old.map(i=>i.kind))
})
test('invalid and duplicate component entries normalize safely',()=>{
 const doc=a.newBoard();doc.pages[0].items.push({...doc.pages[0].items[0]},{id:'bad',kind:'unknown'})
 assert.equal(a.normalizeBoard(doc,valid).pages[0].items.length,9)
 assert.equal(a.normalizeBoard({version:0},valid),null)
})
test('packet values and provenance IDs are stable across scoped device views',()=>{
 const ds=[...a.seedDevices(),...a.seedAcquisitionDevices()]
 const packets=a.packetData(ds,36,1.1)
 for(const d of ds){assert.deepEqual(a.packetData([d],36,1.1)[0],packets.find(p=>p.device===d.id))}
 assert.equal(packets.find(p=>p.device==='MS-002').unit,'mV')
 assert.equal(packets.find(p=>p.device==='DAQ-101').unit,'°C')
})
test('history time and outage recovery never mutate current device state',()=>{
 const ds=a.seedDevices(),before=JSON.stringify(ds)
 assert.equal(a.frameTime(0),'09:00:00');assert.equal(a.frameTime(41),'09:20:30');assert.equal(a.frameTime(120),'10:00:00')
 assert.equal(a.historicalDevices(ds,40)[0].status,'离线');assert.equal(a.historicalDevices(ds,56)[0].status,'在线')
 assert.equal(a.historicalDevices(ds,80)[1].parts['sensor-z'],'噪声异常');assert.equal(JSON.stringify(ds),before)
})
test('created algorithm input snapshot remains frozen after live telemetry changes',()=>{
 const ds=a.seedDevices(),task={algorithm:'gnss-prediction',input:ds[0].id},source=a.sourceFor(task,ds,36,1)
 ds[0].status='离线';const later=a.sourceFor({...task,source},ds,90,3)
 assert.equal(later,source);assert.equal(later.packet.status,'已入库');assert.equal(later.mapping,1);assert.equal(later.frame,36)
 assert.equal(a.packetData(ds,90,3)[0].status,'中断')
})
test('microseismic probe and DAQ are separate instruments with separate parts',()=>{
 const models=a.hardwareModels;assert.notDeepEqual(models.micro.parts.map(p=>p.id),models.daq.parts.map(p=>p.id))
 const seeds=a.seedAcquisitionDevices();assert.equal(seeds.length,3)
 for(const d of seeds){assert.equal(d.type,'数采板');assert.ok(a.seedDevices().some(p=>p.id===d.linkedDevice));assert.equal(a.sensorFamily(d),'daq')}
})
