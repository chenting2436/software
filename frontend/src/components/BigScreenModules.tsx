import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Database,
  FileCheck2,
  Gauge,
  Layers3,
  Play,
  RadioTower,
  RefreshCw,
  Router,
  Satellite,
  Server,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import { moduleCatalog } from '../data/catalog'
import type { ModuleCategory, WidgetKind } from '../types'
import { DashboardWidget } from './DashboardWidget'

const algorithmCategories = ['主动源面波', '被动源面波', '微震监测', '稳定性分析', '预测预警'] as const satisfies readonly ModuleCategory[]
type AlgorithmCategory = (typeof algorithmCategories)[number]

const resultKinds: Record<AlgorithmCategory, WidgetKind[]> = {
  主动源面波: ['dispersion', 'inversionProfile', 'waveform'],
  被动源面波: ['hvsrCurve', 'dispersion', 'inversionProfile'],
  微震监测: ['microseismic3d', 'microseismicTrend', 'waveform'],
  稳定性分析: ['radarHeatmap', 'inversionProfile', 'riskTrend'],
  预测预警: ['trend', 'riskTrend', 'dispositionStats'],
}

export function DeviceStatusModule() {
  return (
    <div className="big-module big-module--device">
      <div className="module-kpis">
        <div><RadioTower /><span><strong>173</strong>设备总数</span><small>170 在线</small></div>
        <div><CheckCircle2 /><span><strong>98.6%</strong>综合在线率</span><small>状态正常</small></div>
        <div><AlertTriangle /><span><strong>3</strong>异常设备</span><small>待复核</small></div>
        <div><Satellite /><span><strong>119</strong>GNSS 测点</span><small>固定解 116</small></div>
      </div>
      <div className="device-module-grid">
        <div className="module-panel module-panel--map"><DashboardWidget kind="siteMap" dark /></div>
        <div className="module-panel module-panel--online"><DashboardWidget kind="deviceOnline" dark /></div>
        <div className="module-panel module-panel--device-count"><DashboardWidget kind="deviceDonut" dark /></div>
        <div className="module-panel module-panel--quality"><DashboardWidget kind="quality" dark /></div>
        <div className="module-panel module-panel--environment"><DashboardWidget kind="environmentTrend" dark /></div>
        <div className="module-panel module-panel--radar"><DashboardWidget kind="radarHeatmap" dark /></div>
      </div>
    </div>
  )
}

const dataStages = [
  { icon: RadioTower, name: '现场设备', meta: '173 台 · 模拟数据' },
  { icon: Router, name: '接入网关', meta: 'TCP · MQTT · HTTP' },
  { icon: RefreshCw, name: '标准处理', meta: '校验 · 去重 · 对齐' },
  { icon: Database, name: '分层存储', meta: '时序 · 文件 · 空间' },
  { icon: Server, name: '算法服务', meta: '任务 · 结果 · 追踪' },
]

const dataStreams = [
  ['GNSS-BH-12', '位移数据', '1 Hz', '正常', '0.8s'],
  ['RADAR-01', '形变栅格', '5 min', '正常', '1.3s'],
  ['MS-ARRAY-07', '三分量波形', '1 kHz', '处理中', '2.1s'],
  ['GNSS-NB-23', '位移数据', '1 Hz', '掉线重连', '42s'],
  ['WEATHER-01', '气象数据', '1 min', '正常', '0.5s'],
  ['INSAR-202609', '遥感成果', '周期', '已入库', '—'],
]

