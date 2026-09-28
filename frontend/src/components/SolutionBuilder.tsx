import { useMemo, useState } from 'react'
import {
  Boxes,
  Check,
  ChevronRight,
  Download,
  FileArchive,
  FileJson,
  LayoutDashboard,
  PackageCheck,
  Search,
  Sparkles,
} from 'lucide-react'
import { categoryOrder, moduleCatalog, solutionTemplates } from '../data/catalog'
import type { DemoProfile, ModuleCategory } from '../types'

interface SolutionBuilderProps {
  profile: DemoProfile
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  onProfileChange: (profile: DemoProfile) => void
  onOpenDesigner: () => void
}

type CategoryFilter = '全部模块' | ModuleCategory

function expandDependencies(inputIds: string[]) {
  const ids = new Set(inputIds)
  let changed = true
  while (changed) {
    changed = false
    moduleCatalog.forEach((module) => {
      if (!ids.has(module.id)) return
      module.dependencyIds?.forEach((dependency) => {
        if (!ids.has(dependency)) {
          ids.add(dependency)
          changed = true
        }
      })
    })
  }
  return Array.from(ids)
}

export function SolutionBuilder({
  profile,
  selectedIds,
  onSelectedIdsChange,
  onProfileChange,
  onOpenDesigner,
}: SolutionBuilderProps) {
  const [category, setCategory] = useState<CategoryFilter>('全部模块')
  const [query, setQuery] = useState('')
  const [generatedAt, setGeneratedAt] = useState('')
  const [notice, setNotice] = useState('')

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const filteredModules = useMemo(
    () =>
      moduleCatalog.filter((module) => {
        const categoryMatch = category === '全部模块' || module.category === category
        const queryMatch = !query || `${module.name}${module.description}${module.tags.join('')}`.toLowerCase().includes(query.toLowerCase())
        return categoryMatch && queryMatch
      }),
    [category, query],
  )

  const categoryCounts = useMemo(
    () =>
      categoryOrder.map((name) => ({
        name,
        count: moduleCatalog.filter((module) => module.category === name && selectedSet.has(module.id)).length,
        total: moduleCatalog.filter((module) => module.category === name).length,
      })),
    [selectedSet],
  )

  const toggleModule = (id: string) => {
    if (selectedSet.has(id)) {
      onSelectedIdsChange(selectedIds.filter((item) => item !== id))
    } else {
      onSelectedIdsChange(expandDependencies([...selectedIds, id]))
    }
    setGeneratedAt('')
  }

  const applyTemplate = (templateId: string) => {
    const template = solutionTemplates.find((item) => item.id === templateId)
    if (!template) return
    onSelectedIdsChange(expandDependencies(template.moduleIds))
    setGeneratedAt('')
    setNotice(`已应用“${template.name}”`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const generateSolution = () => {
    const expanded = expandDependencies(selectedIds)
    onSelectedIdsChange(expanded)
    setGeneratedAt(new Date().toLocaleString('zh-CN', { hour12: false }))
    setNotice(`方案已生成，共 ${expanded.length} 个模块，依赖关系校验通过`)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const exportSolution = async () => {
    const selectedModules = moduleCatalog.filter((module) => selectedSet.has(module.id))
    const payload = JSON.stringify(
      {
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),
        customer: profile.customerName,
        project: profile.projectName,
        deploymentMode: profile.deploymentMode,
        modules: selectedModules,
        outputs: ['Windows 安装包', 'HTML 综合大屏', '客户方案配置 JSON'],
      },
      null,
      2,
    )
    const fileName = `${profile.customerName}-${profile.projectName}-方案配置.json`
    const bridge = (window as unknown as {
      go?: { main?: { App?: { SaveSolution?: (content: string, filename: string) => Promise<string> } } }
    }).go
    if (bridge?.main?.App?.SaveSolution) {
      const path = await bridge.main.App.SaveSolution(payload, fileName)
      if (path) setNotice(`方案已保存：${path}`)
      return
    }
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('方案配置已导出')
  }

  return (
    <section className="page page--solution">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Solution Configurator</span>
          <h1>客户方案配置</h1>
          <p>勾选需要的能力，系统自动补齐依赖并生成安装包与大屏配置。</p>
        </div>
        <div className="heading-actions">
          <button className="button button--ghost" onClick={exportSolution}><Download size={16} />导出配置</button>
          <button className="button button--primary" onClick={generateSolution}><Sparkles size={16} />生成客户方案</button>
        </div>
      </div>

      {notice && <div className="toast-message"><Check size={15} />{notice}</div>}

      <div className="solution-layout">
        <div className="solution-main">
          <div className="config-card customer-card">
            <div className="config-card__title"><div><span>01</span><strong>客户与项目</strong></div><small>基础信息</small></div>
            <div className="form-grid">
              <label>客户名称<input value={profile.customerName} onChange={(event) => onProfileChange({ ...profile, customerName: event.target.value })} /></label>
              <label>项目名称<input value={profile.projectName} onChange={(event) => onProfileChange({ ...profile, projectName: event.target.value })} /></label>
              <label>交付模式<select value={profile.deploymentMode} disabled><option value="offline">离线演示包</option></select></label>
              <label>目标平台<select defaultValue="windows"><option value="windows">Windows 10/11 x64</option></select></label>
            </div>
          </div>

          <div className="config-card">
            <div className="config-card__title"><div><span>02</span><strong>快速模板</strong></div><small>一键选择</small></div>
            <div className="quick-templates">
              {solutionTemplates.map((template) => (
                <button key={template.id} onClick={() => applyTemplate(template.id)}>
                  <i style={{ background: template.accent }} /><div><strong>{template.name}</strong><span>{template.moduleIds.length} 个模块</span></div><ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="config-card module-card">
            <div className="config-card__title"><div><span>03</span><strong>功能模块</strong></div><small>已选 {selectedIds.length} / {moduleCatalog.length}</small></div>
            <div className="module-toolbar">
              <div className="search-box"><Search size={15} /><input placeholder="搜索算法或功能" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
              <button className="text-button" onClick={() => onSelectedIdsChange(moduleCatalog.map((module) => module.id))}>全选</button>
              <button className="text-button" onClick={() => onSelectedIdsChange([])}>清空</button>
            </div>
            <div className="module-browser">
              <div className="module-categories">
                <button className={category === '全部模块' ? 'is-active' : ''} onClick={() => setCategory('全部模块')}><span>全部模块</span><small>{selectedIds.length}/{moduleCatalog.length}</small></button>
                {categoryCounts.map((item) => (
                  <button className={category === item.name ? 'is-active' : ''} key={item.name} onClick={() => setCategory(item.name)}><span>{item.name}</span><small>{item.count}/{item.total}</small></button>
                ))}
              </div>
              <div className="module-grid">
                {filteredModules.map((module) => {
                  const selected = selectedSet.has(module.id)
                  return (
                    <button className={`module-option ${selected ? 'is-selected' : ''}`} key={module.id} onClick={() => toggleModule(module.id)}>
                      <span className="module-option__check">{selected && <Check size={14} />}</span>
                      <div><strong>{module.name}</strong><p>{module.description}</p><span>{module.tags.map((tag) => <i key={tag}>{tag}</i>)}</span></div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="solution-summary">
          <div className="summary-card summary-card--accent">
            <div className="summary-icon"><PackageCheck size={25} /></div>
            <span>当前客户方案</span>
            <h2>{profile.customerName}</h2>
            <p>{profile.projectName}</p>
            <div className="summary-number"><strong>{selectedIds.length}</strong><span>已选功能模块</span></div>
            {generatedAt ? <div className="generated-state"><Check size={14} />已生成 · {generatedAt}</div> : <div className="generated-state generated-state--pending">等待生成</div>}
          </div>

          <div className="summary-card">
            <h3>交付内容</h3>
            <div className="deliverable-list">
              <div><FileArchive size={18} /><span><strong>Windows 安装包</strong><small>EXE 桌面演示端</small></span><Check size={15} /></div>
              <div><LayoutDashboard size={18} /><span><strong>HTML 综合大屏</strong><small>离线静态资源</small></span><Check size={15} /></div>
              <div><FileJson size={18} /><span><strong>方案配置</strong><small>模块与布局 JSON</small></span><Check size={15} /></div>
            </div>
          </div>

          <div className="summary-card">
            <h3>模块分布</h3>
            <div className="category-progress">
              {categoryCounts.filter((item) => item.count > 0).map((item) => (
                <div key={item.name}><span><strong>{item.name}</strong><small>{item.count}/{item.total}</small></span><div><i style={{ width: `${Math.round((item.count / item.total) * 100)}%` }} /></div></div>
              ))}
            </div>
          </div>

          <button className="summary-next" onClick={onOpenDesigner}><Boxes size={18} /><span><strong>下一步：排版大屏</strong><small>将已选能力配置为大屏组件</small></span><ChevronRight size={17} /></button>
        </aside>
      </div>
    </section>
  )
}
