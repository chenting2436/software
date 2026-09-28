import {orbitSpeed,frameSeconds,getRotationMode} from './sceneMotion'
import {useEffect,useRef,useState} from 'react'
import {useWorkspaceAppearance} from './ScientificUI'
import * as T from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {disposeScene} from './threeModels'
import type {Figure} from './analysisEngine'
import {sampleEnergySurface} from './surfaceData'

/** A spatial view of the same computed frequency/velocity matrix, not a separate result. */
export function DispersionSurface({figure,onCursor,mode='surface'}:{figure:Figure;onCursor?:(x:number)=>void;mode?:'surface'|'ridge'|'slices'}){
 const scientific=useWorkspaceAppearance()==='scientific'
 const host=useRef<HTMLDivElement>(null),callback=useRef(onCursor),[pick,setPick]=useState('拖动旋转 · 点击能量面定位'),[failed,setFailed]=useState(false)
 callback.current=onCursor
 useEffect(()=>{
  const el=host.current,matrix=figure.matrix;if(!el||!matrix?.length)return
  setPick('拖动旋转 · 点击能量面定位');setFailed(false)
  let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true})}catch{setFailed(true);return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;el.prepend(renderer.domElement)
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(39,1,.1,100);camera.position.set(11,9,12)
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.9,0);controls.enableDamping=true;controls.autoRotate=true;controls.autoRotateSpeed=orbitSpeed('analysis');controls.enablePan=false;controls.enableZoom=false;controls.minDistance=9;controls.maxDistance=25;controls.maxPolarAngle=Math.PI*.48
  renderer.domElement.addEventListener('wheel',e=>{controls.enableZoom=e.ctrlKey},{capture:true,passive:true})
  scene.add(new T.HemisphereLight('#fff8e5','#698694',2.1));const key=new T.DirectionalLight('#ffffff',2);key.position.set(4,12,7);scene.add(key)
  const rows=matrix.length,cols=matrix[0].length,lo=Math.min(...matrix.flat()),hi=Math.max(...matrix.flat()),geometry=new T.PlaneGeometry(10,7,cols-1,rows-1);geometry.rotateX(-Math.PI/2)
  const positions=geometry.attributes.position,colors:number[]=[],stops=['#294956','#518399','#8bb9c6','#c7dcdd','#ebd6ae'].map(c=>new T.Color(c))
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const index=row*cols+col,n=(matrix[row][col]-lo)/Math.max(1e-9,hi-lo),p=n*4,k=Math.min(3,Math.floor(p)),c=stops[k].clone().lerp(stops[k+1],p-k);positions.setY(index,n*3.6);colors.push(c.r,c.g,c.b)}
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals()
  const surface=new T.Mesh(geometry,new T.MeshPhysicalMaterial({vertexColors:true,side:T.DoubleSide,roughness:.3,metalness:.25,clearcoat:.8,transparent:true,opacity:mode==='ridge'?.18:mode==='slices'?.12:.93}));scene.add(surface)
  const wire=new T.LineSegments(new T.WireframeGeometry(geometry),new T.LineBasicMaterial({color:'#c4e0d9',transparent:true,opacity:.07}));wire.visible=mode==='surface';scene.add(wire)
  const ridgePoints=Array.from({length:cols},(_,col)=>{let row=0;for(let r=1;r<rows;r++)if(matrix[r][col]>matrix[row][col])row=r;return new T.Vector3(col/(cols-1)*10-5,(matrix[row][col]-lo)/Math.max(1e-9,hi-lo)*3.6+.025,row/(rows-1)*7-3.5)})
  const ridge=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(ridgePoints),cols*3,.026,6,false),new T.MeshBasicMaterial({color:'#ebd3a6'}));scene.add(ridge)
  if(mode==='slices')for(let col=0;col<cols;col+=Math.max(1,Math.floor(cols/15))){const pts=Array.from({length:rows},(_,row)=>new T.Vector3(col/(cols-1)*10-5,(matrix[row][col]-lo)/Math.max(1e-9,hi-lo)*3.6+.02,row/(rows-1)*7-3.5));scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#b8dbe1',transparent:true,opacity:.75})))}
  const base=new T.Mesh(new T.BoxGeometry(10.2,.1,7.2),new T.MeshPhysicalMaterial({color:'#618496',roughness:.3,metalness:.25,transparent:true,opacity:.16}));base.position.y=-.15;scene.add(base)
  const grid=new T.GridHelper(10,10,scientific?'#95a9bb':'#395162',scientific?'#d2dee7':'#263847');grid.scale.z=.7;grid.visible=mode==='slices';grid.position.y=-.05;scene.add(grid)
  const marker=new T.Mesh(new T.SphereGeometry(.075,12,10),new T.MeshBasicMaterial({color:'#fff1cf'}));marker.visible=false;scene.add(marker)
  const range=figure.range||[1,32.5,100,900],project=new T.Vector3()
  const axisLabels=[{text:`${range[0]} Hz`,point:new T.Vector3(-5,-.2,4.35)},{text:`${range[1]} Hz`,point:new T.Vector3(5,-.2,4.35)},{text:`${range[2]} m/s`,point:new T.Vector3(-5.8,-.1,-3.5)},{text:`${range[3]} m/s`,point:new T.Vector3(-5.8,-.1,2.8)}].map(a=>{const label=document.createElement('span');label.className='surface-axis-label';label.textContent=a.text;el.append(label);return {...a,label}})
  const ray=new T.Raycaster(),pointer=new T.Vector2();let down=[0,0],raf=0,last=0
  const pointerDown=(e:PointerEvent)=>down=[e.clientX,e.clientY]
  const pointerUp=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=el.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(surface)[0];if(!hit)return;const sample=sampleEnergySurface(figure,(hit.point.x+5)/10,(hit.point.z+3.5)/7);marker.position.copy(hit.point);marker.position.y+=.08;marker.visible=true;callback.current?.(sample.cursor);setPick(`${sample.frequency.toFixed(1)} Hz  /  ${sample.velocity.toFixed(0)} m/s  /  能量 ${sample.energy.toFixed(3)}`)}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp)
  const resize=new ResizeObserver(()=>{if(!el.clientWidth||!el.clientHeight)return;renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix()});resize.observe(el)
  let visible=true;const observer=new IntersectionObserver(([e])=>visible=e.isIntersecting);observer.observe(el)
  const render=(time:number)=>{raf=requestAnimationFrame(render);if(!visible||document.hidden||time-last<32)return;const dt=frameSeconds(time,last);last=time;controls.autoRotate=getRotationMode()>0;controls.autoRotateSpeed=orbitSpeed('analysis');controls.update(dt);renderer.render(scene,camera);axisLabels.forEach(a=>{project.copy(a.point).project(camera);a.label.style.left=`${(project.x*.5+.5)*el.clientWidth}px`;a.label.style.top=`${(-project.y*.5+.5)*el.clientHeight}px`;a.label.style.visibility=project.z<1?'visible':'hidden'})};raf=requestAnimationFrame(render)
  return()=>{cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();controls.dispose();disposeScene(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();axisLabels.forEach(a=>a.label.remove())}
 },[figure,scientific,mode])
 return <div className="dispersion-surface" ref={host} aria-label="频散能量三维曲面">{failed&&<p className="surface-fallback">三维视图不可用，请切换“二维图面”。</p>}<div className="surface-legend"><span>归一化能量</span><i/><small>低<span>高</span></small></div><output>{pick}</output></div>
}
