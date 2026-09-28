export type PageKey =
  | 'overview'
  | 'solution'
  | 'designer'
  | 'workflow'
  | 'preview'

export type ModuleCategory =
  | '数据与设备'
  | '通用处理'
  | '主动源面波'
  | '被动源面波'
  | '微震监测'
  | '稳定性分析'
  | '预测预警'
  | '展示交付'

export interface SolutionModule {
  id: string
  name: string
  shortName: string
  category: ModuleCategory
  description: string
  tags: string[]
  dependencyIds?: string[]
}

export interface SolutionTemplate {
  id: string
  name: string
  description: string
  moduleIds: string[]
  accent: string
}

export type WidgetKind = string

export type WidgetCategory =
  | '综合概览'
  | '设备管理'
  | '数据管理'
  | '算法中心'
  | '预警闭环'
  | '账号权限'
  | '配置运维'
  | '方案报告'

export type WidgetDemoType =
  | 'chart'
  | 'device-table'
  | 'data-flow'
  | 'algorithm'
  | 'risk-flow'
  | 'account-table'
  | 'operations'
  | 'report'

export interface WidgetDefinition {
  kind: WidgetKind
  name: string
  description: string
  defaultW: number
  defaultH: number
  category: WidgetCategory
  demoType?: WidgetDemoType
  moduleId?: string
  features?: string[]
  workload?: string
}

export interface DashboardWidget {
  uid: string
  kind: WidgetKind
  x: number
  y: number
  w: number
  h: number
}

export interface DemoProfile {
  customerName: string
  projectName: string
  deploymentMode: 'offline'
  targetOS: string
  cpu: string
  memory: string
  gpu: string
  screen: string
}
