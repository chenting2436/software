import { useEffect, useState } from 'react'
import { Activity, ChevronLeft, Database, Expand, Layers3, MapPinned, RadioTower, ShieldCheck, Shrink } from 'lucide-react'
import { DashboardWidget } from './DashboardWidget'
import { Brand } from './Brand'
import type { DashboardWidget as DashboardWidgetLayout } from '../types'
import { AlgorithmCenterModule, DataCenterModule, DeviceStatusModule, RiskClosedLoopModule } from './BigScreenModules'
import { DASHBOARD_CAPACITY, normalizeDashboard, slotOf } from '../data/dashboardLayout'

type BigScreenSection = 'overview' | 'device' | 'data' | 'algorithm' | 'risk'

const bigScreenSections = [
  { key: 'overview' as const, label: '综合态势', meta: '自定义排版', icon: Activity },
  { key: 'device' as const, label: '设备状态', meta: '173 台设备', icon: MapPinned },
  { key: 'data' as const, label: '数据中心', meta: '回传与处理', icon: Database },
  { key: 'algorithm' as const, label: '算法中心', meta: '31 项算法', icon: Layers3 },
  { key: 'risk' as const, label: '预警闭环', meta: '处置与报告', icon: ShieldCheck },
]

interface DashboardPreviewProps {
  widgets: DashboardWidgetLayout[]
  screenMode: '16:9' | '21:9'
  onBack: () => void
}

export function DashboardPreview({ widgets, screenMode, onBack }: DashboardPreviewProps) {
  const [time, setTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const [section, setSection] = useState<BigScreenSection>('overview')
  const roles = ['项目管理员', '算法工程师', '客户访客'] as const
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }

  const screenWidgets = normalizeDashboard(widgets)

  return (
    <section className="big-screen">
      <header className="big-screen__header">
        <button className="big-screen__back" onClick={onBack}><ChevronLeft size={18} />返回设计器</button>
        <div className="big-screen__title">
          <Brand compact inverse />
          <div><h1>露天矿山空天地深全域感知与边坡数智化管控平台</h1><span>土行孙 V2 综合监测演示大屏</span></div>
        </div>
        <div className="big-screen__clock">
          <strong>{time.toLocaleTimeString('zh-CN', { hour12: false })}</strong>
          <span>{time.toLocaleDateString('zh-CN').replaceAll('/', '-')} · 徐州</span>
          <button onClick={toggleFullscreen}>{isFullscreen ? <Shrink size={17} /> : <Expand size={17} />}</button>
        </div>
      </header>

      <div className="big-screen__meta">
        <span><i />矿大综合监测演示项目</span>
        <span><RadioTower size={14} />173 台设备在线</span>
        <span><Layers3 size={14} />主动源 · 被动源 · 微震 · 稳定性 · GNSS</span>
        <span>{screenMode} · {screenWidgets.length}/9 个模块</span>
        <button
          className="role-pill"
          onClick={() => setRoleIndex((value) => (value + 1) % roles.length)}
          title="点击切换演示权限账号"
        >
          演示账号 · {roles[roleIndex]}
        </button>
        <span className="offline-pill">离线演示模式</span>
      </div>

      <nav className="big-screen__module-nav">
        {bigScreenSections.map((item) => {
          const Icon = item.icon
          return <button className={section === item.key ? 'is-active' : ''} key={item.key} onClick={() => setSection(item.key)}><Icon size={15} /><span><strong>{item.label}</strong><small>{item.meta}</small></span></button>
        })}
      </nav>

      {section === 'overview' && (
        <main
          className={`big-screen__grid big-screen__grid--fixed big-screen__grid--${screenMode.replace(':', '-')}`}
        >
          {screenWidgets.map((widget) => (
            <div
              className="screen-panel"
              key={widget.uid}
              style={{
                gridColumn: widget.x + 1,
                gridRow: widget.y + 1,
              }}
            >
              <DashboardWidget kind={widget.kind} dark />
            </div>
          ))}
          {Array.from({ length: DASHBOARD_CAPACITY }, (_, slot) => slot).filter((slot) => !screenWidgets.some((widget) => slotOf(widget) === slot)).map((slot) => <div className="screen-panel screen-panel--empty" key={`empty-${slot}`} style={{ gridColumn: slot % 3 + 1, gridRow: Math.floor(slot / 3) + 1 }}><span>{String(slot + 1).padStart(2, '0')}</span><small>未配置模块</small></div>)}
        </main>
      )}
      {section === 'device' && <DeviceStatusModule />}
      {section === 'data' && <DataCenterModule />}
      {section === 'algorithm' && <AlgorithmCenterModule />}
      {section === 'risk' && <RiskClosedLoopModule />}
    </section>
  )
}
