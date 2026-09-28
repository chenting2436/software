import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import postcss from 'postcss'
const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {RecordSummary} from './src/studio/RecordSummary';export * from './src/studio/boardLayout';export function summary(value){return renderToStaticMarkup(<RecordSummary value={value}/>);}`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',external:['react','react-dom/server']})
const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);const a=module.exports
test('normalizing a board preserves stable page IDs and saved device/time context',()=>{
 const doc={version:4,name:'客户屏',ratio:'21:9',context:{device:'MS-022',frame:57},pages:[{id:'original-page',name:'监测',primary:'siteMap',items:[{id:'tile-a',kind:'siteMap'},{id:'tile-b',kind:'quality'}]}]},valid=new Set(['siteMap','quality']),before=JSON.stringify(doc)
 const normalized=a.normalizeBoard(doc,valid)
 assert.equal(normalized.pages[0].id,'original-page');assert.deepEqual(normalized.context,doc.context);assert.equal(JSON.stringify(doc),before)
 assert.deepEqual(a.arrangeBoard(normalized.pages[0]),a.arrangeBoard(a.normalizeBoard(normalized,valid).pages[0]))
 assert.equal(a.normalizeBoard({...doc,context:{device:'MS-022',frame:999}},valid).context.frame,120)
})
test('record summaries expose a download without printing raw objects or JSON blocks',()=>{
 const html=a.summary({device:'MS-022',status:'已入库',raw:123,params:{secretNested:'not-in-main-screen'}})
 assert.ok(html.includes('MS-022')&&html.includes('下载原始记录'));assert.ok(!html.includes('<pre')&&!html.includes('not-in-main-screen'))
 assert.ok(a.summary([{id:1},{id:2}]).includes('2 条记录'))
})
test('common centered dialog applies glass to the surface and nested dialogs restore focus isolation',async()=>{
 const source=await readFile(root+'/src/studio/WorkspaceDrawer.tsx','utf8'),css=postcss.parse(await readFile(root+'/src/studio/productRefinement.css','utf8'))
 assert.ok(source.includes('dialogs.at(-1)!==el'));assert.ok(source.includes('rootWasInert'));assert.ok(source.includes("e.key==='Escape'"));assert.ok(source.includes("e.key!=='Tab'"))
 let glass=false,center=false;css.walkRules(rule=>{if(rule.selector==='.studio.unified-glass-modal')center ||=rule.nodes.some(d=>d.prop==='place-items'&&d.value==='center');if(rule.selector==='.studio.unified-glass-modal .workspace-drawer')glass ||=rule.nodes.some(d=>d.prop==='backdrop-filter'&&d.value.includes('blur'))});assert.ok(glass&&center)
})
test('editor and presentation share a scale-only canvas while actions stay isolated from dragging',async()=>{
 const source=await readFile(root+'/src/studio/BoardStudio.tsx','utf8'),viewport=await readFile(root+'/src/studio/BoardViewport.tsx','utf8')
 assert.ok(source.includes('const grid=<BoardViewport'));assert.ok(source.includes('editing={!presentation}'));assert.ok(source.includes('撤销排版')&&source.includes('重做排版')&&source.includes('排版历史'));assert.ok(viewport.includes('ResizeObserver')&&viewport.includes('Math.min(el.clientWidth/width,el.clientHeight/height)'))
})
test('device history does not misrepresent isolated snapshots as continuous trends',async()=>{
 const source=await readFile(root+'/src/studio/DeviceHistory.tsx','utf8')
 assert.ok(source.includes('archive?<div className="device-frozen-evidence"'));assert.ok(source.includes('device.id===base[0].id'));assert.ok(source.includes('device.id===base[1].id'));assert.ok(!source.includes('<TraceStudio'))
})
