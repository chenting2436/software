import * as T from 'three'

const clamp=(n:number)=>Math.max(0,Math.min(1,n))
const smooth=(n:number)=>{n=clamp(n);return n*n*(3-2*n)}
const rimScale=(a:number)=>1+.13*Math.sin(a*2+.45)+.085*Math.cos(a*3-.7)+.035*Math.sin(a*7)
export const cinematicRadius=(x:number,z:number)=>Math.hypot(x/275,z/195)/rimScale(Math.atan2(z/195,x/275))
const pointAt=(r:number,a:number)=>[Math.cos(a)*275*r*rimScale(a),Math.sin(a)*195*r*rimScale(a)] as const
export function haulRoadPoint(t:number){const a=.45+clamp(t)*Math.PI*1.74,r=.18+clamp(t)*.95,[x,z]=pointAt(r,a);return {x,z,y:-69+clamp(t)*104}}
const hills=(x:number,z:number)=>{
 const ridge=(cx:number,cz:number,sx:number,sz:number,h:number)=>h*Math.exp(-((x-cx)**2/sx**2+(z-cz)**2/sz**2))
 return ridge(-460,-340,270,240,190)+ridge(190,-520,340,210,165)+ridge(550,0,260,330,95)+ridge(-540,430,240,340,65)
  +16*Math.sin(x*.009+Math.sin(z*.006))*Math.cos(z*.012)+6*Math.sin(x*.021+z*.014)+2.3*Math.cos(x*.057-z*.032)-14*Math.exp(-1*((z+180+70*Math.sin(x*.006))/28)**2)
}
/** Authored local terrain, not a survey. This field also places devices and the road. */
export function cinematicHeight(x:number,z:number){
 const r=cinematicRadius(x,z),a=Math.atan2(z/195,x/275)
 let y=-69
 for(let i=0;i<8;i++)y+=13*smooth((r-(.25+i*.095))/.023)
 if(r>1.06)y+=hills(x,z)*smooth((r-1.06)/.7)
 const angle=(a-.45+Math.PI*2)%(Math.PI*2),t=angle/(Math.PI*1.74)
 if(t<=1){const roadRadius=.18+t*.95,d=Math.abs(r-roadRadius)*220,blend=1-smooth((d-5)/9);y=y*(1-blend)+(-69+t*104)*blend}
 return y
}

