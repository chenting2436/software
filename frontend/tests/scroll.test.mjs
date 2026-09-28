import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const root = fileURLToPath(new URL('..', import.meta.url))
const result = await build({ entryPoints: [root + '/src/studio/scrollLock.ts'], bundle: true, write: false, platform: 'node', format: 'cjs' })
const module = { exports: {} }
new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports)
const { lockBodyScroll } = module.exports

test('the base page remains scrollable after all three stylesheets load', async () => {
  let overflow
  for (const file of ['style.css', 'studio/studio.css', 'studio/product.css']) {
    postcss.parse(await readFile(root + '/src/' + file, 'utf8')).walkRules(rule => {
      if (rule.selectors?.includes('body')) rule.walkDecls('overflow', decl => { overflow = decl.value })
    })
  }
  assert.equal(overflow, 'auto')
})

test('single dialog restores stylesheet-controlled document scrolling', () => {
  const body = { style: { overflow: '' } }
  const release = lockBodyScroll(body)
  assert.equal(body.style.overflow, 'hidden')
  release()
  assert.equal(body.style.overflow, '')
  release()
  assert.equal(body.style.overflow, '')
})

test('workstation root allows narrow windows without a forced 1040px document', async()=>{
 const widths={html:undefined,body:undefined,'#root':undefined};
 for(const file of ['style.css','studio/studio.css','studio/product.css','studio/lab.css'])postcss.parse(await readFile(root+'/src/'+file,'utf8')).walkRules(rule=>{for(const selector of Object.keys(widths))if(rule.selectors?.includes(selector))rule.walkDecls('min-width',decl=>widths[selector]=decl.value)});
 assert.deepEqual(widths,{html:'0',body:'0','#root':'0'})
})

test('nested dialogs restore scrolling in either cleanup order', () => {
  for (const order of [[0, 1], [1, 0]]) {
    const body = { style: { overflow: 'auto' } }
    const releases = [lockBodyScroll(body), lockBodyScroll(body)]
    releases[order[0]]()
    assert.equal(body.style.overflow, 'hidden')
    releases[order[1]]()
    assert.equal(body.style.overflow, 'auto')
  }
})

test('repeated dialog mounts do not leave a stale hidden overflow', () => {
  const body = { style: { overflow: '' } }
  for (let i = 0; i < 5; i++) {
    const release = lockBodyScroll(body)
    assert.equal(body.style.overflow, 'hidden')
    release()
    assert.equal(body.style.overflow, '')
  }
})
