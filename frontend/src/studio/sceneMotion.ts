/** Camera motion only; never changes telemetry or playback time.
 * Legacy rendering was capped at 30 fps but used OrbitControls' implicit 60 fps
 * step. Convert that observed baseline before applying 2x with delta seconds.
 */
export const MOTION_MULTIPLIER=2
export const ORBIT_BASE_SPEED={terrain:.12/2,device:.55/2,analysis:.55/2} as const
export type RotationMode=0|1|2
let rotationMode:RotationMode=2
const listeners=new Set<()=>void>()
export const getRotationMode=()=>rotationMode
export const subscribeRotation=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}
export const nextRotationMode=(mode:RotationMode):RotationMode=>mode===2?0:mode===0?1:2
export const cycleRotation=()=>{rotationMode=nextRotationMode(rotationMode);listeners.forEach(fn=>fn())}
export const orbitSpeed=(scene:keyof typeof ORBIT_BASE_SPEED)=>ORBIT_BASE_SPEED[scene]*rotationMode
export const frameSeconds=(now:number,last:number)=>Math.max(0,Math.min(.08,(now-last)/1000))
export const SENSOR_RADIANS_PER_SECOND=.45*MOTION_MULTIPLIER
