/** Deterministic synthetic observation channels; never replace saved packet snapshots. */
const pulse=(t:number,center:number,width:number)=>Math.exp(-1*((t-center)/width)**2)
const step=(t:number,center:number,width:number)=>1/(1+Math.exp(-(t-center)/width))
export function observationValue(type:string,index:number,frame:number):number{
 const t=Math.max(0,frame),phase=index*.73
 const ripple=Math.sin(t*.31+phase)+.37*Math.sin(t*.87+phase*1.9)+.19*Math.cos(t*1.71+phase)
 if(type.includes('微震'))return .025+index*.0015+.014*Math.abs(ripple)+.19*pulse(t,32+index%7,4)*(.5+.5*Math.sin(t*1.7)**2)+.31*pulse(t,78-index%9,6)*(.45+.55*Math.cos(t*1.2)**2)+.12*pulse(t,102,2.4)
 if(type==='数采板')return 38+index*.09+2.3*Math.sin(t*.038+phase)+.34*ripple+1.2*pulse(t,68,11)
 if(type==='气象站')return Math.max(0,.06*Math.abs(ripple)+3.2*pulse(t,29+index%9,6)+5.4*pulse(t,74,13)+1.7*pulse(t,109,4))
 if(type==='巡检无人机')return 126+6*Math.sin(t/17)+2.5*Math.sin(t/5)+.45*ripple
 if(type==='雷达巡检车')return Math.max(.2,3+.8*Math.sin(t/18)+.23*ripple-1.8*pulse(t,66,5))
 if(type==='遥感卫星')return Math.min(100,t/120*100)
 if(type==='深地感知站')return observationValue('微震节点',index%12,t)*1.6
 return 4+index*.7+t*.038+.26*ripple+.7*Math.sin(t*.08+phase)+1.1*step(t,42+index%6,1.8)+1.8*step(t,86-index%9,3)+.003*Math.max(0,t-92)**2
}

/** New named input record. The old GNSS-24H dataset remains byte-for-byte reproducible. */
export function gnssObservationV2(i:number){
 return 2.8+i*.08+.75*Math.sin(i*.39)+.28*Math.sin(i*1.19)+.12*Math.cos(i*2.31)
  +1.2*step(i,16,.6)+2.1*pulse(i,25,2)+2.3*step(i,33,1)+.035*Math.max(0,i-39)**2
}
