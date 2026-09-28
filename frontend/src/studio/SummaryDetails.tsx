import {ArrowUpRight} from 'lucide-react'
import {WorkspaceDrawer} from './WorkspaceDrawer'
import {goWorkspace,type WorkspaceRoute} from './navigation'

export interface SummaryRow {id:string;name:string;detail:string;value?:string;route?:WorkspaceRoute}
export interface SummarySelection {title:string;rows:SummaryRow[];empty?:string}
export function SummaryDetails({selection,onClose}:{selection:SummarySelection|null;onClose:()=>void}){
 if(!selection)return null
 return <WorkspaceDrawer title={selection.title} onClose={onClose}><div className="summary-detail-list">
  {selection.rows.map(row=>row.route?<button key={row.id} onClick={()=>{onClose();goWorkspace(row.route!)}} aria-label={`查看 ${row.name}`}><span><strong>{row.name}</strong><small>{row.detail}</small></span><b>{row.value}</b><ArrowUpRight size={16}/></button>:<div key={row.id} className="summary-detail-record"><strong>{row.name}</strong><p>{row.detail}</p><span>{row.value}</span></div>)}
  {!selection.rows.length&&<p className="summary-detail-empty">{selection.empty||'当前范围内暂无记录'}</p>}
 </div></WorkspaceDrawer>
}
