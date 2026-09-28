import {cinematicHeight} from './cinematicTerrain'

/** Marching squares over the same authored height field as the surface. */
export function terrainContours(step=20){
 const segments:number[]=[]
 const extent=820
 for(let level=-60;level<=220;level+=20){
  for(let x=-extent;x<extent;x+=step)for(let z=-extent;z<extent;z+=step){
   const corners=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]]
   const h=corners.map(([cx,cz])=>cinematicHeight(cx,cz))
   const intersections:[number,number][]=[]
   for(let i=0;i<4;i++){
    const j=(i+1)%4
    if((h[i]<level)===(h[j]<level))continue
    const t=(level-h[i])/(h[j]-h[i])
    intersections.push([corners[i][0]+(corners[j][0]-corners[i][0])*t,corners[i][1]+(corners[j][1]-corners[i][1])*t])
   }
   for(let i=0;i+1<intersections.length;i+=2){
    // Drape the contour onto the actual field to avoid sinking into steep faces.
    const a=intersections[i],b=intersections[i+1]
    for(let n=0;n<4;n++)for(const t of [n/4,(n+1)/4]){
     const px=a[0]+(b[0]-a[0])*t,pz=a[1]+(b[1]-a[1])*t
     segments.push(px,cinematicHeight(px,pz)+1.2,pz)
    }
   }
  }
 }
 return segments
}
