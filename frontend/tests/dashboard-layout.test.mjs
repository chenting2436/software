import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/data/dashboardLayout.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const { normalizeDashboard, moveDashboardWidget, slotOf, DASHBOARD_LAYOUT_KEY, LEGACY_DASHBOARD_LAYOUT_KEY } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const widget = (kind, x = 0, y = 0) => ({ uid: kind, kind, x, y, w: 1, h: 1 })

test('legacy layouts migrate to nine equal slots without mutating the saved source', () => {
  const original = Array.from({ length: 11 }, (_, i) => ({ ...widget(`item-${i}`, (i % 3) * 4, Math.floor(i / 3) * 3), w: 4, h: 3 })).reverse()
  const backup = JSON.stringify(original)
  const migrated = normalizeDashboard(original)
  assert.equal(migrated.length, 9)
  assert.deepEqual(migrated.map((item) => item.kind), Array.from({ length: 9 }, (_, i) => `item-${i}`))
  assert.deepEqual(migrated.map(slotOf), [0, 1, 2, 3, 4, 5, 6, 7, 8])
  assert.ok(migrated.every((item) => item.w === 1 && item.h === 1))
  assert.equal(JSON.stringify(original), backup)
  assert.notEqual(DASHBOARD_LAYOUT_KEY, LEGACY_DASHBOARD_LAYOUT_KEY)
})

test('moving onto an occupied slot swaps both modules without losing either', () => {
  const result = moveDashboardWidget([widget('map'), widget('ledger', 2, 2)], 'map', 8)
  assert.deepEqual(result.map((item) => [item.kind, slotOf(item)]), [['map', 8], ['ledger', 0]])
})

test('empty positions remain empty after save/load normalization', () => {
  const result = normalizeDashboard([widget('map', 2, 0), widget('device', 0, 2)])
  assert.deepEqual(result.map(slotOf), [2, 6])
  assert.deepEqual(normalizeDashboard(JSON.parse(JSON.stringify(result))), result)
})

test('duplicate, overlapping and out-of-range persisted positions recover safely', () => {
  const result = normalizeDashboard([widget('map'), widget('map', 1), widget('device'), widget('ledger', -1, 0), widget('risk', 2, 100)])
  assert.equal(result.length, 4)
  assert.equal(new Set(result.map(slotOf)).size, 4)
  assert.ok(result.every((item) => slotOf(item) >= 0 && slotOf(item) < 9))
})

test('moving to an empty slot preserves other positions and rejects invalid targets', () => {
  const initial = [widget('map'), widget('device', 1)]
  assert.deepEqual(moveDashboardWidget(initial, 'map', 7).map(slotOf), [7, 1])
  assert.deepEqual(moveDashboardWidget(initial, 'map', 9), initial)
})
