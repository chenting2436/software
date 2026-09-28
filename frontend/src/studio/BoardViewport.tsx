import {useEffect,useRef,useState,type ReactNode} from 'react'
/** One immutable design surface, scaled to fit either editor or presentation. */
export function BoardViewport({ratio,children}:{ratio:'16:9'|'21:9';children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),[scale,setScale]=useState(0),width=1920,height=ratio==='21:9'?1920*9/21:1080
 useEffect(()=>{const el=ref.current!;const observer=new ResizeObserver(()=>setScale(Math.min(el.clientWidth/width,el.clientHeight/height)));observer.observe(el);return()=>observer.disconnect()},[width,height])
 return <div className="board-viewport" ref={ref} style={{aspectRatio:ratio.replace(':','/')}}><div className="board-design-surface" style={{width,height,transform:`translate(-50%,-50%) scale(${scale})`,visibility:scale?'visible':'hidden'}}>{children}</div></div>
}
