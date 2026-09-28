import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  FileText,
  Filter,
  Gauge,
  Layers3,
  ListChecks,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type { EChartsOption } from 'echarts'
import type { WidgetDefinition } from '../types'
import { Chart } from './Chart'

interface CapabilityWorkbenchProps {
  definition: WidgetDefinition
  dark?: boolean
  expanded?: boolean
  onRequestExpand?: () => void
}

const algorithmTabs = ['流程总览', '参数配置', '执行结果', '任务日志', '版本管理'] as const
const businessTabs = ['业务总览', '实时数据', '配置管理', '操作记录'] as const

const algorithmSteps = ['输入校验', '数据预处理', '核心计算', '质量评价', '成果生成', '结果入库']
const pipelineSteps = ['设备接入', '身份认证', '协议解析', '标准转换', '质量检查', '存储服务', '算法调用']
const riskSteps = ['结果校验', '证据聚合', '规则研判', '事件生成', '通知派发', '现场反馈', '复核关闭']
const releaseSteps = ['配置草稿', '自动校验', '人工审核', '灰度发布', '运行观察', '正式发布', '异常回滚']

function seedOf(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0)
}

function algorithmChartOption(definition: WidgetDefinition, dark: boolean): EChartsOption {
  const seed = seedOf(definition.kind)
  const text = dark ? '#d8e4f0' : '#465568'
  const muted = dark ? '#91aecf' : '#7b8a9b'
  const axis = dark ? 'rgba(145,174,207,.2)' : 'rgba(27,88,161,.12)'
  const mode = seed % 4
  if (mode === 0) {
    const data: number[][] = []
    for (let x = 0; x < 32; x += 1) {
      for (let y = 0; y < 20; y += 1) {
        const ridge = 14 + 4 * Math.sin((x + seed) / 6)
        const value = 92 * Math.exp(-Math.pow((y - ridge) / 2.8, 2)) + 12 * Math.abs(Math.sin(x * 0.37 + y))
        data.push([x, y, Number(value.toFixed(2))])
      }
    }
    return {
      tooltip: { position: 'top' },
      grid: { left: 36, right: 12, top: 10, bottom: 28 },
      xAxis: { type: 'category', name: '频率/距离', data: Array.from({ length: 32 }, (_, i) => i), axisLabel: { color: muted, fontSize: 8, interval: 5 }, axisLine: { lineStyle: { color: axis } } },
      yAxis: { type: 'category', name: '速度/深度', data: Array.from({ length: 20 }, (_, i) => i * 20), axisLabel: { color: muted, fontSize: 8, interval: 3 }, axisLine: { lineStyle: { color: axis } } },
      visualMap: { show: false, min: 0, max: 100, inRange: { color: ['#08172c', '#155b8b', '#35b8aa', '#f0c95b', '#f45b45'] } },
      series: [{ type: 'heatmap', data }],
    }
  }
  if (mode === 1) {
    const points = Array.from({ length: 86 }, (_, index) => [
      Number((index * 1.7 + Math.sin(index * 0.7) * 8).toFixed(2)),
      Number((42 + Math.sin(index * 0.34 + seed) * 24 + (index % 7) * 2).toFixed(2)),
      5 + (index % 12),
    ])
    return {
      tooltip: { trigger: 'item' },
      grid: { left: 38, right: 14, top: 12, bottom: 26 },
      xAxis: { type: 'value', name: 'X / 时间', axisLabel: { color: muted, fontSize: 8 }, splitLine: { lineStyle: { color: axis } } },
      yAxis: { type: 'value', name: 'Y / 指标', axisLabel: { color: muted, fontSize: 8 }, splitLine: { lineStyle: { color: axis } } },
      visualMap: { show: false, min: 5, max: 16, dimension: 2, inRange: { color: ['#42c7f5', '#69c7b6', '#e9c46a', '#f45b69'] } },
      series: [{ type: 'scatter', data: points, symbolSize: (value: number[]) => value[2] }],
    }
  }
  if (mode === 2) {
    const labels = Array.from({ length: 28 }, (_, i) => `${i + 1}`)
    const observed = labels.map((_, i) => Number((18 + i * 1.15 + Math.sin(i / 2 + seed) * 5).toFixed(2)))
    const fitted = labels.map((_, i) => Number((19 + i * 1.08 + Math.sin(i / 3 + seed) * 2).toFixed(2)))
    return {
      color: ['#42c7f5', '#e9c46a'],
      tooltip: { trigger: 'axis' },
      legend: { top: 0, right: 5, textStyle: { color: muted, fontSize: 8 }, data: ['观测结果', '反演/预测'] },
      grid: { left: 38, right: 14, top: 28, bottom: 25 },
      xAxis: { type: 'category', data: labels, axisLabel: { color: muted, fontSize: 8, interval: 4 }, axisLine: { lineStyle: { color: axis } } },
      yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 8 }, splitLine: { lineStyle: { color: axis } } },
      series: [
        { name: '观测结果', type: 'line', smooth: true, data: observed, showSymbol: false, areaStyle: { color: 'rgba(66,199,245,.14)' } },
        { name: '反演/预测', type: 'line', smooth: true, data: fitted, showSymbol: false, lineStyle: { type: 'dashed' } },
      ],
    }
  }
  return {
    color: ['#42c7f5', '#69c7b6', '#e9c46a', '#7f8cff'],
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 4, textStyle: { color: muted, fontSize: 8 } },
    grid: { left: 38, right: 12, top: 28, bottom: 24 },
    xAxis: { type: 'category', data: ['工区1', '工区2', '工区3', '工区4', '工区5', '工区6'], axisLabel: { color: muted, fontSize: 8 }, axisLine: { lineStyle: { color: axis } } },
    yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 8 }, splitLine: { lineStyle: { color: axis } } },
    series: [
      { name: '输入覆盖', type: 'bar', data: [92, 88, 96, 81, 93, 89], barMaxWidth: 16 },
      { name: '结果置信度', type: 'line', data: [86, 91, 89, 84, 94, 92], smooth: true },
    ],
    textStyle: { color: text },
  }
}