export function makeCinematicTerrain(compact=false,style:'natural'|'elevation'='natural'){
 const root=new T.Group(),benches=new T.Group(),strata=new T.Group(),events=new T.Group()
 const stone=new T.Color('#b9b6a4'),grass=new T.Color('#536f60'),rock=new T.Color('#88958a')
 let texture:T.CanvasTexture|undefined
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')
  if(ctx){const pixels=ctx.createImageData(512,512);let seed=18973
   for(let y=0;y<512;y++)for(let x=0;x<512;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=122+(seed>>>26)+6*Math.sin(x*.018+Math.sin(y*.02)*7)+3*Math.sin(y*.055),i=(y*512+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255}
   ctx.putImageData(pixels,0,0);texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(12,12);texture.anisotropy=8
  }
 }
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,bumpMap:style==='natural'?texture||null:null,bumpScale:.12,side:T.DoubleSide})
 const colorAt=(x:number,z:number,y:number)=>{
  if(style==='elevation'){const stops=['#173b87','#158fa7','#75ad6a','#d4a143','#f3ebd6'],t=clamp((y+70)/300)*4,i=Math.min(3,Math.floor(t));return new T.Color(stops[i]).lerp(new T.Color(stops[i+1]),t-i)}
  const r=cinematicRadius(x,z),grain=.9+.045*Math.sin(x*.028+z*.017)+.025*Math.cos(y*.5)+.024*Math.sin(x*.72+z*.56)+.014*Math.cos(x*2.16-z*1.6),c=r<1.1?stone.clone():rock.clone().lerp(grass,smooth((r-1.1)/.6)*(.55+.22*Math.sin(x*.006-z*.009)))
  if(r<1.1){const sediment=.5+.5*Math.sin(y*1.55+Math.sin(x*.036)*.8+Math.cos(z*.028)*.4);c.lerp(new T.Color('#8b857b'),sediment*.14)}
  return c.multiplyScalar(grain+(r<1.1?.055*Math.sin(y*.48):y/1100))
 }
 const finish=(g:T.BufferGeometry)=>{const p=g.attributes.position,colors:number[]=[],uvs:number[]=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=cinematicHeight(x,z),c=colorAt(x,z,y);p.setY(i,y);colors.push(c.r,c.g,c.b);uvs.push(x/1800+.5,z/1800+.5)}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeVertexNormals();const m=new T.Mesh(g,material.clone());m.receiveShadow=true;m.castShadow=true;return m}
 // Landscape and pit meet on exactly the same radial seam: no overlapping surfaces.
 const land=new T.BufferGeometry(),landPositions:number[]=[],landIndices:number[]=[],landRings=compact?65:140,landSegments=compact?192:384
 for(let j=0;j<=landRings;j++)for(let i=0;i<=landSegments;i++){const r=1.14+4.5*(j/landRings)**1.4,[x,z]=pointAt(r,i/landSegments*Math.PI*2);landPositions.push(x,0,z);if(j<landRings&&i<landSegments){const n=j*(landSegments+1)+i;landIndices.push(n,n+1,n+landSegments+1,n+1,n+landSegments+2,n+landSegments+1)}}
 land.setAttribute('position',new T.Float32BufferAttribute(landPositions,3));land.setIndex(landIndices)
 const terrain=finish(land);root.add(terrain)
 // Explicit bench corners retain crisp rock faces at every display size.
 const radii=[0,.12,.18,.22]
 for(let i=0;i<8;i++){const r=.25+i*.095;radii.push(r,r+.004,r+.012,r+.020,r+.023,r+.050,r+.075)}radii.push(1.04,1.09,1.14)
 radii.sort((a,b)=>a-b)
 const positions:number[]=[],triangles:number[]=[],segments=compact?192:384
 for(let j=0;j<radii.length;j++)for(let i=0;i<=segments;i++){const [x,z]=pointAt(radii[j],i/segments*Math.PI*2);positions.push(x,0,z);if(j<radii.length-1&&i<segments){const n=j*(segments+1)+i;triangles.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1)}}
 const pit=new T.BufferGeometry();pit.setAttribute('position',new T.Float32BufferAttribute(positions,3));pit.setIndex(triangles);benches.add(finish(pit));root.add(benches)
 // A graded road is cut into the height field, not floated across benches.
 const roadVertices:number[]=[],roadIndices:number[]=[],steps=400
 for(let i=0;i<=steps;i++){const t=i/steps,p=haulRoadPoint(t),next=haulRoadPoint(Math.min(1,t+.002)),prev=haulRoadPoint(Math.max(0,t-.002)),dx=next.x-prev.x,dz=next.z-prev.z,len=Math.hypot(dx,dz)||1
  for(const s of [-1,1]){const x=p.x-dz/len*4.3*s,z=p.z+dx/len*4.3*s;roadVertices.push(x,cinematicHeight(x,z)+.32,z)}if(i<steps){const n=i*2;roadIndices.push(n,n+1,n+2,n+1,n+3,n+2)}}
 const roadGeo=new T.BufferGeometry();roadGeo.setAttribute('position',new T.Float32BufferAttribute(roadVertices,3));roadGeo.setIndex(roadIndices);roadGeo.computeVertexNormals()
 const road=new T.Mesh(roadGeo,new T.MeshStandardMaterial({color:'#c4b99f',roughness:1,side:T.DoubleSide}));road.receiveShadow=true;benches.add(road)

 // Connect the mine rim to a winding service road through the valley.
 const servicePoints=Array.from({length:100},(_,i)=>{const t=i/99,x=270+t*570,z=125+95*Math.sin(t*2.9);return new T.Vector3(x,cinematicHeight(x,z)+.5,z)})
 const serviceVertices:number[]=[],serviceIndices:number[]=[]
 servicePoints.forEach((p,i)=>{const ahead=servicePoints[Math.min(99,i+1)],back=servicePoints[Math.max(0,i-1)],dx=ahead.x-back.x,dz=ahead.z-back.z,len=Math.hypot(dx,dz)||1;for(const side of [-1,1]){const x=p.x-dz/len*5*side,z=p.z+dx/len*5*side;serviceVertices.push(x,cinematicHeight(x,z)+.5,z)}if(i<99){const j=i*2;serviceIndices.push(j,j+1,j+2,j+1,j+3,j+2)}})
 const serviceGeo=new T.BufferGeometry();serviceGeo.setAttribute('position',new T.Float32BufferAttribute(serviceVertices,3));serviceGeo.setIndex(serviceIndices);serviceGeo.computeVertexNormals();const serviceMesh=new T.Mesh(serviceGeo,new T.MeshStandardMaterial({color:'#a9a994',roughness:1,side:T.DoubleSide}));serviceMesh.receiveShadow=true;benches.add(serviceMesh)
 const pond=new T.Shape();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,r=29*(1+.06*Math.sin(a*5)+.04*Math.cos(a*7)),x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)pond.moveTo(x,y);else pond.lineTo(x,y)}const water=new T.Mesh(new T.ShapeGeometry(pond),new T.MeshPhysicalMaterial({color:'#47706d',roughness:.28,metalness:.3,transparent:true,opacity:.76}));water.rotation.x=-Math.PI/2;water.scale.set(1,.57,1);water.position.set(-20,-68.7,-8);benches.add(water)
 const building=new T.MeshStandardMaterial({color:'#bbbdb7',roughness:.8}),roof=new T.MeshStandardMaterial({color:'#435d67',roughness:.6}),dark=new T.MeshStandardMaterial({color:'#243641',roughness:.65}),yellow=new T.MeshStandardMaterial({color:'#d5ab55',roughness:.8})
 const box=(group:T.Group,w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
 for(let i=0;i<6;i++){const x=320+i%3*28,z=205+Math.floor(i/3)*40,y=cinematicHeight(x,z);box(benches,22,10,31,x,y+5,z,building);box(benches,24,1.4,33,x,y+10.5,z,roof);for(let n=0;n<4;n++)box(benches,3,2,.3,x-7+n*4.5,y+6,z+15.6,dark)}
 for(let i=0;i<4;i++){const t=.14+i*.23,p=haulRoadPoint(t),q=haulRoadPoint(t+.002),truck=new T.Group();box(truck,5,2.8,9,0,3,1,yellow);box(truck,4,3,3.2,0,3,-4,building);box(truck,3.7,1.2,.2,0,3.8,-5.7,dark);for(const x of [-2.6,2.6])for(const z of [-3,3]){const wheel=new T.Mesh(new T.CylinderGeometry(1.4,1.4,1,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,1.4,z);truck.add(wheel)}truck.position.set(p.x,p.y+.5,p.z);truck.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);benches.add(truck)}
 // Instancing gives vegetation and rock outcrops a bounded draw-call cost.
 const count=compact?320:960,trees=new T.InstancedMesh(new T.IcosahedronGeometry(4.2,1),new T.MeshStandardMaterial({color:'#ffffff',roughness:1}),count),boulders=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#9a9b8d',roughness:1}),count),dummy=new T.Object3D()
 let seed=27183;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 for(let i=0;i<count;i++){let x=0,z=0;do{x=(random()-.5)*1550;z=(random()-.5)*1450}while(cinematicRadius(x,z)<1.48||(x>290&&x<450&&z>150&&z<350));const size=.65+random()*.95,y=cinematicHeight(x,z);dummy.position.set(x,y+5.8*size,z);dummy.scale.set(size*1.3,size*1.6,size);dummy.rotation.set(0,random()*Math.PI,0);dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);trees.setColorAt(i,new T.Color().setHSL(.29+random()*.05,.12+random()*.15,.2+random()*.12));dummy.position.set(x+9,y+1.2,z+7);dummy.scale.set(2+random()*3,1.5+random()*2,2+random()*3);dummy.updateMatrix();boulders.setMatrixAt(i,dummy.matrix)}trees.castShadow=true;trees.receiveShadow=true;boulders.castShadow=true;if(style==='natural')benches.add(trees,boulders);else{trees.geometry.dispose();(trees.material as T.Material).dispose();boulders.geometry.dispose();(boulders.material as T.Material).dispose()}
 for(let i=0;i<4;i++){const slab=new T.Mesh(new T.BoxGeometry(475,13,340),new T.MeshStandardMaterial({color:['#637e80','#a29a7c','#647c73','#6e788d'][i],transparent:true,opacity:.4}));slab.position.y=-90-i*20;strata.add(slab)}
 for(let i=0;i<32;i++){const dot=new T.Mesh(new T.SphereGeometry(i%9===0?3:1.6,8,6),new T.MeshBasicMaterial({color:i%9===0?'#e7b776':'#80c9d0',transparent:true,opacity:.85}));dot.position.set(Math.sin(i*8.2)*95,-88-i%7*9,Math.cos(i*1.7)*65);events.add(dot)}
 root.add(strata,events)
 return {root,terrain,strata,events,benches}
}
