import {createContext,useContext,useEffect,useRef,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {X} from 'lucide-react'
import {lockBodyScroll} from './scrollLock'
export const WorkspaceTitleContext=createContext('')
export function SectionTitle({children}:{children:ReactNode}){const title=useContext(WorkspaceTitleContext);return typeof children==='string'&&children===title?null:<h2>{children}</h2>}
const dialogs:HTMLElement[]=[]
let rootWasInert=false
/** Centered inspection, with nested-dialog-safe focus and scroll restoration. */
export function WorkspaceDrawer({title,onClose,children,size='normal',className=''}:{title:string;onClose:()=>void;children:ReactNode;size?:'normal'|'wide'|'media';className?:string}){
 const panel=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose
 useEffect(()=>{
  const el=panel.current!,previous=document.activeElement as HTMLElement|null,unlock=lockBodyScroll()
  const app=document.getElementById('root'),parent=dialogs.at(-1)
  if(!dialogs.length)rootWasInert=app?.inert||false
  if(app)app.inert=true
  if(parent)parent.inert=true
  dialogs.push(el);el.querySelector<HTMLButtonElement>('button')?.focus()
  const key=(e:KeyboardEvent)=>{
   if(dialogs.at(-1)!==el)return
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();return}
   if(e.key!=='Tab')return
   const items=Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')).filter(n=>n.getClientRects().length)
   const first=items[0],last=items.at(-1)
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
  document.addEventListener('keydown',key,true)
  return()=>{document.removeEventListener('keydown',key,true);dialogs.splice(dialogs.indexOf(el),1);const top=dialogs.at(-1);if(top)top.inert=false;if(app)app.inert=dialogs.length>0||rootWasInert;unlock();if(previous?.isConnected)previous.focus({preventScroll:true})}
 },[])
 return createPortal(<div className={`studio workspace-drawer-shade unified-glass-modal ${className}`} onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}}><section ref={panel} className={`workspace-drawer dialog-${size}`} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button aria-label={`关闭${title}`} onClick={onClose}><X size={19}/></button></header><div className="workspace-drawer-body"><WorkspaceTitleContext.Provider value={title}>{children}</WorkspaceTitleContext.Provider></div></section></div>,document.body)
}
