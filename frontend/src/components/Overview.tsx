import {
  Activity,
  ArrowRight,
  Box,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Layers3,
  MonitorCog,
  RadioTower,
  ShieldCheck,
} from 'lucide-react'
import { moduleCatalog, solutionTemplates, widgetCatalog } from '../data/catalog'
import type { DemoProfile, PageKey } from '../types'

interface OverviewProps {
  profile: DemoProfile
  onNavigate: (page: PageKey) => void
}

export function Overview({ profile, onNavigate }: OverviewProps) {
  return (
    <section className="page">
      <div className="hero-card">
        <div className="hero-card__content">
          <span className="eyebrow">Tuxingsun V2 · Offline Demo</span>
          <h1>把监测能力拖进大屏，<br />一键生成客户方案。</h1>
          <p>主动源、被动源、微震与边坡监测能力已经整理为可选择、可编排、可演示的模块。</p>
          <div className="hero-card__actions">
            <button className="button button--primary" onClick={() => onNavigate('solution')}>开始配置方案<ArrowRight size={16} /></button>
            <button className="button button--ghost" onClick={() => onNavigate('designer')}>设计大屏</button>
          </div>
        </div>
        <div className="hero-card__visual">
          <div className="orbit orbit--one"><span><RadioTower size={18} /></span></div>
          <div className="orbit orbit--two"><span><Activity size={18} /></span></div>
          <div className="hero-core"><Layers3 size={42} /><strong>{moduleCatalog.length}</strong><span>功能模块</span></div>
          <div className="hero-chip hero-chip--top"><CheckCircle2 size={14} />离线数据就绪</div>
          <div className="hero-chip hero-chip--bottom"><ShieldCheck size={14} />不接真实硬件</div>
        </div>
      </div>

      <div className="stat-strip">
        <div><Box size={20} /><span>功能模块<strong>{moduleCatalog.length}</strong></span><small>全量目录</small></div>
        <div><MonitorCog size={20} /><span>大屏组件<strong>{widgetCatalog.length}</strong></span><small>拖拽排版</small></div>
        <div><Database size={20} /><span>模拟数据<strong>6</strong></span><small>本地内置</small></div>
        <div><ShieldCheck size={20} /><span>外部依赖<strong>0</strong></span><small>离线优先</small></div>
      </div>

      <div className="content-grid content-grid--two">
        <div className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Solution Packs</span><h2>推荐演示方案</h2></div><button onClick={() => onNavigate('solution')}>查看全部<ArrowRight size={14} /></button></div>
          <div className="template-list">
            {solutionTemplates.map((template) => (
              <button className="template-row" key={template.id} onClick={() => onNavigate('solution')}>
                <i style={{ background: template.accent }} />
                <div><strong>{template.name}</strong><span>{template.description}</span></div>
                <span>{template.moduleIds.length} 模块</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel machine-panel">
          <div className="panel-heading"><div><span className="eyebrow">Local Runtime</span><h2>演示机配置</h2></div><span className="status-badge status-badge--success">已适配</span></div>
          <div className="machine-grid">
            <div><Cpu size={18} /><span>处理器</span><strong>{profile.cpu}</strong></div>
            <div><Database size={18} /><span>内存</span><strong>{profile.memory}</strong></div>
            <div><Activity size={18} /><span>显卡</span><strong>{profile.gpu}</strong></div>
            <div><HardDrive size={18} /><span>部署</span><strong>本地离线包</strong></div>
          </div>
          <div className="runtime-note">
            <CheckCircle2 size={16} />
            <div><strong>运行策略</strong><span>所有演示资源随安装包分发，默认不访问公网、不连接设备、不上传数据。</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
