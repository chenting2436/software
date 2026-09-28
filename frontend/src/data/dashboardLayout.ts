import type { DashboardWidget } from '../types'

export const DASHBOARD_COLUMNS = 3
export const DASHBOARD_CAPACITY = 9
export const DASHBOARD_LAYOUT_KEY = 'kuangda-dashboard-layout-3x3'
export const LEGACY_DASHBOARD_LAYOUT_KEY = 'kuangda-dashboard-layout'

export function slotOf(widget: DashboardWidget) {
  return widget.y * DASHBOARD_COLUMNS + widget.x
}

export function atSlot(widget: DashboardWidget, slot: number): DashboardWidget {
  return { ...widget, x: slot % DASHBOARD_COLUMNS, y: Math.floor(slot / DASHBOARD_COLUMNS), w: 1, h: 1 }
}

// Old freeform layouts are read without overwriting their original saved copy.
export function normalizeDashboard(items: DashboardWidget[]): DashboardWidget[] {
  const kinds = new Set<string>()
  const unique = items.filter((item) => {
    if (!item || typeof item.kind !== 'string' || typeof item.uid !== 'string' || kinds.has(item.kind)) return false
    kinds.add(item.kind)
    return true
  })
  const isLegacy = unique.some((item) => item.w !== 1 || item.h !== 1)
  if (isLegacy) unique.sort((a, b) => a.y - b.y || a.x - b.x)
  const occupied = new Set<number>()
  return unique.slice(0, DASHBOARD_CAPACITY).map((item, index) => {
    let slot = isLegacy ? index : slotOf(item)
    if (!Number.isInteger(item.x) || item.x < 0 || item.x >= DASHBOARD_COLUMNS || !Number.isInteger(slot) || slot < 0 || slot >= DASHBOARD_CAPACITY || occupied.has(slot)) {
      slot = Array.from({ length: DASHBOARD_CAPACITY }, (_, position) => position).find((position) => !occupied.has(position))!
    }
    occupied.add(slot)
    return atSlot(item, slot)
  })
}

export function moveDashboardWidget(items: DashboardWidget[], uid: string, target: number): DashboardWidget[] {
  if (!Number.isInteger(target) || target < 0 || target >= DASHBOARD_CAPACITY) return items
  const source = items.find((item) => item.uid === uid)
  if (!source) return items
  const origin = slotOf(source)
  return items.map((item) => item.uid === uid ? atSlot(item, target) : slotOf(item) === target ? atSlot(item, origin) : item)
}
