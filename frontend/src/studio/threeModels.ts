import * as T from 'three'
import type { PlatformKind } from './sceneCatalog'

export interface DeviceModel { root:T.Group; parts:Map<string,T.Group>; spin:T.Object3D[]; setExplode:(amount:number)=>void; select:(id:string)=>void }
const paint=(color:string,metalness=.35,roughness=.42)=>new T.MeshStandardMaterial({color,metalness,roughness})
export function createDeviceModel(kind:PlatformKind):DeviceModel{
 const root=new T.Group(),parts=new Map<string,T.Group>(),spin:T.Object3D[]=[],silver=paint('#b7c6cf',.68,.29),white=paint('#e1e7e8',.35,.33),dark=paint('#26323c',.62,.36),rubber=paint('#17212a',0,.86),blue=paint('#183a70',.55,.25),gold=paint('#a99769',.65,.33),glass=paint('#14394d',.75,.1)
 const part=(id:string)=>{const g=new T.Group();g.name=id;g.userData.part=id;parts.set(id,g);root.add(g);return g}
 const mesh=(g:T.Group,geo:T.BufferGeometry,mat:T.Material,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
 const box=(g:T.Group,w:number,h:number,d:number,mat:T.Material,x=0,y=0,z=0)=>mesh(g,new T.BoxGeometry(w,h,d),mat,x,y,z)
 const cyl=(g:T.Group,r:number,h:number,mat:T.Material,x=0,y=0,z=0,r2=r)=>mesh(g,new T.CylinderGeometry(r,r2,h,32),mat,x,y,z)
 const sphere=(g:T.Group,r:number,mat:T.Material,x=0,y=0,z=0)=>mesh(g,new T.SphereGeometry(r,32,20),mat,x,y,z)
 const solarPanel=(g:T.Group,w:number,d:number,x:number,y:number,z:number)=>{box(g,w,.075,d,silver,x,y,z);box(g,w-.08,.025,d-.08,blue,x,y+.05,z);for(let i=1;i<8;i++)box(g,.012,.008,d-.09,silver,x-w/2+i*w/8,y+.067,z);for(let i=1;i<5;i++)box(g,w-.1,.008,.012,silver,x,y+.067,z-d/2+i*d/5)}
 const pcb=(g:T.Group,x:number,y:number,z:number)=>{box(g,.65,.05,.7,paint('#22615a'),x,y,z);for(let i=0;i<6;i++)box(g,.12,.05,.14,dark,x-.2+(i%3)*.2,y+.045,z-.16+Math.floor(i/3)*.3)}
 if(kind==='satellite'){
  const bus=part('bus');box(bus,1.25,1.3,1.1,gold,0,.15);box(bus,1.32,.1,1.17,silver,0,.85);for(let i=0;i<5;i++)box(bus,1.26,.024,1.12,dark,0,-.35+i*.19)
  const s=part('solar');box(s,6,.08,.1,silver,0,.17);for(const side of [-1,1])for(let i=0;i<2;i++)solarPanel(s,1.17,1.65,side*(1.35+i*1.22),.25,0)
  const p=part('payload');cyl(p,.42,.58,dark,0,-.75);cyl(p,.36,.04,glass,0,-1.05);box(p,.6,.4,.45,silver,.62,-.4,.35)
  const l=part('link');cyl(l,.07,.7,silver,0,1.15);const dish=mesh(l,new T.SphereGeometry(.4,28,14,0,Math.PI*2,0,Math.PI/2),white,0,1.52);dish.rotation.x=Math.PI;box(l,.07,.6,.04,silver,.2,1.7)
 }else if(kind==='drone'){
  const f=part('airframe'),shape=new T.Shape();shape.moveTo(0,-1.85);shape.lineTo(1,-.05);shape.lineTo(3.3,1.1);shape.lineTo(3.25,1.7);shape.lineTo(.5,.85);shape.lineTo(0,1.25);shape.lineTo(-.5,.85);shape.lineTo(-3.25,1.7);shape.lineTo(-3.3,1.1);shape.lineTo(-1,-.05);shape.closePath();const wing=mesh(f,new T.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.06,bevelThickness:.04}),white);wing.rotation.x=Math.PI/2
  const body=sphere(f,1,silver,0,.06,-.15);body.scale.set(.43,.27,1.7);for(const s of [-1,1]){const fin=box(f,.07,.58,.55,white,s*3.15,.27,1.4);fin.rotation.z=-s*.22;box(f,1.3,.018,.14,dark,s*1.85,.05,-.62)}
  for(const s of [-1,1]){
   const seam=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(s*.65,.075,.56),new T.Vector3(s*2.92,.075,1.47)]),new T.LineBasicMaterial({color:'#5c6b74',transparent:true,opacity:.65}));f.add(seam)
   for(let j=0;j<5;j++)cyl(f,.022,.01,dark,s*(.82+j*.42),.08,.58+j*.16)
   for(let j=0;j<6;j++)box(f,.012,.015,.13,dark,s*(.56+j*.045),.075,.28)
  }
  if(typeof document!=='undefined'){
   const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=96;const context=labelCanvas.getContext('2d')!
   context.fillStyle='#344753';context.font='500 54px sans-serif';context.textAlign='center';context.fillText('KUANGDA',256,65)
   const labelTexture=new T.CanvasTexture(labelCanvas);labelTexture.colorSpace=T.SRGBColorSpace
   const label=mesh(f,new T.PlaneGeometry(.86,.16),new T.MeshStandardMaterial({map:labelTexture,transparent:true,roughness:.8,depthWrite:false}),1.9,.077,.88);label.rotation.x=-Math.PI/2
  }
  const motors=part('rotor');for(const x of [-1.25,1.25]){box(motors,.1,.1,2.6,dark,x,.25,.05);for(const z of [-1.05,1.15]){cyl(motors,.14,.22,dark,x,.35,z);const rotor=new T.Group();rotor.position.set(x,.49,z);motors.add(rotor);box(rotor,1.05,.035,.085,dark);box(rotor,.085,.035,1.05,dark);spin.push(rotor)}}
  const c=part('camera');cyl(c,.12,.2,dark,0,-.23,-.75);sphere(c,.23,silver,0,-.43,-.75);const lens=cyl(c,.13,.08,glass,0,-.45,-.97);lens.rotation.x=Math.PI/2
  const b=part('battery');box(b,.44,.19,.7,dark,0,.12,.4);box(b,.32,.012,.4,blue,0,.223,.4)
  const a=part('avionics');pcb(a,0,.13,-.4);cyl(a,.025,.35,dark,.2,.33,-.25)
 }else if(kind==='rover'){
  const b=part('body');box(b,1.65,.48,2.6,dark,0,-.18);const hull=box(b,1.78,.5,2.5,white,0,.26);hull.rotation.x=.06;box(b,1.4,.2,1.35,dark,0,.56,.1);for(const s of [-1,1]){box(b,.1,.12,2,silver,s*.85,.05);box(b,.55,.08,.035,paint('#97dbea',.2),s*.52,.42,-1.3);for(let i=0;i<5;i++)box(b,.13,.21,.015,dark,s*.58,.15,.9-i*.12)}
  const wheels=part('wheels');for(const x of [-1,1])for(const z of [-.85,.85]){const g=new T.Group();g.position.set(x,-.4,z);wheels.add(g);const tire=mesh(g,new T.CylinderGeometry(.49,.49,.34,32),rubber);tire.rotation.z=Math.PI/2;const hub=mesh(g,new T.CylinderGeometry(.27,.27,.355,24),silver);hub.rotation.z=Math.PI/2;for(let i=0;i<18;i++){const tread=box(g,.37,.07,.14,rubber,0,Math.cos(i*Math.PI/9)*.49,Math.sin(i*Math.PI/9)*.49);tread.rotation.x=i*Math.PI/9}spin.push(g)}
  const r=part('radar');cyl(r,.28,.2,dark,0,.72,.5);box(r,.23,.68,.22,silver,0,1.13,.5);box(r,1.4,.12,.2,dark,0,1.43,.25);box(r,.85,.54,.27,white,.35,1.47,.15);box(r,.65,.38,.025,dark,.35,1.47,-.002);for(let i=0;i<7;i++)box(r,.015,.3,.015,blue,.08+i*.08,1.47,-.02)
  const c=part('camera');sphere(c,.16,dark,-.5,1.49,.25);const l=cyl(c,.1,.08,glass,-.5,1.49,.07);l.rotation.x=Math.PI/2
  const battery=part('battery');box(battery,1,.26,.8,blue,0,.05,.3)
 }else{
  const mast=part('mast');cyl(mast,.35,.12,silver,0,-1.5,0,.55);cyl(mast,.19,2.2,white,0,-.36,0,.36);box(mast,.12,1.1,.025,blue,0,-.1,-.275);box(mast,.06,.95,.027,paint('#85cddb'),0,-.1,-.295)
  const s=part('solar');for(const side of [-1,1]){const panel=new T.Group();panel.position.set(side*.92,.83,0);panel.rotation.z=side*.2;solarPanel(panel,1.5,1.3,0,0,0);s.add(panel)}box(s,2.8,.07,.12,silver,0,.6)
  const h=part('head');cyl(h,.12,.4,silver,0,1.2);sphere(h,.42,dark,0,1.57);for(let i=0;i<3;i++){const angle=i*Math.PI*2/3,ring=cyl(h,.18,.085,gold,Math.sin(angle)*.36,1.57,Math.cos(angle)*.36);ring.rotation.set(Math.PI/2,0,-angle);const lens=sphere(h,.13,glass,Math.sin(angle)*.4,1.57,Math.cos(angle)*.4);lens.scale.y=.9}
  const b=part('battery');box(b,.53,.34,.62,dark,0,.47);pcb(b,0,.67,0)
  const p=part('probe');cyl(p,.13,.48,gold,.65,-1.1);cyl(p,.09,.25,dark,.65,-1.46);const wire=new T.CatmullRomCurve3([new T.Vector3(0,.2,.1),new T.Vector3(.7,-.3,.1),new T.Vector3(.65,-.9,0)]);mesh(p,new T.TubeGeometry(wire,24,.02,6,false),dark)
 }
 const origins=new Map([...parts].map(([id,g])=>[id,g.position.clone()]));const spread:Record<string,[number,number,number]>={solar:[0,1.3,0],payload:[0,-1.5,0],link:[0,1.7,0],rotor:[0,1.3,0],camera:[0,-1,0],battery:[1.3,.1,.7],avionics:[0,1.6,0],radar:[0,1.4,0],wheels:[0,-.65,0],head:[0,1.4,0],probe:[1.2,-.4,0]}
 // Clone materials per part so highlighting never changes unrelated parts.
 parts.forEach(g=>g.traverse(o=>{if(o instanceof T.Mesh)o.material=(o.material as T.MeshStandardMaterial).clone()}))
 return {root,parts,spin,setExplode(amount){parts.forEach((g,id)=>{const v=spread[id]||[0,0,0];g.position.copy(origins.get(id)!).addScaledVector(new T.Vector3(...v),amount)})},select(id){parts.forEach((g,key)=>g.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;m.emissive.set(key===id?'#184c65':'#000000');m.emissiveIntensity=key===id?.55:0}}))}}
}
export function disposeScene(root:T.Object3D){const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>(),textures=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Points){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof T.Texture)textures.add(v)});m.dispose()});textures.forEach(t=>t.dispose())}
