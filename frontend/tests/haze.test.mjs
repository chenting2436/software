import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import postcss from 'postcss'

const root=fileURLToPath(new URL('..',import.meta.url))
const bundled=await build({stdin:{contents:`
 import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
 import {StudioApp} from './src/studio/StudioApp';
 export {algorithmSpecs} from './src/studio/algorithms';
 export {boardDisplayName,pageDisplayName,migrateBoard} from './src/studio/boardLayout';
 export {parseRoute,routeHash} from './src/studio/navigation';
 export function render(){return renderToStaticMarkup(<StudioApp/>)}
`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},external:['react','react-dom/server'],logOverride:{'empty-import-meta':'silent'}})
const module={exports:{}}
new Function('require','module','exports',bundled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const api=module.exports
globalThis.sessionStorage={getItem:key=>key==='kuangda-local-session-v1'?JSON.stringify({user:'root',createdAt:1}):null}
function render(route){globalThis.location={hash:'#/'+route};return api.render()}

test('every main route shares the cinematic shell and all secondary entries',()=>{
 for(const route of ['overview','device','data','algorithm','trace','risk','account','config','solution','library','workflow','workspace/channelManager']){
  const html=render(route)
  assert.ok(html.includes('cinematic-shell'),route)
  assert.ok(!html.includes('scientific-ui'),route)
  for(const removed of ['science-ribbon','science-paper','science-library','science-method-layout','spac-desktop','algorithm-desktop'])assert.ok(!html.includes(removed),route+'/'+removed)
  assert.ok(!html.includes('studio-sidebar'),route)
  for(const label of ['设备管理','数据管理','算法分析','数据回溯','大屏编排','预警闭环','全部功能','客户方案','流程编排','账号管理','配置与审计','版本信息'])assert.ok(html.includes(label),route+'/'+label)
 }
})
test('all four platform routes use the full exhibition with part, telemetry and related data controls',()=>{
 for(const id of ['SAT-301','UAV-201','UGV-202','DEEP-203']){
  const html=render('device/'+id)
  assert.ok(!html.includes('设备结构拆解程度'), 'structure is controlled by buttons, not a slider')
  for(const token of ['device-showroom','选择设备部件','展开结构','关联采集数据','完整设备工作区'])assert.ok(html.includes(token),id+'/'+token)
 }
})
test('device gallery preserves all seven model families and all six management tabs',()=>{
 const html=render('device')
 for(const label of ['卫星遥感','无人机','地面雷达','深地感知','GNSS 终端','微震传感器','独立数采板','设备台账','通道与采集','通信与协议','电源与诊断','维护记录','设备索引'])assert.ok(html.includes(label),label)
})
test('all algorithm glass workspaces keep figures, export, version and source controls',()=>{
 for(const spec of api.algorithmSpecs){
  const html=render('algorithm/'+spec.id+(spec.id==='spac'?'?task=TASK-0010':''))
  for(const label of ['分析工具栏','版本对比','输入记录','导出报告','输入追溯','数据与方法','归档','glass-workspace-status','返回算法目录'])assert.ok(html.includes(label),spec.id+'/'+label)
  assert.ok(html.includes('algorithm-experience'),spec.id);assert.ok(html.includes('专业分析'),spec.id);assert.ok(!html.includes('lab-primary-figure'),spec.id)
  assert.ok(!html.includes('lab-context-strip'));assert.ok(html.includes('cinematic-shell'));assert.ok(!html.includes('scientific-ui'));assert.ok(!html.includes('science-ribbon'))
 }
})

test('SPAC uses the glass shell while retaining picking, data, export and processing',async()=>{
 const html=render('algorithm/spac')
 assert.ok(html.includes('cinematic-shell'));assert.ok(!html.includes('spac-desktop'));assert.ok(!html.includes('spac-ribbon'))
 for(const label of ['SPAC 分析工具','更多 SPAC 操作','spac-overview','SPAC 观测环组','glass-workspace-status','专业分析','返回算法目录'])assert.ok(html.includes(label),label)
 assert.ok(render('algorithm/taup').includes('domain-presentation'))
 const source=await readFile(root+'/src/studio/SpacWorkbench.tsx','utf8');for(const label of ['SPAC 成果视图','数值拾取','拾取与图层','导出拾取数据','观测阵列'])assert.ok(source.includes(label),label)
})
test('a ledger deep link overrides a previously remembered overview tab',()=>{
 const previous=globalThis.sessionStorage
 globalThis.sessionStorage={getItem:key=>key==='kd-view:device-tab'?'"设备总览"':previous.getItem(key)}
 try { const html=render('workspace/deviceLedger');assert.ok(html.includes('<table>'));assert.ok(!html.includes('aria-label="设备展厅"')) }
 finally { if(previous===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=previous }
})
test('glass material applies globally including portal and presentation controls',async()=>{
 const css=postcss.parse(await readFile(root+'/src/studio/haze.css','utf8'))
 let common
 css.walkRules(rule=>{if(rule.selectors?.includes('.studio.studio button')&&rule.nodes.some(d=>d.prop==='backdrop-filter'))common=rule})
 assert.ok(common)
 assert.ok(common.nodes.some(d=>d.prop==='background'&&d.value.includes('linear-gradient')&&d.important))
 assert.ok(common.nodes.some(d=>d.prop==='backdrop-filter'&&d.value.includes('blur')))
 assert.ok(common.nodes.some(d=>d.prop==='border'&&d.important))
 assert.ok(render('preview').includes('studio board-presentation'))
})
test('sensor controls and raw historical records remain accessible behind visual simplification',()=>{
 const sensor=render('device/GNSS-001')
 for(const label of ['部件说明','供电与协议','实时通道','运行与维护','历史与证据','诊断与维护'])assert.ok(sensor.includes(label))
 const trace=render('trace')
 assert.ok(trace.includes('报文明细'))
 assert.ok(trace.includes('成果归档'))
 assert.ok(trace.includes('历史回放时间'))
})
test('overview is a map-first workspace without decorative slogans',()=>{
 const html=render('overview')
 for(const removed of ['北帮矿区 · 多源监测','矿山安全<br','一体化监测','cinema-intro','查看巡检设备'])assert.ok(!html.includes(removed),removed)
 assert.ok(html.includes('overview-status-rail'))
 assert.ok(html.includes('选中设备状态')===false)
 for(const name of ['总览','设备','数据','算法','回溯'])assert.ok(html.includes('>'+name+'</button>'))
})
test('presentation display aliases do not rewrite a saved board',()=>{
 const source=[{uid:'keep-a',kind:'siteMap',x:0,y:0},{uid:'keep-b',kind:'deviceLedger',x:1,y:0}]
 const doc=api.migrateBoard(source,new Set(['siteMap','deviceLedger'])),before=JSON.stringify(doc)
 assert.equal(api.boardDisplayName(doc.name),'综合监测')
 assert.equal(api.pageDisplayName(doc.pages[0].name),'监测')
 assert.equal(api.boardDisplayName('甲方自定义名称'),'甲方自定义名称')
 assert.equal(JSON.stringify(doc),before)
 assert.deepEqual(source.map(x=>x.uid),['keep-a','keep-b'])
})
test('snapshot links preserve their exact frozen archive and frame',()=>{
 const route={page:'trace',snapshot:'frozen-123',frame:'42',device:'GNSS-001'}
 assert.deepEqual(api.parseRoute(api.routeHash(route)),route)
 const html=render('trace?frame=42')
 assert.ok(html.includes('value="42"'))
})
test('administration and equipment pages expose contextual drawers instead of always-open editors',()=>{
 const account=render('account')
 assert.ok(account.includes('新增账号')&&account.includes('权限矩阵'))
 assert.ok(!account.includes('新账号姓名'))
 assert.equal((account.match(/<select/g)||[]).length,1) // role preview lives in account management only
 const ledger=render('workspace/deviceLedger')
 assert.ok(!ledger.includes('class="device-detail"'))
 const sensor=render('device/GNSS-001')
 assert.ok(sensor.includes('诊断与维护')&&!sensor.includes('注入部件故障'))
})
test('active app cannot load desktop themes or bypass its shared shell',async()=>{
 const app=await readFile(root+'/src/studio/StudioApp.tsx','utf8')
 const lab=await readFile(root+'/src/studio/AlgorithmLab.tsx','utf8')
 const spac=await readFile(root+'/src/studio/SpacWorkbench.tsx','utf8')
 for(const source of [app,lab,spac]){
  assert.ok(!/import[^\n]*(?:scientific\.css|spacWorkbench\.css|algorithmDesktop\.css|ScientificLibrary|ScientificAlgorithmIndex|AlgorithmDesktop['"])/.test(source))
 }
 assert.ok(!app.includes('value="scientific"'))
 assert.ok(lab.includes('annotations={annotations}')&&lab.includes('channelCountFor(id)>0'))
 assert.ok(!spac.includes('spac-menubar')&&!spac.includes('spac-ribbon'))
})
