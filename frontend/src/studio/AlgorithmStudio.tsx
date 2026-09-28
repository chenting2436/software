import {useMemo} from 'react'
import {AnalysisFigure} from './AnalysisFigure'
import {computeAnalysis,defaultDataset,defaultParams} from './analysisEngine'
export {AlgorithmLab as AlgorithmStudio} from './AlgorithmLab'
export function SciencePlot({id,compact=false,compare=false,onPick}:{id:string;compact?:boolean;scale?:number;overlay?:boolean;compare?:boolean;picks?:number[];onPick?:(n:number)=>void}){
 const output=useMemo(()=>computeAnalysis({id,dataset:defaultDataset(id),params:defaultParams(id),excluded:[]}),[id]);return <div className="science-plot lab-compact"><AnalysisFigure figure={output.figures[0]} compact={compact} compare={compare} onCursor={onPick}/></div>
}
