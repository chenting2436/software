import {useEffect,useRef,useState} from 'react'
import * as T from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {disposeScene} from './threeModels'
import {frameSeconds,orbitSpeed,getRotationMode} from './sceneMotion'
import {slopeBand,slopeLayers} from './slopeGeometry'
import type {AnalysisOutput} from './analysisEngine'

export type SpatialLayers={ground:boolean;paths:boolean;context:boolean}
export function ResultSpatialScene({output,selected,layers,onSelect}:{output:AnalysisOutput;selected:number;layers:SpatialLayers;onSelect:(i:number)=>void}){
 const host=useRef<HTMLDivElement>(null),live=useRef({selected,layers,onSelect}),[failed,setFailed]=useState(false)
 live.current={selected,layers,onSelect}
 useEffect(()=>{
  const el=host.current;if(!el)return
  let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true})}catch{setFailed(true);return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;el.prepend(renderer.domElement)
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.1,1500);camera.position.set(228,148,238)
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,-14,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=150;controls.maxDistance=500;controls.maxPolarAngle=Math.PI*.49;controls.autoRotate=true;controls.autoRotateSpeed=orbitSpeed('analysis');controls.enableZoom=false
  renderer.domElement.addEventListener('wheel',e=>{controls.enableZoom=e.ctrlKey},{passive:true,capture:true})
  scene.add(new T.HemisphereLight('#d9eaf2','#304449',1.7));const key=new T.DirectionalLight('#fff0d9',3.3);key.position.set(-90,190,80);scene.add(key);const rim=new T.DirectionalLight('#78aacb',2);rim.position.set(130,10,-170);scene.add(rim)
  const ground=new T.Group(),paths=new T.Group(),context=new T.Group();scene.add(ground,paths,context)
  const add=(group:T.Group,geometry:T.BufferGeometry,color:string,opacity=1)=>{const mesh=new T.Mesh(geometry,new T.MeshPhysicalMaterial({color,roughness:opacity<1?.27:.74,metalness:.12,transparent:opacity<1,opacity,side:opacity<1?T.DoubleSide:T.FrontSide,depthWrite:opacity===1,forceSinglePass:true,clearcoat:.5}));group.add(mesh);return mesh}
  const edge=(mesh:T.Mesh,opacity=.28)=>{const lines=new T.LineSegments(new T.EdgesGeometry(mesh.geometry),new T.LineBasicMaterial({color:'#c0dde2',transparent:true,opacity}));mesh.add(lines)}
  const line=(group:T.Group,points:T.Vector3[],color:string,opacity=.6)=>{const result=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color,transparent:true,opacity}));group.add(result);return result}
  const pickables:T.Object3D[]=[],rays:T.Line[]=[],dots:T.Mesh[]=[]
  const location=output.id==='event-location',points=output.figures.find(f=>f.kind==='scatter')?.points||[]
  const marker=add(context,new T.SphereGeometry(2.4,24,16),'#f4d59c'),halo=add(context,new T.SphereGeometry(8,32,20),'#d9bd8a',.12);halo.scale.set(1,.7,1.25)
  const ring=add(context,new T.TorusGeometry(9,.16,8,80),'#e6c691',.8);ring.rotation.x=Math.PI/2
  if(location){
   for(let i=0;i<4;i++){const slab=add(ground,new T.BoxGeometry(152,8,104),['#afc7c6','#779ea5','#547d92','#44687e'][i],.14);slab.position.y=20-i*22;edge(slab,.25)}
   const count=output.figures[1].lines?.[0].length||12
   for(let i=0;i<count;i++){const a=i/count*Math.PI*2,station=new T.Vector3(Math.cos(a)*76,31,Math.sin(a)*51),base=add(context,new T.CylinderGeometry(2.7,3.2,2,16),'#d0e0e4');base.position.copy(station);const pole=add(context,new T.CylinderGeometry(.65,.65,7,8),'#abc3ca');pole.position.copy(station).y+=4;rays.push(line(paths,[station,new T.Vector3()],'#b9d9d8',.5))}
   points.forEach(([x,y,g],i)=>{const dot=add(context,new T.SphereGeometry(1.25,12,8),g===0?'#c6dfe3':'#92b8c8',.5);dot.position.set((x-50)*2,-9-g*18,(y-50)*1.55);dot.userData.event=i;pickables.push(dot);dots.push(dot)})
   // Vertical placement groups reference events; no measured depth is inferred.
   const fault=add(ground,new T.PlaneGeometry(100,81),'#b7c7d1',.1);fault.rotation.set(.1,.5,.3);fault.position.set(5,-12,0)
  }else{
   marker.visible=halo.visible=ring.visible=false
   const profile=(offset:number,thickness:number,color:string)=>{
    const shape=new T.Shape(slopeBand(offset,thickness).map(([x,y])=>new T.Vector2(x,y)));shape.closePath()
    const geometry=new T.ExtrudeGeometry(shape,{depth:96,bevelEnabled:false});geometry.translate(0,0,-48);const mesh=add(ground,geometry,color);edge(mesh,.14);return mesh
   }
   slopeLayers.forEach(layer=>profile(layer.offset,layer.thickness,layer.color))
   // A translucent candidate sliding volume, separate from the archived factors.
   const slip=new T.Shape();slip.moveTo(-28,35);slip.quadraticCurveTo(-18,-21,52,-10);slip.lineTo(31,-2);slip.lineTo(9,19);slip.lineTo(-18,35);slip.closePath()
   const slideGeo=new T.ExtrudeGeometry(slip,{depth:100,bevelEnabled:false});slideGeo.translate(0,0,-50);const slide=add(paths,slideGeo,'#e0bf80',.42);slide.renderOrder=3;edge(slide,.65)
   for(const face of [-50.5,50.5])for(let n=0;n<3;n++){const curve=new T.QuadraticBezierCurve3(new T.Vector3(-28+n*7,35,face),new T.Vector3(-10+n*6,-32,face),new T.Vector3(51+n*6,-8,face));line(paths,curve.getPoints(80),n===1?'#f2d4a0':'#c9bb9c',n===1?1:.4)}
   const waterShape=new T.Shape();waterShape.moveTo(-79,6);waterShape.quadraticCurveTo(0,14,80,-18);waterShape.lineTo(80,-21);waterShape.quadraticCurveTo(0,11,-79,3);waterShape.closePath()
   const waterGeo=new T.ExtrudeGeometry(waterShape,{depth:100,bevelEnabled:false});waterGeo.translate(0,0,-50);const water=add(context,waterGeo,'#75c5d0',.38);water.renderOrder=2
   for(let i=0;i<3;i++){const origin=new T.Vector3(-3+i*20,35-i*14,10);const arrow=new T.ArrowHelper(new T.Vector3(.8,-.58,.08).normalize(),origin,20,'#e4c796',4,2);paths.add(arrow)}
   for(let i=0;i<4;i++){const x=-67+i*13,pole=add(context,new T.CylinderGeometry(.6,.6,9,12),'#c1dbe0');pole.position.set(x,39,22);const cap=add(context,new T.CylinderGeometry(2.2,2.2,1,20),'#dee9e5');cap.position.set(x,44,22)}
  }
  const pedestal=add(ground,new T.BoxGeometry(180,2,128),'#527481',.15);pedestal.position.y=-71;edge(pedestal,.28)
  const ray=new T.Raycaster(),mouse=new T.Vector2();let down=[0,0]
  const pd=(e:PointerEvent)=>down=[e.clientX,e.clientY],pu=(e:PointerEvent)=>{if(!live.current.layers.context)return;if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=el.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(pickables)[0];if(hit)live.current.onSelect(hit.object.userData.event)}
  renderer.domElement.addEventListener('pointerdown',pd);renderer.domElement.addEventListener('pointerup',pu)
  const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}});resize.observe(el)
  let visible=true,raf=0,last=0,previous=-1;const observer=new IntersectionObserver(([e])=>visible=e.isIntersecting);observer.observe(el)
  const tick=(t:number)=>{raf=requestAnimationFrame(tick);if(!visible||document.hidden||t-last<32)return;const dt=frameSeconds(t,last);last=t;const v=live.current;ground.visible=v.layers.ground;paths.visible=v.layers.paths;context.visible=v.layers.context
   if(location&&dots.length&&v.selected!==previous){previous=v.selected;const dot=dots[v.selected%dots.length];marker.position.copy(dot.position);halo.position.copy(dot.position);ring.position.copy(dot.position);rays.forEach(r=>{const p=r.geometry.attributes.position;p.setXYZ(1,dot.position.x,dot.position.y,dot.position.z);p.needsUpdate=true;r.geometry.computeBoundingSphere()});dots.forEach((d,i)=>d.scale.setScalar(i===v.selected?1.6:1))}
   ring.scale.setScalar(1+.08*Math.sin(t*.0015));controls.autoRotate=getRotationMode()>0;controls.autoRotateSpeed=orbitSpeed('analysis');controls.update(dt);renderer.render(scene,camera)
  };raf=requestAnimationFrame(tick)
  return()=>{cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();controls.dispose();disposeScene(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[output])
 return <div className="result-spatial-scene" ref={host} aria-label={output.id==='event-location'?'台站射线与参考事件三维空间':'岩体、候选滑面与地下水三维剖面'}>{failed&&<p className="scene-fallback">三维视图不可用，请打开专业分析查看二维成果。</p>}</div>
}
