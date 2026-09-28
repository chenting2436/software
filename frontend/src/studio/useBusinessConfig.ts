import {useState} from 'react'
import {useDemo,now,type Domain,type RecordItem} from './store'

/** Keep typed local configurations alongside, not in place of, older records. */
export function useBusinessConfig<T>(kind:string,id:string,initial:T,domain:Domain,valid:(v:unknown)=>v is T){
 const {state,can,update}=useDemo(),saved=state.records[kind]?.find(r=>r.id===id)
 const [value,setValue]=useState<T>(()=>{try{const parsed=JSON.parse(saved?.values[3]||'null');if(valid(parsed))return parsed}catch{}return initial})
 const [notice,setNotice]=useState('')
 const save=(next:T=value,description='保存配置')=>{if(!can(domain))return;if(!valid(next)){setNotice('配置校验未通过');return}setValue(next);update(domain,description,id,s=>{const records=s.records[kind]||[],old=records.find(r=>r.id===id),record:RecordItem={id,values:[id,kind,description,JSON.stringify(next)],version:(old?.version||0)+1,status:'本地生效',updated:now(),history:[`${now()} / ${description}`,...(old?.history||[])].slice(0,40)};return {...s,records:{...s.records,[kind]:[record,...records.filter(r=>r.id!==id)]}}});setNotice('已保存')}
 return {value,setValue,save,notice,setNotice,allowed:can(domain),version:saved?.version||0,history:saved?.history||[],dirty:JSON.stringify(value)!==(saved?.values[3]||JSON.stringify(initial))}
}
