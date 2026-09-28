/** Isolated SPAC UI sample. Synthetic autocorrelation input, not a field-data processor.
 * rho(f,r) = J0(2*pi*f*r/c); see https://geopsy.org/wiki/index.php/Ambient_vibration_array
 * The companion synthetic waveforms are for preview, NOT the input used by this scan.
 */
export const spacDatasets = [
 {id:'SPAC-A01',name:'环形台阵 A01',channels:7,sampleRate:128,duration:120,radii:[12,24,36],seed:1},
 {id:'SPAC-A02',name:'环形台阵 A02',channels:10,sampleRate:128,duration:180,radii:[15,30,45],seed:2},
] as const
export interface SpacParams {fmin:number;fmax:number;cmin:number;cmax:number;step:number;window:number;smooth:number;detrend:boolean;normalize:boolean}
export interface SpacRequest {dataset:string;params:SpacParams}
export interface SpacPick {f:number;c:number}
export interface SpacResult {request:SpacRequest;frequencies:number[];velocities:number[];correlations:number[][];energy:number[][];ridge:SpacPick[];waveforms:number[][];version:string}
export const spacDefaults:SpacParams={fmin:2,fmax:30,cmin:100,cmax:1000,step:5,window:20,smooth:3,detrend:true,normalize:true}
export const spacSource='内置合成校验数据；频散图由合成自相关系数与 J₀ 模型匹配得到。波形为配套预览，不是该扫描的现场输入，不构成工程结论。'
const linspace=(a:number,b:number,n:number)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1))
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
// Periodic quadrature of the integral definition. 256 samples resolve this sample's domain.
const angles=Array.from({length:256},(_,i)=>Math.cos(Math.PI*(i+.5)/256))
export const besselJ0=(x:number)=>angles.reduce((sum,t)=>sum+Math.cos(x*t),0)/angles.length
export function validateSpac(request:SpacRequest){
 const p=request.params
 if(!spacDatasets.some(d=>d.id===request.dataset))throw Error('请选择内置台阵数据。')
 if(!p||['fmin','fmax','cmin','cmax','step','window','smooth'].some(k=>!Number.isFinite(p[k as keyof SpacParams])))throw Error('参数必须为有限数值。')
 if(p.fmin<1||p.fmax>40||p.fmin>=p.fmax)throw Error('频率范围须在 1–40 Hz 内，且下限小于上限。')
 if(p.cmin<80||p.cmax>1500||p.cmin>=p.cmax)throw Error('速度范围须在 80–1500 m/s 内，且下限小于上限。')
 if(p.step<2||p.step>30)throw Error('速度步长须在 2–30 m/s 内。')
 if(p.window<5||p.window>60)throw Error('窗口长度须在 5–60 s 内。')
 if(!Number.isInteger(p.smooth)||p.smooth<1||p.smooth>9)throw Error('平滑点数须为 1–9 的整数。')
 if(typeof p.detrend!=='boolean'||typeof p.normalize!=='boolean')throw Error('预处理配置无效。')
}
export function computeSpac(request:SpacRequest,onProgress?:(value:number)=>void):SpacResult{
 validateSpac(request)
 const data=spacDatasets.find(d=>d.id===request.dataset)!,p=request.params
 const frequencies=linspace(p.fmin,p.fmax,145),velocities=linspace(p.cmin,p.cmax,Math.ceil((p.cmax-p.cmin)/p.step)+1)
 const truth=(f:number)=>190+data.seed*25+(540+data.seed*35)*Math.exp(-f/(5.5+data.seed*.65))+32*Math.exp(-1*((f-19)/4)**2)
 const correlations=data.radii.map((r,ring)=>{
  const raw=frequencies.map((f,i)=>clamp(besselJ0(2*Math.PI*f*r/truth(f))+.015*Math.sqrt(p.window/20)*(Math.sin(i*1.7+ring*2+data.seed)+.5*Math.cos(i*.71+ring)),-1,1))
  return raw.map((_,i)=>{const start=Math.max(0,i-Math.floor(p.smooth/2)),end=Math.min(raw.length,i+Math.ceil(p.smooth/2));return raw.slice(start,end).reduce((a,b)=>a+b,0)/(end-start)})
 })
 const energy=velocities.map(()=>Array<number>(frequencies.length)),ridge:SpacPick[]=[]
 for(let col=0;col<frequencies.length;col++){
  let best=0,bestError=Infinity
  velocities.forEach((c,row)=>{const error=data.radii.reduce((sum,r,k)=>sum+(besselJ0(2*Math.PI*frequencies[col]*r/c)-correlations[k][col])**2,0)/data.radii.length;energy[row][col]=Math.exp(-error/.0045);if(error<bestError){bestError=error;best=row}})
  ridge.push({f:frequencies[col],c:velocities[best]})
  if(col%8===0)onProgress?.(Math.round((col+1)/frequencies.length*100))
 }
 const waveforms=Array.from({length:data.channels},(_,ch)=>{
  let wave=linspace(0,8,1025).map(t=>[2.7,4.2,6.8,11.3,17.5].reduce((s,f,k)=>s+Math.sin(t*2*Math.PI*f+ch*.38+data.seed*k)/(k+1),0)+.16*Math.sin(t*41+ch)+.075*t)
  if(p.detrend){const mean=wave.reduce((s,v)=>s+v,0)/wave.length,mx=(wave.length-1)/2,slope=wave.reduce((s,v,i)=>s+(i-mx)*(v-mean),0)/wave.reduce((s,_,i)=>s+(i-mx)**2,0);wave=wave.map((v,i)=>v-mean-slope*(i-mx))}
  if(p.normalize){const max=Math.max(...wave.map(Math.abs));wave=wave.map(v=>v/max)}
  return wave
 })
 onProgress?.(100)
 return {request:JSON.parse(JSON.stringify(request)),frequencies,velocities,correlations,energy,ridge,waveforms,version:'spac-sample-1'}
}
export function energyAt(result:SpacResult,pick:SpacPick){const p=result.request.params,x=clamp(Math.round((pick.f-p.fmin)/(p.fmax-p.fmin)*(result.frequencies.length-1)),0,result.frequencies.length-1),y=clamp(Math.round((pick.c-p.cmin)/(p.cmax-p.cmin)*(result.velocities.length-1)),0,result.velocities.length-1);return result.energy[y][x]}
export function fitSpacPicks(picks:SpacPick[]):SpacPick[]{
 if(picks.length<3)return []
 const rows=picks.map(p=>[1,Math.log(p.f),Math.log(p.f)**2]),matrix=Array.from({length:3},(_,i)=>[...Array.from({length:3},(_,j)=>rows.reduce((s,r)=>s+r[i]*r[j],0)),rows.reduce((s,r,k)=>s+r[i]*picks[k].c,0)])
 for(let i=0;i<3;i++){let pivot=i;for(let j=i+1;j<3;j++)if(Math.abs(matrix[j][i])>Math.abs(matrix[pivot][i]))pivot=j;[matrix[i],matrix[pivot]]=[matrix[pivot],matrix[i]];if(Math.abs(matrix[i][i])<1e-9)return [];const d=matrix[i][i];matrix[i]=matrix[i].map(v=>v/d);for(let j=0;j<3;j++)if(j!==i){const scale=matrix[j][i];matrix[j]=matrix[j].map((v,k)=>v-scale*matrix[i][k])}}
 return linspace(Math.min(...picks.map(p=>p.f)),Math.max(...picks.map(p=>p.f)),100).map(f=>({f,c:matrix[0][3]+matrix[1][3]*Math.log(f)+matrix[2][3]*Math.log(f)**2}))
}
export function addSpacPick(picks:SpacPick[],pick:SpacPick){return [...picks.filter(p=>Math.abs(p.f-pick.f)>.025),{f:+pick.f.toFixed(3),c:+pick.c.toFixed(2)}].sort((a,b)=>a.f-b.f).slice(0,300)}
export function validateSpacPicks(picks:unknown,request:SpacRequest):SpacPick[]{if(!Array.isArray(picks)||picks.length>300)throw Error('拾取记录无效。');const p=request.params;return picks.map(v=>{if(!v||!Number.isFinite(v.f)||!Number.isFinite(v.c)||v.f<p.fmin||v.f>p.fmax||v.c<p.cmin||v.c>p.cmax)throw Error('拾取点超出配置范围。');return {f:v.f,c:v.c}})}