function rowsFor(definition: WidgetDefinition) {
  if (definition.category === '设备管理' || definition.category === '综合概览') {
    return [
      ['GNSS-NB-012', 'GNSS', '北帮 12#', '在线', '98.7', '2 秒前'],
      ['RADAR-01', '边坡雷达', '东帮雷达站', '在线', '96.2', '5 秒前'],
      ['MS-ARRAY-07', '微震节点', '南帮阵列', '告警', '89.4', '12 秒前'],
      ['WEATHER-01', '气象站', '矿区中心', '在线', '99.1', '8 秒前'],
      ['GNSS-NB-023', 'GNSS', '南帮 23#', '重连中', '72.6', '42 秒前'],
    ]
  }
  if (definition.category === '数据管理') {
    return [
      ['MSG-260920-8812', 'GNSS-NB-012', 'MQTT', '解析成功', '0.82s', '标准层'],
      ['MSG-260920-8811', 'MS-ARRAY-07', 'TCP', '处理中', '2.14s', '原始层'],
      ['MSG-260920-8809', 'RADAR-01', '文件', '校验成功', '3.42s', '对象存储'],
      ['MSG-260920-8807', 'GNSS-NB-023', 'MQTT', '补传完成', '42.1s', '标准层'],
      ['MSG-260920-8803', 'WEATHER-01', 'HTTP', '解析失败', '1.06s', '隔离区'],
    ]
  }
  if (definition.category === '预警闭环') {
    return [
      ['RISK-20260920-08', '北帮边坡', '橙色', '处置中', '0.91', '算法工程师'],
      ['RISK-20260920-07', '南帮边坡', '黄色', '待复核', '0.84', '项目管理员'],
      ['RISK-20260920-06', '东帮雷达区', '蓝色', '已确认', '0.76', '设备管理员'],
      ['RISK-20260919-22', '北帮边坡', '黄色', '已关闭', '0.88', '风险处置员'],
    ]
  }
  if (definition.category === '账号权限') {
    return [
      ['admin_kd', '项目管理员', '全部项目', '正常', '今天 09:18', '配置/发布/审批'],
      ['device_chen', '设备管理员', '矿大演示项目', '正常', '今天 08:52', '设备/远控'],
      ['algo_li', '算法工程师', '矿大演示项目', '正常', '昨天 18:20', '算法/结果'],
      ['risk_wang', '风险处置员', '北帮、南帮', '正常', '昨天 16:42', '处置/复核'],
      ['guest_demo', '客户访客', '只读范围', '正常', '3 天前', '查看'],
    ]
  }
  if (definition.category === '配置运维') {
    return [
      ['device-service', '设备服务', 'v2.4.1', '健康', '28%', '3 天'],
      ['ingestion-service', '接入服务', 'v2.6.0', '健康', '42%', '12 天'],
      ['algorithm-service', '算法服务', 'v1.9.3', '运行中', '67%', '8 天'],
      ['risk-service', '风险服务', 'v2.1.8', '健康', '31%', '18 天'],
      ['adapter-gnss', 'GNSS 适配器', 'v1.3.2', '灰度中', '15%', '2 小时'],
    ]
  }
  return [
    ['CAP-001', '设备与状态能力', '18 项', '已选择', '高', '阶段一'],
    ['CAP-002', '数据接入与处理', '25 项', '已选择', '高', '阶段一'],
    ['CAP-003', '算法工作台', '31 项', '已选择', '极高', '阶段二'],
    ['CAP-004', '预警闭环与报告', '14 项', '已选择', '高', '阶段二'],
  ]
}

