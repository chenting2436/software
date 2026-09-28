import {createContext,useContext,type ReactNode} from 'react'
import type {WorkspaceRoute} from './navigation'

export type WorkspaceAppearance='cinematic'|'scientific'
const AppearanceContext=createContext<WorkspaceAppearance>('cinematic')
export const WorkspaceAppearanceProvider=AppearanceContext.Provider
export const useWorkspaceAppearance=()=>useContext(AppearanceContext)
/** Keep all workspaces on the shared liquid-glass material. Saved data is unaffected. */
export function appearanceForRoute(_route:WorkspaceRoute):WorkspaceAppearance{return 'cinematic'}
export function ToolGroup({label,children}:{label:string;children:ReactNode}){return <div className="science-tool-group"><div>{children}</div><small>{label}</small></div>}
export function WorkbenchStatus({children}:{children:ReactNode}){return <footer className="glass-workspace-status" role="status">{children}</footer>}
