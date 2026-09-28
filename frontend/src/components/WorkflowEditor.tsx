import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { CheckCircle2, Play, RotateCcw } from 'lucide-react'
import {useWorkspaceAppearance} from '../studio/ScientificUI'
import { moduleCatalog } from '../data/catalog'

interface WorkflowEditorProps {
  selectedIds: string[]
}

function buildFlow(selectedIds: string[],scientific=false) {
  const selected = moduleCatalog.filter((module) => selectedIds.includes(module.id))
  const count = (category: string) => selected.filter((module) => module.category === category).length
  const baseNode = (id: string, label: string, subtitle: string, x: number, y: number, color: string): Node => ({
    id,
    position: { x, y },
    data: { label: `${label}\n${subtitle}` },
    style: {
      width: 190,
      minHeight: 68,
      borderRadius: scientific?3:14,
      border: `1px solid ${color}55`,
      borderLeft: `4px solid ${color}`,
      background: scientific?'linear-gradient(#ffffff,#eaf2f8)':'linear-gradient(140deg,rgba(58,90,115,.8),rgba(20,43,62,.75))',
      backdropFilter: scientific?'none':'blur(16px)',
      color: scientific?'#355c7b':'#D2E4F0',
      fontSize: 12,
      whiteSpace: 'pre-line',
      lineHeight: 1.55,
      boxShadow: scientific?'0 2px 4px #33557512':'inset 0 1px 0 #ffffff1a,0 8px 24px #0003',
    },
  })

  const nodes: Node[] = [
    baseNode('input', '模拟数据输入', `${count('数据与设备')} 个数据与设备模块`, 20, 160, '#1B58A1'),
    baseNode('preprocess', '通用预处理', `${count('通用处理')} 个处理模块`, 270, 160, '#6E8FD3'),
    baseNode('active', '主动源面波', `${count('主动源面波')} 个算法模块`, 520, 10, '#2D7DD2'),
    baseNode('passive', '被动源面波', `${count('被动源面波')} 个算法模块`, 520, 105, '#5B8DEF'),
    baseNode('micro', '微震实时监测', `${count('微震监测')} 个算法模块`, 520, 200, '#4FA3A5'),
    baseNode('stability', '边坡稳定性分析', `${count('稳定性分析')} 个算法模块`, 520, 295, '#D7A75B'),
    baseNode('risk', '预测与融合预警', `${count('预测预警')} 个风险模块`, 810, 160, '#D49A4B'),
    baseNode('output', '成果与综合大屏', `${count('展示交付')} 个交付模块`, 1060, 160, '#1B58A1'),
  ]
  const edge = (id: string, source: string, target: string): Edge => ({
    id,
    source,
    target,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#91AECF' },
    style: { stroke: '#91AECF', strokeWidth: 1.8 },
  })
  const edges = [
    edge('e1', 'input', 'preprocess'),
    edge('e2', 'preprocess', 'active'),
    edge('e3', 'preprocess', 'passive'),
    edge('e4', 'preprocess', 'micro'),
    edge('e4b', 'preprocess', 'stability'),
    edge('e5', 'active', 'risk'),
    edge('e6', 'passive', 'risk'),
    edge('e7', 'micro', 'risk'),
    edge('e7b', 'stability', 'risk'),
    edge('e8', 'risk', 'output'),
  ]
  return { nodes, edges }
}

export function WorkflowEditor({ selectedIds }: WorkflowEditorProps) {
  const scientific=useWorkspaceAppearance()==='scientific',timerRef=useRef<number|undefined>(undefined)
  const initial = useMemo(() => buildFlow(selectedIds,scientific), [selectedIds,scientific])
  useEffect(()=>()=>window.clearInterval(timerRef.current),[])
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setNodes(initial.nodes)
    setEdges(initial.edges)
  }, [initial, setEdges, setNodes])

  const onConnect = (connection: Connection) => setEdges((current) => addEdge(connection, current))

  const runWorkflow = () => {
    if (runState === 'running') return
    setRunState('running')
    setProgress(0)
    const timer = timerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer)
          setRunState('done')
          return 100
        }
        return Math.min(100, current + 8)
      })
    }, 160)
  }

  const reset = () => {
    window.clearInterval(timerRef.current)
    const next = buildFlow(selectedIds,scientific)
    setNodes(next.nodes)
    setEdges(next.edges)
    setRunState('idle')
    setProgress(0)
  }

  return (
    <section className="page page--workflow">
      <div className="page-heading">
        <div>
          
          <h1>流程编排</h1>
          
        </div>
        <div className="heading-actions">
          <button className="button button--ghost" onClick={reset}><RotateCcw size={16} />重置</button>
          <button className="button button--primary" onClick={runWorkflow} disabled={runState === 'running'}>{runState === 'done' ? <CheckCircle2 size={16} /> : <Play size={16} />}{runState === 'running' ? `模拟运行 ${progress}%` : runState === 'done' ? '运行完成' : '模拟运行'}</button>
        </div>
      </div>

      <div className="workflow-shell">
        <div className="workflow-toolbar">
          <span><i className={`status-dot ${runState === 'running' ? 'status-dot--pulse' : ''}`} />{runState === 'idle' ? '等待运行' : runState === 'running' ? '正在执行模拟算法' : '全部节点执行完成'}</span>
          <div className="workflow-progress"><i style={{ width: `${progress}%` }} /></div>
          <span>{selectedIds.length} 个方案模块</span>
        </div>
        <div className="workflow-canvas">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView minZoom={0.55} maxZoom={1.5}>
            <Background color="#BCD7F5" gap={22} size={1} />
            <MiniMap nodeColor="#91AECF" maskColor={scientific?'rgba(218,230,239,.55)':'rgba(9,24,36,.72)'} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </section>
  )
}