export function DataCenterModule() {
  return (
    <div className="big-module big-module--data">
      <div className="module-kpis">
        <div><Waypoints /><span><strong>2,486</strong>实时数据/秒</span><small>接入稳定</small></div>
        <div><ShieldCheck /><span><strong>99.2%</strong>解析成功率</span><small>异常 0.8%</small></div>
        <div><Gauge /><span><strong>1.8s</strong>平均延迟</span><small>P95 3.4s</small></div>
        <div><Database /><span><strong>12.8TB</strong>数据总量</span><small>今日 +18.6GB</small></div>
      </div>
      <div className="data-pipeline">
        {dataStages.map((stage, index) => {
          const Icon = stage.icon
          return (
            <div className="data-stage-wrap" key={stage.name}>
              <div className="data-stage"><Icon size={18} /><div><strong>{stage.name}</strong><span>{stage.meta}</span></div><i /></div>
              {index < dataStages.length - 1 && <ArrowRight size={16} />}
            </div>
          )
        })}
      </div>
      <div className="data-module-grid">
        <div className="module-panel data-module-grid__wave"><DashboardWidget kind="waveform" dark /></div>
        <div className="module-panel data-module-grid__quality"><DashboardWidget kind="quality" dark /></div>
        <div className="module-panel data-module-grid__environment"><DashboardWidget kind="environmentTrend" dark /></div>
        <div className="data-streams">
          <div className="section-mini-heading"><div><CircleDot size={14} /><strong>数据回传状态</strong></div><span>实时演示</span></div>
          <div className="data-streams__head"><span>数据源</span><span>类型</span><span>频率</span><span>状态</span><span>延迟</span></div>
          {dataStreams.map((row) => (
            <div className="data-streams__row" key={row[0]}>
              {row.map((cell, index) => <span className={index === 3 ? `is-status ${cell.includes('掉线') ? 'is-warning' : ''}` : ''} key={`${row[0]}-${index}`}>{cell}</span>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AlgorithmCenterModule() {
  const algorithms = useMemo(
    () => moduleCatalog.filter((item) => (algorithmCategories as readonly ModuleCategory[]).includes(item.category)),
    [],
  )
  const [category, setCategory] = useState<AlgorithmCategory>('主动源面波')
  const categoryAlgorithms = useMemo(() => algorithms.filter((item) => item.category === category), [algorithms, category])
  const [selectedId, setSelectedId] = useState(categoryAlgorithms[0]?.id ?? '')
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!categoryAlgorithms.some((item) => item.id === selectedId)) setSelectedId(categoryAlgorithms[0]?.id ?? '')
  }, [categoryAlgorithms, selectedId])

  useEffect(() => {
    if (progress >= 100) return
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 8)), 140)
    return () => window.clearInterval(timer)
  }, [progress])

  const selected = algorithms.find((item) => item.id === selectedId) ?? categoryAlgorithms[0]
  const selectedIndex = Math.max(0, categoryAlgorithms.findIndex((item) => item.id === selected?.id))
  const resultKind = resultKinds[category][selectedIndex % resultKinds[category].length]

  return (
    <div className="big-module algorithm-center">
      <div className="algorithm-summary">
        <div><strong>{algorithms.length}</strong><span>算法能力</span></div>
        <div><strong>{algorithmCategories.length}</strong><span>算法族</span></div>
        <div><strong>5</strong><span>统一支撑环节</span></div>
        <div><strong>100%</strong><span>Demo 覆盖</span></div>
        <small>模拟数据 · 不接真实算法</small>
      </div>
      <div className="algorithm-category-tabs">
        {algorithmCategories.map((item) => {
          const count = algorithms.filter((algorithm) => algorithm.category === item).length
          return <button className={category === item ? 'is-active' : ''} key={item} onClick={() => setCategory(item)}><Layers3 size={14} /><span>{item}</span><i>{count}</i></button>
        })}
      </div>
      <div className="algorithm-workspace">
        <div className="algorithm-catalog">
          <div className="section-mini-heading"><div><Activity size={14} /><strong>{category}算法清单</strong></div><span>{categoryAlgorithms.length} 项</span></div>
          <div className="algorithm-card-grid">
            {categoryAlgorithms.map((algorithm, index) => (
              <button className={`algorithm-demo-card ${selected?.id === algorithm.id ? 'is-active' : ''}`} key={algorithm.id} onClick={() => { setSelectedId(algorithm.id); setProgress(100) }}>
                <span className="algorithm-demo-card__index">{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{algorithm.name}</strong><small>{algorithm.description}</small><em>{algorithm.tags.slice(0, 3).join(' · ')}</em></div>
                <i>可演示</i>
              </button>
            ))}
          </div>
        </div>
        <div className="algorithm-result">
          <div className="algorithm-result__header">
            <div><span>当前算法 Demo</span><strong>{selected?.name}</strong></div>
            <button disabled={progress < 100} onClick={() => setProgress(0)}>{progress < 100 ? <RefreshCw className="is-spinning" size={14} /> : <Play size={14} />}{progress < 100 ? `运行中 ${progress}%` : '模拟运行'}</button>
          </div>
          <div className="algorithm-support-strip">
            {['参数配置', '任务调度', '过程监控', '结果可视化', '版本追踪'].map((item, index) => <span key={item}><CheckCircle2 size={12} />{item}<i>{index + 1}</i></span>)}
          </div>
          <div className="algorithm-result__chart"><DashboardWidget kind={resultKind} dark showHeader={false} /></div>
          <div className="algorithm-result__footer">
            <div><span>输入</span><strong>{selected?.tags.slice(0, 2).join(' / ') || '标准监测数据'}</strong></div>
            <div><span>输出</span><strong>{selected?.shortName || '算法成果'}</strong></div>
            <div><span>任务状态</span><strong className={progress < 100 ? 'is-running' : 'is-success'}>{progress < 100 ? '模拟计算中' : '结果已生成'}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}

const closedLoopSteps = ['算法发现', '规则融合', '风险确认', '任务派发', '现场反馈', '复核关闭', '报告归档']

export function RiskClosedLoopModule() {
  const [reportReady, setReportReady] = useState(false)
  return (
    <div className="big-module big-module--risk">
      <div className="risk-module-grid">
        <div className="module-panel risk-module-grid__summary"><DashboardWidget kind="riskSummary" dark /></div>
        <div className="module-panel risk-module-grid__trend"><DashboardWidget kind="riskTrend" dark /></div>
        <div className="module-panel risk-module-grid__log"><DashboardWidget kind="alertLog" dark /></div>
        <div className="module-panel risk-module-grid__stats"><DashboardWidget kind="dispositionStats" dark /></div>
      </div>
      <div className="closed-loop-panel">
        <div className="section-mini-heading"><div><ShieldCheck size={15} /><strong>预警处置闭环</strong></div><span>证据链完整 · traceId: KD-20260919-0172</span></div>
        <div className="closed-loop-flow">
          {closedLoopSteps.map((step, index) => (
            <div className="closed-loop-step-wrap" key={step}>
              <div className={`closed-loop-step ${index < 5 ? 'is-done' : index === 5 ? 'is-active' : ''}`}><i>{index < 5 ? <CheckCircle2 size={14} /> : index + 1}</i><strong>{step}</strong><span>{index < 5 ? '已完成' : index === 5 ? '进行中' : '待执行'}</span></div>
              {index < closedLoopSteps.length - 1 && <ArrowRight size={14} />}
            </div>
          ))}
        </div>
        <div className="report-demo">
          <div><FileCheck2 size={26} /><span><strong>边坡风险闭环分析报告</strong><small>设备状态、数据质量、算法结果、风险证据和处置记录自动汇总</small></span></div>
          <div className="report-demo__metrics"><span>7 类证据</span><span>12 张图表</span><span>28 条处置记录</span></div>
          <button onClick={() => setReportReady(true)}>{reportReady ? <CheckCircle2 size={14} /> : <FileCheck2 size={14} />}{reportReady ? '报告已生成' : '生成演示报告'}</button>
        </div>
      </div>
    </div>
  )
}
