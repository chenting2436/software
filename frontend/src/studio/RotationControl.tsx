import {useSyncExternalStore} from 'react'
import {Pause,Rotate3D} from 'lucide-react'
import {getRotationMode,cycleRotation,subscribeRotation} from './sceneMotion'
/** All camera controls share one clear rotation preference; telemetry is unaffected. */
export function RotationControl(){
 const speed=useSyncExternalStore(subscribeRotation,getRotationMode,()=>2)
 return <button className="motion-badge rotation-control" aria-label={`旋转速度：${speed===0?'暂停':speed+'倍'}，点击切换`} title="2× → 暂停 → 1× → 2×" onClick={cycleRotation}>{speed===0?<Pause size={14}/>:<Rotate3D size={14}/>}<span>{speed===0?'暂停':speed+'×'}</span></button>
}
