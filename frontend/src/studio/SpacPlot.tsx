import {useEffect,useRef,useState,type RefObject} from 'react'
import {energyAt,fitSpacPicks,spacDatasets,type SpacPick,type SpacResult} from './spacSampleEngine'
export type SpacView='频散能量'|'波形'|'自相关'|'观测阵列'|'拾取结果'
export type PickMode='inspect'|'add'|'delete'
export interface SpacPlotProps{result:SpacResult;view:SpacView;picks:SpacPick[];selected:number;mode:PickMode;grid:boolean;crosshair:boolean;showPicks:boolean;showFit:boolean;zoom:number;pan:number;palette:string;onPoint:(p:SpacPick)=>void;onCursor:(p:SpacPick|null)=>void;canvasRef:RefObject<HTMLCanvasElement|null>}
const chartColors=['#72cad0','#e7b374','#b7ce87','#c1a0d3']
function color(v:number,palette:string){const stops=palette==='雾蓝'?[[17,37,50],[49,80,101],[104,152,171],[176,208,208],[232,211,173]]:palette==='灰度'?[[248,248,248],[40,40,40]]:palette==='蓝黄'?[[36,45,126],[27,126,158],[70,181,158],[202,218,88],[255,215,61]]:[[36,34,132],[26,102,194],[42,191,193],[160,220,80],[250,222,66],[246,124,43],[178,34,49]];const t=Math.max(0,Math.min(1,v))*(stops.length-1),i=Math.min(stops.length-2,Math.floor(t)),w=t-i;return stops[i].map((a,j)=>Math.round(a*(1-w)+stops[i+1][j]*w))}
export function SpacPlot({result,view,picks,selected,mode,grid,crosshair,showPicks,showFit,zoom,pan,palette,onPoint,onCursor,canvasRef}:SpacPlotProps){
 const host=useRef<HTMLDivElement>(null),[size,setSize]=useState({w:1000,h:500}),[hover,setHover]=useState<{x:number;y:number}|null>(null),texture=useRef<HTMLCanvasElement|null>(null)
 const p=result.request.params,data=spacDatasets.find(d=>d.id===result.request.dataset)!,left=78,top=28,right=view==='频散能量'?91:35,bottom=54,pw=Math.max(1,size.w-left-right),ph=Math.max(1,size.h-top-bottom)
 const start=p.fmin+(p.fmax-p.fmin-((p.fmax-p.fmin)/zoom))*pan,end=start+(p.fmax-p.fmin)/zoom
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([e])=>setSize({w:Math.max(350,e.contentRect.width),h:Math.max(180,e.contentRect.height)}));observer.observe(host.current);return()=>observer.disconnect()},[])
 useEffect(()=>{const canvas=document.createElement('canvas');canvas.width=result.frequencies.length;canvas.height=result.velocities.length;const ctx=canvas.getContext('2d')!,image=ctx.createImageData(canvas.width,canvas.height);for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){const c=color(result.energy[canvas.height-1-row][col],palette),k=(row*canvas.width+col)*4;image.data.set([...c,255],k)}ctx.putImageData(image,0,0);texture.current=canvas},[result,palette])
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=size.w*dpr;canvas.height=size.h*dpr;const ctx=canvas.getContext('2d')!;ctx.scale(dpr,dpr);ctx.clearRect(0,0,size.w,size.h);ctx.font='12px "Segoe UI", "Microsoft YaHei UI", sans-serif';ctx.lineWidth=1
  const sx=(x:number)=>left+(x-start)/(end-start)*pw,sy=(y:number)=>top+ph-(y-p.cmin)/(p.cmax-p.cmin)*ph
  function line(points:[number,number][],stroke:string,width=1.5){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
  function text(t:string,x:number,y:number,align:CanvasTextAlign='left',fill='#9ebdce'){ctx.textAlign=align;ctx.fillStyle=fill;ctx.fillText(t,x,y)}
  const axes=(xmin:number,xmax:number,ymin:number,ymax:number,xlabel:string,ylabel:string,yticks=true)=>{
   ctx.lineWidth=1;ctx.strokeStyle='#486477';ctx.strokeRect(left+.5,top+.5,pw,ph)
   for(let i=0;i<=6;i++){const x=left+i*pw/6,y=top+ph-i*ph/6;if(grid){ctx.save();ctx.setLineDash([2,3]);ctx.strokeStyle=view==='频散能量'?'#ffffff24':'#294455';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+ph);if(yticks){ctx.moveTo(left,y);ctx.lineTo(left+pw,y)}ctx.stroke();ctx.restore()}text((xmin+(xmax-xmin)*i/6).toFixed(xmax<=40?1:0),x,top+ph+21,'center');if(yticks)text((ymin+(ymax-ymin)*i/6).toFixed(Math.max(Math.abs(ymin),Math.abs(ymax))<2?1:0),left-10,y+4,'right')}
   text(xlabel,left+pw/2,size.h-12,'center');ctx.save();ctx.translate(20,top+ph/2);ctx.rotate(-Math.PI/2);text(ylabel,0,0,'center');ctx.restore()
  }
  if(view==='频散能量'){
   if(texture.current){ctx.imageSmoothingEnabled=true;const tex=texture.current,ox=(start-p.fmin)/(p.fmax-p.fmin)*(tex.width-1);ctx.drawImage(tex,ox,0,(tex.width-1)/zoom+1,tex.height,left,top,pw,ph)}
   axes(start,end,p.cmin,p.cmax,'频率 / Hz','相速度 / m·s⁻¹');ctx.save();ctx.beginPath();ctx.rect(left,top,pw,ph);ctx.clip()
   if(showFit&&picks.length>=3){const fit=fitSpacPicks(picks);ctx.setLineDash([7,4]);line(fit.map(v=>[sx(v.f),sy(v.c)]),'#fff',2.2);ctx.setLineDash([])}
   if(showPicks)picks.forEach((pick,i)=>{ctx.beginPath();ctx.arc(sx(pick.f),sy(pick.c),selected===i?5:3.5,0,Math.PI*2);ctx.fillStyle=selected===i?'#fff':'#ee4234';ctx.fill();ctx.strokeStyle=selected===i?'#182e40':'#fff';ctx.lineWidth=1.3;ctx.stroke()})
   ctx.restore();for(let i=0;i<ph;i++){ctx.fillStyle=`rgb(${color(1-i/ph,palette).join(',')})`;ctx.fillRect(left+pw+27,top+i,13,1.3)}ctx.strokeStyle='#8a969e';ctx.lineWidth=.7;ctx.strokeRect(left+pw+27,top,13,ph);for(let i=0;i<=5;i++)text((1-i/5).toFixed(1),left+pw+47,top+i/5*ph+4);text('匹配度',left+pw+25,top-11,'left','#9bb7c8')
  }else if(view==='自相关'){
   axes(p.fmin,p.fmax,-.5,1,'频率 / Hz','空间自相关系数 ρ');result.correlations.forEach((curve,k)=>line(curve.map((v,i)=>[left+i/(curve.length-1)*pw,top+ph-(v+.5)/1.5*ph]),chartColors[k],1.6));data.radii.forEach((r,i)=>{ctx.fillStyle=chartColors[i];ctx.fillRect(left+15+i*125,top+12,19,2);text(`r = ${r} m`,left+40+i*125,top+18)})
  }else if(view==='波形'){
   axes(0,8,0,result.waveforms.length,'时间 / s','通道',false);result.waveforms.forEach((wave,k)=>{const cy=top+(k+.5)*ph/result.waveforms.length;line(wave.map((v,i)=>[left+i/(wave.length-1)*pw,cy-v*ph/result.waveforms.length*.3]),'#80bccd',.9);text(String(k+1).padStart(2,'0'),left-10,cy+4,'right','#8baabc')})
  }else if(view==='观测阵列'){
   const radius=data.radii[2],scale=Math.min(pw,ph)*.42/radius,cx=left+pw/2,cy=top+ph/2;ctx.strokeStyle='#8fabbf';data.radii.forEach((r,i)=>{ctx.beginPath();ctx.setLineDash([4,4]);ctx.arc(cx,cy,r*scale,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);text(`${r} m`,cx+r*scale+5,cy-10-i*3)});line([[cx-radius*scale-22,cy],[cx+radius*scale+22,cy]],'#365668',1);line([[cx,cy-radius*scale-18],[cx,cy+radius*scale+18]],'#365668',1);for(let i=0;i<data.channels;i++){const a=i*Math.PI*2/(data.channels-1),x=i===0?cx:cx+Math.cos(a)*radius*scale,y=i===0?cy:cy+Math.sin(a)*radius*scale;if(i)line([[cx,cy],[x,y]],'#3d6074',1);ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='#8fcbd4';ctx.fill();text(`S${String(i+1).padStart(2,'0')}`,x+10,y-7)}text('北 ↑',cx,top+5,'center');text('阵列示意 / m',left+pw/2,size.h-12,'center');text('环组',left,top+20);data.radii.forEach((r,i)=>text(`R${i+1}  ${r} m`,left,top+45+i*23,'left',chartColors[i]))
  }
  if(hover&&view==='频散能量'&&crosshair){ctx.save();ctx.setLineDash([4,4]);line([[hover.x,top],[hover.x,top+ph]],'#ffffffbb',1);line([[left,hover.y],[left+pw,hover.y]],'#ffffffbb',1);ctx.restore()}
 },[result,view,picks,selected,grid,crosshair,showPicks,showFit,zoom,pan,palette,size,hover])
 const point=(event:React.PointerEvent<HTMLCanvasElement>)=>{const box=event.currentTarget.getBoundingClientRect(),x=(event.clientX-box.left)/box.width*size.w,y=(event.clientY-box.top)/box.height*size.h;if(x<left||x>left+pw||y<top||y>top+ph)return null;return {pixel:{x,y},value:{f:start+(x-left)/pw*(end-start),c:p.cmax-(y-top)/ph*(p.cmax-p.cmin)}}}
 return <div className="spac-figure" ref={host}><canvas ref={canvasRef} role="img" aria-label={view==='频散能量'?'SPAC 频散能量图，可用工具栏数值拾取添加点':view+'图'} tabIndex={0} style={{cursor:view==='频散能量'?(mode==='delete'?'not-allowed':mode==='add'?'crosshair':'default'):'default'}} onPointerMove={e=>{if(view!=='频散能量')return;const v=point(e);setHover(v?.pixel||null);onCursor(v?.value||null)}} onPointerLeave={()=>{setHover(null);onCursor(null)}} onClick={e=>{if(view!=='频散能量')return;const v=point(e as unknown as React.PointerEvent<HTMLCanvasElement>);if(v)onPoint(v.value)}}/>{view==='频散能量'&&mode!=='inspect'&&<span className="spac-plot-hint">{mode==='add'?'单击图面添加拾取点':'单击拾取点删除'}</span>}</div>
}
