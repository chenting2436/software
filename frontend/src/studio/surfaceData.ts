import type {Figure} from './analysisEngine'

export function sampleEnergySurface(figure:Figure,x:number,y:number){
 const matrix=figure.matrix
 if(!matrix?.length||!matrix[0]?.length)throw new Error('能量矩阵为空')
 const nx=Math.max(0,Math.min(1,x)),ny=Math.max(0,Math.min(1,y)),range=figure.range||[1,32.5,100,900]
 const row=Math.round(ny*(matrix.length-1)),col=Math.round(nx*(matrix[0].length-1))
 return {row,col,frequency:range[0]+nx*(range[1]-range[0]),velocity:range[2]+ny*(range[3]-range[2]),energy:matrix[row][col],cursor:nx}
}
