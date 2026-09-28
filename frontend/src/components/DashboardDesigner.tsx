import { useMemo, useRef, useState, type DragEvent, type PointerEvent } from 'react'
import { Check, GripVertical, Monitor, Plus, RotateCcw, Save, Search, Trash2 } from 'lucide-react'
import { widgetCatalog, widgetCategoryOrder } from '../data/catalog'
import { DASHBOARD_CAPACITY, DASHBOARD_LAYOUT_KEY, LEGACY_DASHBOARD_LAYOUT_KEY, atSlot, moveDashboardWidget, slotOf } from '../data/dashboardLayout'
import type { DashboardWidget, WidgetCategory, WidgetKind } from '../types'
import { DashboardWidget as WidgetContent } from './DashboardWidget'

interface DashboardDesignerProps {
  widgets: DashboardWidget[]
  screenMode: '16:9' | '21:9'
  onChange: (widgets: DashboardWidget[]) => void
  onScreenModeChange: (mode: '16:9' | '21:9') => void
  onPreview: () => void
  onReset: () => void
}

const categoryLabels: Array<'全部' | WidgetCategory> = ['全部', ...widgetCategoryOrder]
const slots = Array.from({ length: DASHBOARD_CAPACITY }, (_, index) => index)

export function DashboardDesigner({ widgets, screenMode, onChange, onScreenModeChange, onPreview, onReset }: DashboardDesignerProps) {
  const [paletteCategory, setPaletteCategory] = useState<'全部' | WidgetCategory>('全部')
  const [paletteSearch, setPaletteSearch] = useState('')
  const [savedAt, setSavedAt] = useState('')
  const [notice, setNotice] = useState(() => {
    const legacy = localStorage.getItem(LEGACY_DASHBOARD_LAYOUT_KEY)
    if (legacy && !localStorage.getItem(DASHBOARD_LAYOUT_KEY)) return '旧版布局已转换为九宫格，最多保留前 9 个模块；旧布局原始记录仍保留，其他模块可从组件库重新选择。'
    return ''
  })
  const [dragTarget, setDragTarget] = useState<number | null>(null)
  const pointerDrag = useRef<{ uid?: string; kind?: string; x: number; y: number; target: number | null; moved: boolean } | null>(null)
  const filteredWidgets = useMemo(() => widgetCatalog.filter((item) => {
    const keyword = paletteSearch.trim().toLowerCase()
    return (paletteCategory === '全部' || item.category === paletteCategory) && (!keyword || `${item.name} ${item.description} ${item.features?.join(' ') ?? ''}`.toLowerCase().includes(keyword))
  }), [paletteCategory, paletteSearch])
  const usedKinds = useMemo(() => new Set(widgets.map((widget) => widget.kind)), [widgets])
  const isFull = widgets.length >= DASHBOARD_CAPACITY

  const changeLayout = (next: DashboardWidget[]) => { setSavedAt(''); onChange(next) }
  const addWidget = (kind: WidgetKind, target?: number) => {
    if (usedKinds.has(kind)) return
    if (isFull) { setNotice('本屏已满 9 个模块，请先移除一个模块再添加。'); return }
    if (!widgetCatalog.some((item) => item.kind === kind)) return
    const occupied = new Set(widgets.map(slotOf))
    const slot = target !== undefined && !occupied.has(target) ? target : slots.find((index) => !occupied.has(index))!
    changeLayout([...widgets, atSlot({ uid: `${kind}-${Date.now()}`, kind, x: 0, y: 0, w: 1, h: 1 }, slot)])
    setNotice('模块已添加。拖动模块上方的移动手柄可交换位置。')
  }
  const startPointerDrag = (event: PointerEvent<HTMLElement>, source: { uid?: string; kind?: string }) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerDrag.current = { ...source, x: event.clientX, y: event.clientY, target: null, moved: false }
  }
  const movePointerDrag = (event: PointerEvent<HTMLElement>) => {
    const source = pointerDrag.current
    if (!source || Math.hypot(event.clientX - source.x, event.clientY - source.y) < 5) return
    source.moved = true
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('.dashboard-slot')
    source.target = element ? Number(element.dataset.slot) - 1 : null
    setDragTarget(source.target)
  }
  const finishPointerDrag = (event: PointerEvent<HTMLElement>) => {
    const source = pointerDrag.current
    pointerDrag.current = null
    setDragTarget(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!source?.moved || source.target === null) return
    if (source.uid) {
      changeLayout(moveDashboardWidget(widgets, source.uid, source.target))
      setNotice('模块位置已调整，保存后预览将使用相同位置。')
    } else if (source.kind) addWidget(source.kind, source.target)
  }
  const cancelPointerDrag = () => { pointerDrag.current = null; setDragTarget(null) }
  const dropIntoSlot = (event: DragEvent, slot: number) => {
    event.preventDefault()
    setDragTarget(null)
    const uid = event.dataTransfer.getData('application/kuangda-slot')
    if (uid) {
      changeLayout(moveDashboardWidget(widgets, uid, slot))
      setNotice('模块位置已调整，保存后预览将使用相同位置。')
    } else {
      const kind = event.dataTransfer.getData('application/kuangda-widget')
      if (kind) addWidget(kind, slot)
    }
  }
  const saveLayout = () => {
    try {
      localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(widgets))
      localStorage.setItem('kuangda-dashboard-screen-mode', screenMode)
      setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
      setNotice('九宫格布局已保存。')
      return true
    } catch {
      setNotice('当前环境无法保存布局，请检查本地存储空间后重试。')
      return false
    }
  }

  return (
    <section className="page page--designer">
      <div className="page-heading">
        <div><span className="eyebrow">Dashboard Composer</span><h1>大屏组件排版</h1><p>固定 3 × 3 九宫格，每屏最多 9 个等大模块。拖动调整位置，点击模块进入完整页面。</p></div>
        <div className="heading-actions">
          <div className="segmented-control">{(['16:9', '21:9'] as const).map((mode) => <button className={screenMode === mode ? 'is-active' : ''} key={mode} onClick={() => { setSavedAt(''); onScreenModeChange(mode) }}>{mode}</button>)}</div>
          <button className="button button--ghost" onClick={() => { setSavedAt(''); onReset() }}><RotateCcw size={16} />恢复默认</button>
          <button className="button button--secondary" onClick={saveLayout}><Save size={16} />保存布局</button>
          <button className="button button--primary" onClick={() => { if (saveLayout()) onPreview() }}><Monitor size={16} />保存并预览</button>
        </div>
      </div>
      {notice && <div className="layout-notice" role="status">{notice}</div>}
      <div className="designer-workspace">
        <aside className="widget-palette">
          <div className="widget-palette__title"><div><Plus size={17} /><strong>组件库</strong></div><span>共 {widgetCatalog.length} 项 · 本屏 {widgets.length}/9</span></div>
          <label className="palette-search"><Search size={14} /><input value={paletteSearch} onChange={(event) => setPaletteSearch(event.target.value)} placeholder="搜索设备、数据、算法或业务页面" /></label>
          <div className="palette-tabs">{categoryLabels.map((category) => <button key={category} className={paletteCategory === category ? 'is-active' : ''} onClick={() => setPaletteCategory(category)}>{category}</button>)}</div>
          <div className="palette-list">
            {filteredWidgets.map((item) => {
              const isUsed = usedKinds.has(item.kind)
              return <div className={`palette-item ${isUsed ? 'is-used' : ''} ${isFull && !isUsed ? 'is-full' : ''}`} key={item.kind} onPointerDown={(event) => {
                if (!isUsed && !isFull && !(event.target as HTMLElement).closest('button')) startPointerDrag(event, { kind: item.kind })
              }} onPointerMove={movePointerDrag} onPointerUp={finishPointerDrag} onPointerCancel={cancelPointerDrag} onDoubleClick={() => addWidget(item.kind)}>
                <GripVertical size={16} />
                <div><strong>{item.name}</strong><span>{isUsed ? '已添加到当前大屏' : item.description}</span><small>{item.category} · {item.workload ?? '可视化组件'}</small></div>
                <button disabled={isUsed || isFull} onClick={() => addWidget(item.kind)} aria-label={isUsed ? `${item.name}已添加` : `添加${item.name}`} title={isFull && !isUsed ? '本屏已满，请先移除一个模块' : undefined}>{isUsed ? <Check size={15} /> : <Plus size={15} />}</button>
              </div>
            })}
            {!filteredWidgets.length && <div className="palette-hint">未找到相关模块</div>}
          </div>
          <div className="palette-hint">{isFull ? '本屏已满 9 个模块，移除后可继续添加' : `还可添加 ${DASHBOARD_CAPACITY - widgets.length} 个模块 · 每项仅可使用一次`}</div>
        </aside>
        <div className="dashboard-canvas-shell">
          <div className="canvas-toolbar"><div><i className="status-dot" /><span>矿大综合监测大屏</span><small>{screenMode} · 3 × 3 固定网格</small></div><div><span>{widgets.length}/9 个模块</span>{savedAt && <span>已保存 {savedAt}</span>}</div></div>
          <div className={`dashboard-canvas dashboard-canvas--fixed dashboard-canvas--${screenMode.replace(':', '-')}`}>
            <div className="dashboard-slot-grid">
              {slots.map((slot) => {
                const widget = widgets.find((item) => slotOf(item) === slot)
                return <div className={`dashboard-slot ${dragTarget === slot ? 'is-drop-target' : ''} ${!widget ? 'is-empty' : ''}`} key={slot} data-slot={slot + 1} onDragOver={(event) => { event.preventDefault(); setDragTarget(slot) }} onDragLeave={() => setDragTarget(null)} onDrop={(event) => dropIntoSlot(event, slot)}>
                  {widget ? <>
                    <div className="dashboard-slot__controls">
                      <button className="dashboard-slot__move" onPointerDown={(event) => startPointerDrag(event, { uid: widget.uid })} onPointerMove={movePointerDrag} onPointerUp={finishPointerDrag} onPointerCancel={cancelPointerDrag} aria-label={`移动${widgetCatalog.find((item) => item.kind === widget.kind)?.name ?? widget.kind}`} title="拖动交换位置"><GripVertical size={13} /><span>{String(slot + 1).padStart(2, '0')}</span></button>
                      <select aria-label={`模块 ${slot + 1} 移动到位置`} value={slot} onChange={(event) => changeLayout(moveDashboardWidget(widgets, widget.uid, Number(event.target.value)))}>{slots.map((position) => <option value={position} key={position}>位置 {position + 1}</option>)}</select>
                      <button onClick={() => { changeLayout(widgets.filter((item) => item.uid !== widget.uid)); setNotice('模块已移出当前大屏，可随时从组件库重新添加。') }} aria-label={`移除${widgetCatalog.find((item) => item.kind === widget.kind)?.name ?? widget.kind}`} title="从大屏移除"><Trash2 size={13} /></button>
                    </div>
                    <div className="dashboard-slot__content"><WidgetContent key={widget.uid} kind={widget.kind} /></div>
                  </> : <div className="dashboard-slot__empty"><span>{String(slot + 1).padStart(2, '0')}</span><Plus size={24} /><strong>拖入功能模块</strong><small>固定尺寸 · 也可点击左侧添加</small></div>}
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
