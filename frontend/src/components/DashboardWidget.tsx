import { CompactWidget } from '../studio/ModuleWorkbench'
export function DashboardWidget({kind,showHeader=true}:{kind:string;dark?:boolean;showHeader?:boolean}) {return <CompactWidget kind={kind} showHeader={showHeader}/>}
