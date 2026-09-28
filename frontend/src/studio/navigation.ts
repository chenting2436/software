export interface WorkspaceRoute {page:string; id?:string; device?:string; dataset?:string; task?:string; tab?:string; frame?:string; snapshot?:string}
const pages=new Set(['overview','device','data','algorithm','trace','designer','preview','risk','solution','library','workflow','account','config','workspace'])
export function parseRoute(hash:string):WorkspaceRoute {
 if(hash==='#dashboard')return {page:'preview'}
 const [path,query='']=hash.replace(/^#\/?/,'').split('?'),[raw,id]=path.split('/'),params=new URLSearchParams(query)
 const result:WorkspaceRoute={page:pages.has(raw)?raw:'overview'}
 try{if(id)result.id=decodeURIComponent(id)}catch{/* Invalid bookmark falls back to its page. */}
 for(const key of ['device','dataset','task','tab','frame','snapshot'] as const){const value=params.get(key);if(value)result[key]=value}
 return result
}
export function routeHash(route:WorkspaceRoute){const q=new URLSearchParams();for(const k of ['device','dataset','task','tab','frame','snapshot'] as const)if(route[k])q.set(k,route[k]!);return `#/${route.page}${route.id?'/'+encodeURIComponent(route.id):''}${q.size?'?'+q:''}`}
export function goWorkspace(route:WorkspaceRoute){if(typeof window==='undefined')return;window.dispatchEvent(new CustomEvent('kuangda:navigate',{detail:route}))}
export function moduleRoute(kind:string):WorkspaceRoute {
 if(kind.startsWith('algorithm-'))return {page:'algorithm',id:kind.slice(10)}
 const algorithms:Record<string,string>={waveform:'ps-pick',dispersion:'taup',hvsrCurve:'hvsr',inversionProfile:'section-imaging',microseismic3d:'event-location',riskTrend:'multi-risk',trend:'gnss-prediction'}
 if(algorithms[kind])return {page:'algorithm',id:algorithms[kind]}
 return {page:'workspace',id:kind}
}