function stepsFor(definition: WidgetDefinition) {
  if (definition.demoType === 'risk-flow') return riskSteps
  if (definition.kind.includes('release') || definition.kind.includes('configuration')) return releaseSteps
  return pipelineSteps
}

function AlgorithmWorkbench({ definition, dark, expanded, onRequestExpand }: CapabilityWorkbenchProps) {
  const [tab, setTab] = useState<(typeof algorithmTabs)[number]>('流程总览')
  const [progress, setProgress] = useState(100)
  const [selectedStep, setSelectedStep] = useState(2)
  const [parameterSet, setParameterSet] = useState('生产参数 V3')
  const option = useMemo(() => algorithmChartOption(definition, Boolean(dark)), [definition, dark])

  useEffect(() => {
    if (progress >= 100) return
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 5)), 120)
    return () => window.clearInterval(timer)
  }, [progress])

  const run = () => {
    setProgress(8)
    setTab('流程总览')
  }

  return (
    <div className={`capability-workbench algorithm-workbench ${expanded ? 'is-expanded' : ''}`}>
      <div className="capability-toolbar">
        <div><Layers3 size={14} /><span><strong>{definition.name}</strong><small>{definition.workload} · 模拟算法服务</small></span></div>
        <div className="capability-toolbar__actions">
          <button onClick={() => setParameterSet((value) => value === '生产参数 V3' ? '快速试算 V1' : '生产参数 V3')}><SlidersHorizontal size={12} />{parameterSet}</button>
          <button className="is-primary" onClick={run} disabled={progress < 100}><Play size={12} />{progress < 100 ? `运行 ${progress}%` : '模拟运行'}</button>
          {!expanded && <button onClick={onRequestExpand}><Zap size={12} />深度演示</button>}
        </div>
      </div>
      <div className="algorithm-kpis">
        <button onClick={() => setTab('参数配置')}><span>输入数据</span><strong>6.8 GB</strong><small>3 类数据源</small></button>
        <button onClick={() => setTab('执行结果')}><span>结果置信度</span><strong>92.6%</strong><small>覆盖率 96.4%</small></button>
        <button onClick={() => setTab('任务日志')}><span>累计任务</span><strong>1,286</strong><small>成功率 98.7%</small></button>
        <button onClick={() => setTab('版本管理')}><span>算法版本</span><strong>v2.4.1</strong><small>参数版本 V3</small></button>
      </div>
      <div className="capability-tabs">
        {algorithmTabs.map((item) => <button className={tab === item ? 'is-active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      {tab === '流程总览' && (
        <div className="algorithm-main-grid">
          <div className="algorithm-process">
            {algorithmSteps.map((step, index) => (
              <button className={`${index <= selectedStep ? 'is-done' : ''} ${index === selectedStep ? 'is-active' : ''}`} key={step} onClick={() => setSelectedStep(index)}>
                <i>{index + 1}</i><span><strong>{step}</strong><small>{index <= selectedStep ? '已完成检查' : '等待上游结果'}</small></span>{index < algorithmSteps.length - 1 && <ChevronRight size={12} />}
              </button>
            ))}
          </div>
          <div className="algorithm-chart"><Chart option={option} /></div>
          <div className="algorithm-inspector">
            <strong>{algorithmSteps[selectedStep]}</strong>
            <span>{definition.description}</span>
            <div><i />输入覆盖率 96.4%</div><div><i />质量校验 12/12</div><div><i />资源占用 GPU 62%</div>
          </div>
        </div>
      )}
      {tab === '参数配置' && (
        <div className="parameter-workspace">
          {['数据时间窗', '采样频率', '滤波范围', '迭代次数', '收敛阈值', '输出精度', '并行任务数', '异常处理'].map((item, index) => (
            <label key={item}><span>{item}</span><input defaultValue={['24 h', '1000 Hz', '2–80 Hz', '120', '0.001', '高精度', '8', '自动降级'][index]} /><small>已通过范围与依赖校验</small></label>
          ))}
          <div className="parameter-validation"><CheckCircle2 size={16} /><div><strong>参数集校验通过</strong><span>输入字段、时间范围、资源和输出结构均满足运行条件。</span></div></div>
        </div>
      )}
      {tab === '执行结果' && (
        <div className="result-workspace">
          <div className="result-workspace__chart"><Chart option={option} /></div>
          <div className="result-table">
            <div><span>成果编号</span><span>成果类型</span><span>质量</span><span>置信度</span><span>状态</span></div>
            {Array.from({ length: 5 }, (_, index) => <button key={index}><span>RESULT-{1286 - index}</span><span>{definition.name}成果</span><span>{94 - index * 1.2}%</span><span>{92 - index}%</span><span>已入库</span></button>)}
          </div>
        </div>
      )}
      {tab === '任务日志' && (
        <div className="log-workspace">
          {['任务已创建并分配计算资源', '读取标准数据与文件引用', '完成输入覆盖率和质量检查', '预处理与坐标时间对齐完成', '核心算法开始迭代计算', '生成中间成果并执行质量评价', '成果文件写入对象存储', '标准结果入库并发布事件'].map((line, index) => (
            <button key={line} onClick={() => setSelectedStep(Math.min(index, 5))}><TerminalSquare size={13} /><span>11:{String(42 + index).padStart(2, '0')}:{String(index * 7).padStart(2, '0')}</span><strong>{line}</strong><i>{index < 7 ? 'INFO' : 'SUCCESS'}</i></button>
          ))}
        </div>
      )}
      {tab === '版本管理' && (
        <div className="version-workspace">
          {['v2.4.1', 'v2.3.6', 'v2.3.1', 'v2.2.8'].map((version, index) => (
            <button key={version}><span><strong>{version}</strong><small>{index === 0 ? '当前生产版本' : '历史可追溯版本'}</small></span><span>参数 V{3 - Math.min(index, 2)}</span><span>镜像 sha256:{(seedOf(version + definition.kind) * 7919).toString(16)}</span><i>{index === 0 ? '运行中' : '可回滚'}</i></button>
          ))}
        </div>
      )}
      <div className="algorithm-runbar"><span>任务 TASK-{seedOf(definition.kind)} · {progress < 100 ? '运行中' : '结果已生成'}</span><div><i style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
    </div>
  )
}

