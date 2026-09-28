import {useEffect,useRef,type Dispatch,type SetStateAction,type RefObject} from 'react'
import {SENSOR_RADIANS_PER_SECOND,frameSeconds,getRotationMode} from './sceneMotion'
/** Pointer dragging temporarily owns the view; release resumes continuous orbit. */
export function useAutoOrbit(setYaw:Dispatch<SetStateAction<number>>,drag:RefObject<unknown>){
 const host=useRef<HTMLDivElement>(null)
 useEffect(()=>{let frame=0,last=0,visible=true;const el=host.current
  const observer=new IntersectionObserver(([entry])=>visible=entry.isIntersecting);if(el)observer.observe(el)
  const tick=(now:number)=>{frame=requestAnimationFrame(tick);if(now-last<40)return;const dt=frameSeconds(now,last);last=now;if(visible&&!document.hidden&&!drag.current&&getRotationMode()>0)setYaw(y=>y+SENSOR_RADIANS_PER_SECOND*getRotationMode()/2*dt)};frame=requestAnimationFrame(tick)
  return()=>{cancelAnimationFrame(frame);observer.disconnect()}
 },[setYaw,drag]);return host
}
