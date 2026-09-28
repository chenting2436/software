export interface BoardItem { id: string; kind: string }
export interface BoardPage { id: string; name: string; items: BoardItem[]; primary: string }
export interface BoardDocument { version: 4; name: string; ratio: '16:9'|'21:9'; pages: BoardPage[]; context?:{device:string;frame:number} }
export interface Tile { x: number; y: number; w: number; h: number; item: BoardItem; variant: '主视'|'横向'|'标准'|'摘要' }
export const BOARD_KEY='kuangda-board-v4'
export const BOARD_DRAFT_KEY='kuangda-board-draft-v4'
export const PAGE_LIMIT=12
export const boardTemplates:Record<string,string[]>={
 '综合监测':['siteMap','deviceLedger','waveform','deviceOnline','quality','riskSummary','algorithmStatus','historyPlayback','riskReport'],
 '设备运行':['mineDigitalTwin','satelliteTwin','droneTwin','roverTwin','deepTwin','deviceOnline','gnssTwin','microTwin','daqTwin','missionReplay'],
 '算法分析':['microseismic3d','algorithm-taup','algorithm-hvsr','algorithm-surface-inversion','algorithm-ps-pick','algorithm-moment-tensor','algorithm-fracture-network','algorithm-gnss-prediction','algorithm-multi-risk','algorithmStatus','evidenceReplay','quality'],
}
export const makePage=(name='综合监测'):BoardPage=>({id:crypto.randomUUID(),name,items:(boardTemplates[name]||[]).map(kind=>({id:crypto.randomUUID(),kind})),primary:boardTemplates[name]?.[0]||''})
export const newBoard=():BoardDocument=>({version:4,name:'综合监测',ratio:'16:9',pages:[makePage()]})
type Rect=[number,number,number,number]
const row=(count:number,y:number,h:number,x=0,width=12):Rect[]=>Array.from({length:count},(_,i)=>[x+i*width/count,y,width/count,h])
// Fully tiled, curated rectangles. No free resize, holes, overlap or runtime packing randomness.
export function boardRects(count:number):Rect[]{
 if(count<1||count>PAGE_LIMIT)return []
 if(count===1)return [[0,0,12,12]]
 if(count===2)return row(2,0,12)
 if(count===3)return [[0,0,8,12],...row(1,0,6,8,4),...row(1,6,6,8,4)]
 if(count===4)return [...row(2,0,6),...row(2,6,6)]
 if(count===5)return [...row(2,0,6),...row(3,6,6)]
 const head:Rect[]=[[0,0,6,6],[6,0,6,3],[6,3,6,3]]
 if(count===6)return [...head,...row(3,6,6)]
 if(count===7)return [...head,...row(4,6,6)]
 if(count===8)return [...head,...row(3,6,3),...row(2,9,3)]
 if(count===9)return [...head,...row(3,6,3),...row(3,9,3)]
 if(count===11)return [...head,...row(4,6,3),...row(4,9,3)]
 const more:Rect[]=[[0,0,6,6],...row(2,0,3,6,6),...row(2,3,3,6,6)]
 return count===10?[...more,...row(3,6,3),...row(2,9,3)]:[...more,...row(4,6,3),...row(3,9,3)]
}
export function arrangeBoard(page:BoardPage):Tile[]{
 const items=[...page.items],p=items.findIndex(i=>i.kind===page.primary)
 if(p>0)items.unshift(...items.splice(p,1))
 return boardRects(items.length).map(([x,y,w,h],i)=>({x,y,w,h,item:items[i],variant:w>=6&&h>=6?'主视':w>=6?'横向':w>=4?'标准':'摘要'}))
}
export function reorderBoard(page:BoardPage,source:string,target:string):BoardPage{
 if(source===target)return page
 const items=[...page.items],a=items.findIndex(i=>i.id===source),b=items.findIndex(i=>i.id===target)
 if(a<0||b<0)return page
 ;[items[a],items[b]]=[items[b],items[a]]
 return {...page,items,primary:page.primary===items[b].kind?items[a].kind:page.primary===items[a].kind?items[b].kind:page.primary}
}
export function normalizeBoard(raw:unknown,valid:Set<string>):BoardDocument|null{
 if(!raw||typeof raw!=='object')return null
 const obj=raw as Partial<BoardDocument>
 if(obj.version!==4||!Array.isArray(obj.pages))return null
 const pages:BoardPage[]=[]
 for(const p of obj.pages){if(!p||!Array.isArray(p.items))continue;const seen=new Set<string>();const items=p.items.filter(i=>i&&valid.has(i.kind)&&!seen.has(i.kind)&&!!seen.add(i.kind)).map(i=>({kind:i.kind,id:typeof i.id==='string'?i.id:crypto.randomUUID()}));
  for(let start=0;start<Math.max(1,items.length);start+=PAGE_LIMIT){const chunk=items.slice(start,start+PAGE_LIMIT);pages.push({id:typeof p.id==='string'&&!start&&!pages.some(n=>n.id===p.id)?p.id:crypto.randomUUID(),name:String(p.name||'监测屏')+(start?` / ${start/PAGE_LIMIT+1}`:''),items:chunk,primary:chunk.some(i=>i.kind===p.primary)?p.primary:chunk[0]?.kind||''})}
 }
 return pages.length?{version:4,name:String(obj.name||'矿大综合监测'),ratio:obj.ratio==='21:9'?'21:9':'16:9',pages,...(obj.context&&typeof obj.context.device==='string'&&Number.isFinite(obj.context.frame)?{context:{device:obj.context.device,frame:Math.max(0,Math.min(120,obj.context.frame))}}:{})}:null
}
export function migrateBoard(raw:unknown,valid:Set<string>):BoardDocument|null{
 if(!Array.isArray(raw))return null
 const legacy=[...raw].filter(i=>i&&typeof i.kind==='string').sort((a,b)=>(Number(a.y)||0)-(Number(b.y)||0)||(Number(a.x)||0)-(Number(b.x)||0))
 return normalizeBoard({version:4,name:'矿大 · 已迁移监测屏',ratio:'16:9',pages:[{name:'原布局组件',primary:legacy[0]?.kind,items:legacy.map(i=>({id:i.uid,kind:i.kind}))}]},valid)
}
// Display-only aliases: never rewrite a user's saved layout, names or component IDs.
export function boardDisplayName(name:string){return ['矿大 · 已迁移监测屏','矿大 · 北帮边坡综合监测'].includes(name)?'综合监测':name}
export function pageDisplayName(name:string){return name.replace(/^原布局组件/,'监测')}