function BusinessWorkbench({ definition, dark, expanded, onRequestExpand }: CapabilityWorkbenchProps) {
  const [tab, setTab] = useState<(typeof businessTabs)[number]>('业务总览')
  const [selectedRow, setSelectedRow] = useState(0)
  const [notice, setNotice] = useState('数据已刷新')
  const rows = useMemo(() => rowsFor(definition), [definition])
  const steps = stepsFor(definition)
  const features = definition.features ?? ['详情查看', '状态联动', '配置管理', '操作记录']
  const categoryIcon = definition.category === '账号权限' ? Users : definition.category === '预警闭环' ? ShieldCheck : definition.category === '方案报告' ? FileText : definition.category === '配置运维' ? Settings2 : definition.category === '数据管理' ? Database : Activity
  const Icon = categoryIcon

  const trigger = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice('数据已刷新'), 1400)
  }

  return (
    <div className={`capability-workbench business-workbench ${expanded ? 'is-expanded' : ''} ${dark ? 'is-dark' : ''}`}>
      <div className="capability-toolbar">
        <div><Icon size={14} /><span><strong>{definition.name}</strong><small>{definition.workload} · 离线模拟数据</small></span></div>
        <div className="capability-toolbar__actions">
          <button onClick={() => trigger('筛选条件已应用')}><Filter size={12} />高级筛选</button>
          <button onClick={() => trigger('数据已重新计算')}><RefreshCw size={12} />刷新</button>
          {!expanded && <button className="is-primary" onClick={onRequestExpand}><Zap size={12} />进入完整页面</button>}
        </div>
      </div>
      <div className="business-kpis">
        <button onClick={() => setTab('实时数据')}><span>当前对象</span><strong>{128 + seedOf(definition.kind) % 86}</strong><small>较昨日 +6</small></button>
        <button onClick={() => setTab('实时数据')}><span>正常运行</span><strong>96.8%</strong><small>状态稳定</small></button>
        <button onClick={() => setSelectedRow(Math.min(2, rows.length - 1))}><span>待处理</span><strong>{3 + seedOf(definition.kind) % 12}</strong><small>其中 2 项超时</small></button>
        <button onClick={() => setTab('操作记录')}><span>今日任务</span><strong>{42 + seedOf(definition.kind) % 50}</strong><small>成功率 98.2%</small></button>
      </div>
      <div className="capability-tabs">
        {businessTabs.map((item) => <button className={tab === item ? 'is-active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      {(definition.demoType === 'data-flow' || definition.demoType === 'risk-flow') && tab === '业务总览' && (
        <div className="business-flow">
          {steps.map((step, index) => <div className="business-flow__step" key={step}><button onClick={() => trigger(`${step}详情已展开`)}><i>{index + 1}</i><span><strong>{step}</strong><small>{index === 2 ? '处理中 · 1.8s' : '状态正常'}</small></span></button>{index < steps.length - 1 && <ArrowRight size={13} />}</div>)}
        </div>
      )}
      {tab === '配置管理' ? (
        <div className="feature-config-grid">
          {features.concat(['版本追踪', '权限校验', '依赖检查', '发布预览']).map((feature, index) => (
            <button key={`${feature}-${index}`} onClick={() => trigger(`${feature}配置已打开`)}><Settings2 size={15} /><span><strong>{feature}</strong><small>{index % 3 === 0 ? '已有 3 个配置版本' : '点击进入配置与校验'}</small></span><ChevronRight size={14} /></button>
          ))}
        </div>
      ) : tab === '操作记录' ? (
        <div className="operation-timeline">
          {['更新状态并重新计算指标', '执行批量校验任务', '查看对象详情和证据', '导出演示结果', '修改配置并保存草稿', '执行发布前检查'].map((item, index) => <button key={item} onClick={() => trigger(`记录 #${6812 - index} 详情已展开`)}><i /><span><strong>{item}</strong><small>演示管理员 · {10 + index}:2{index}</small></span><em>{index < 2 ? '刚刚' : `${index} 小时前`}</em></button>)}
        </div>
      ) : (
        <div className="business-data-area">
          <div className="business-table">
            <div className="business-table__toolbar"><label><Search size={13} /><input placeholder="搜索编号、名称或状态" /></label><span>{rows.length} 条演示记录</span><button onClick={() => trigger('新建演示流程已打开')}>+ 新建</button></div>
            <div className="business-table__head"><span>编号/对象</span><span>类型/角色</span><span>位置/范围</span><span>状态</span><span>质量/进度</span><span>更新时间</span></div>
            {rows.map((row, index) => <button className={selectedRow === index ? 'is-active' : ''} key={row[0]} onClick={() => setSelectedRow(index)}>{row.map((cell) => <span key={cell}>{cell}</span>)}</button>)}
          </div>
          <div className="record-inspector">
            <div><span>当前记录</span><strong>{rows[selectedRow]?.[0]}</strong><small>{definition.description}</small></div>
            <div className="record-inspector__metrics"><span><i />链路正常</span><span><i />质量通过</span><span><i />配置已发布</span></div>
            <div className="record-inspector__actions">{features.slice(0, 4).map((feature) => <button key={feature} onClick={() => trigger(`${feature}功能已打开`)}>{feature}<ChevronRight size={12} /></button>)}</div>
          </div>
        </div>
      )}
      <div className="capability-notice"><CircleDot size={10} />{notice}<span>所有按钮均为演示交互，不连接真实系统</span></div>
    </div>
  )
}

