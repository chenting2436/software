/** Adjacent strata share one boundary; no intersecting, coplanar side faces. */
export const slopeSurface = [[-79,35],[-18,35],[9,18],[32,-3],[80,-3]] as const
export const slopeLayers = [
 {offset:0,thickness:14,color:'#a8b8aa'},
 {offset:-14,thickness:15,color:'#849891'},
 {offset:-29,thickness:16,color:'#587777'},
 {offset:-45,thickness:22,color:'#365663'},
]
export function slopeBand(offset:number,thickness:number):[number,number][]{
 const upper=slopeSurface.map(([x,y])=>[x,y+offset] as [number,number])
 const lower=slopeSurface.map(([x,y])=>[x,y+offset-thickness] as [number,number]).reverse()
 return [...upper,...lower]
}
