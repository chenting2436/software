import {orbitSpeed,frameSeconds,getRotationMode} from './sceneMotion'
import { useEffect, useRef, useState } from 'react'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createDeviceModel, disposeScene } from './threeModels'
import { platforms, type PlatformKind } from './sceneCatalog'

export function DeviceModelView({kind,explode=0,selected='',onSelect,compact=false,auto=true,cinematic=false,onInteraction}:{kind:PlatformKind;explode?:number;selected?:string;onSelect?:(id:string)=>void;compact?:boolean;auto?:boolean;cinematic?:boolean;onInteraction?:()=>void}){
 const host=useRef<HTMLDivElement>(null),latest=useRef({explode,selected,onSelect,auto,onInteraction}),[failed,setFailed]=useState(false)
 latest.current={explode,selected,onSelect,auto,onInteraction}
 useEffect(()=>{const el=host.current;if(!el)return;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true})}catch{setFailed(true);return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;el.appendChild(renderer.domElement)
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,100);camera.position.set(6,3.6,7);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.2,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=4;controls.maxDistance=18;controls.autoRotateSpeed=orbitSpeed('device');controls.enableZoom=false;renderer.domElement.addEventListener('wheel',e=>{controls.enableZoom=!compact&&e.ctrlKey},{capture:true,passive:true})
  scene.add(new T.HemisphereLight('#d1e6ff','#344551',3));const light=new T.DirectionalLight('#fff3de',4);light.position.set(3,7,5);scene.add(light);const rim=new T.DirectionalLight('#91d5ff',3);rim.position.set(-5,2,-3);scene.add(rim)
  const model=createDeviceModel(kind);scene.add(model.root)
  let environment:T.WebGLRenderTarget|undefined
  if(cinematic){
   const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.8;pmrem.dispose();room.dispose()
   renderer.toneMappingExposure=.9;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap
   light.intensity=2;light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-8;light.shadow.camera.right=8;light.shadow.camera.top=8;light.shadow.camera.bottom=-8;light.shadow.bias=-.001;rim.intensity=1.2
   camera.position.set(6,4.4,7.5);camera.fov=34;camera.updateProjectionMatrix();controls.target.set(0,.15,0);controls.maxPolarAngle=Math.PI*.52
   const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.3}));floor.rotation.x=-Math.PI/2;floor.position.y=-2;floor.receiveShadow=true;scene.add(floor)
   controls.addEventListener('start',()=>latest.current.onInteraction?.())
  }else{const grid=new T.GridHelper(13,26,'#2b475e','#1b3244');grid.position.y=-1.9;scene.add(grid)}
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)')
  const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}});resize.observe(el)
  const ray=new T.Raycaster(),pointer=new T.Vector2();let down=[0,0],spread=0,raf=0,visible=true,last=0
  const observe=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});observe.observe(el)
  const pointerDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY]};const click=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=el.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);let o:T.Object3D|undefined=ray.intersectObject(model.root,true)[0]?.object;while(o&&!o.userData.part)o=o.parent||undefined;if(o)latest.current.onSelect?.(o.userData.part)}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',click)
  const tick=(time:number)=>{raf=requestAnimationFrame(tick);if(!visible||document.hidden||time-last<32)return;const dt=frameSeconds(time,last);last=time;spread+=(latest.current.explode-spread)*(reducedMotion.matches?1:.1);model.setExplode(spread);model.select(latest.current.selected);controls.autoRotate=getRotationMode()>0;controls.autoRotateSpeed=orbitSpeed('device');controls.update(dt);if(kind==='drone'&&controls.autoRotate)model.spin.forEach(s=>s.rotation.y+=dt*21);renderer.render(scene,camera)};raf=requestAnimationFrame(tick)
  return()=>{cancelAnimationFrame(raf);resize.disconnect();observe.disconnect();controls.dispose();disposeScene(scene);environment?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[kind,compact,cinematic])
 return <div ref={host} className={`device-webgl ${compact?'is-compact':''} ${cinematic?'is-cinematic':''}`} aria-label={`${platforms[kind].name}三维概念模型`}>{failed&&<div className="scene-fallback">当前环境不支持 WebGL，可继续查看部件与设备参数。</div>}{!cinematic&&<span className="model-caption">外观参考 / 概念结构</span>}</div>
}