export function CapabilityWorkbench(props: CapabilityWorkbenchProps) {
  if (props.definition.demoType === 'algorithm') return <AlgorithmWorkbench {...props} />
  return <BusinessWorkbench {...props} />
}

interface CapabilityDetailModalProps {
  definition: WidgetDefinition
  dark?: boolean
  onClose: () => void
}

export function CapabilityDetailModal({ definition, dark = false, onClose }: CapabilityDetailModalProps) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return createPortal(
    <div className={`capability-modal ${dark ? 'is-dark' : ''}`} role="dialog" aria-modal="true" aria-label={`${definition.name}深度演示`}>
      <div className="capability-modal__backdrop" onClick={onClose} />
      <section className="capability-modal__panel">
        <header>
          <div><span>{definition.category} · {definition.workload}</span><h2>{definition.name}</h2><p>{definition.description}</p></div>
          <div className="capability-modal__badges"><span>模拟数据</span><span>{definition.features?.length ?? 4} 个交互环节</span><span>可配置</span><button onClick={onClose}><X size={18} /></button></div>
        </header>
        <div className="capability-modal__summary">
          <div><Gauge size={18} /><span><strong>98.6%</strong>流程成功率</span></div>
          <div><Clock3 size={18} /><span><strong>1.8s</strong>平均处理时间</span></div>
          <div><ListChecks size={18} /><span><strong>{definition.features?.length ?? 4}</strong>主要功能</span></div>
          <div><ShieldCheck size={18} /><span><strong>100%</strong>Demo 覆盖</span></div>
        </div>
        <div className="capability-modal__content"><CapabilityWorkbench definition={definition} dark={dark} expanded /></div>
      </section>
    </div>,
    document.body,
  )
}
