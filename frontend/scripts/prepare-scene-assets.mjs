// Reproducible, bounded acquisition of public reference media and open DEM data.
// This script generates assets only; it does not edit application source files.
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {PNG} from 'pngjs'
const out=fileURLToPath(new URL('../public/scene-assets/',import.meta.url));await mkdir(out,{recursive:true})
const sources=[
 ['baiyun-ebo.jpg','https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia13/pia13969/PIA13969.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1066&w=1306'],
 ['mine-before.jpg','https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/81000/81364/binghamcanyon_aer_2011201.jpg?crop=faces%2Cfocalpoint&fit=clip&h=480&w=720'],
 ['mine-after.jpg','https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/81000/81364/binghamcanyon_ali_2013122.jpg?crop=faces%2Cfocalpoint&fit=clip&h=480&w=720'],
]
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`${r.status} ${url}`);return Buffer.from(await r.arrayBuffer())}
for(const [name,url] of sources){try{await readFile(out+name)}catch{await writeFile(out+name,await get(url))}console.log(name)}
const bounds={west:109.94,east:110.06,south:41.755,north:41.845},n=129,z=12,cache=new Map()
const tileXY=(lon,lat)=>[(lon+180)/360*2**z,(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**z]
const [x0,y0]=tileXY(bounds.west,bounds.north),[x1,y1]=tileXY(bounds.east,bounds.south)
for(let x=Math.floor(x0);x<=Math.floor(x1);x++)for(let y=Math.floor(y0);y<=Math.floor(y1);y++){const url=`https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`;cache.set(`${x}/${y}`,PNG.sync.read(await get(url)))}
const heights=[];for(let row=0;row<n;row++)for(let col=0;col<n;col++){const lon=bounds.west+(bounds.east-bounds.west)*col/(n-1),lat=bounds.north-(bounds.north-bounds.south)*row/(n-1),[x,y]=tileXY(lon,lat),p=cache.get(`${Math.floor(x)}/${Math.floor(y)}`),i=(Math.min(255,Math.floor((y%1)*256))*256+Math.min(255,Math.floor((x%1)*256)))*4;heights.push(Math.round((p.data[i]*256+p.data[i+1]+p.data[i+2]/256-32768)*10)/10)}
await writeFile(out+'baiyun-dem.json',JSON.stringify({name:'白云鄂博周边 / 公开地形参照',bounds,width:n,height:n,heights,source:'Mapzen / Tilezen Terrain Tiles on AWS; SRTM/GMTED2010 courtesy of USGS',accessed:'2026-09-21',sourceZoom:z,notes:'公开高程重采样，不是现场测绘。设备位置为演示布点。'}))
console.log(`DEM: ${cache.size} tiles, ${n}×${n}, ${Math.min(...heights)}–${Math.max(...heights)} m`)
