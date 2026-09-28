import {renderToStaticMarkup} from 'react-dom/server'
import {AnalysisFigure} from './AnalysisFigure'
import type {AnalysisOutput} from './analysisEngine'
import {escapeHTML} from './store'
export function renderAnalysisFigures(result:AnalysisOutput){
 return result.figures.map(f=>`<section><h2>${escapeHTML(f.title)}</h2>${renderToStaticMarkup(<AnalysisFigure figure={f} compact exporting/>)}${f.kind==='geometry'?'<small>空间结构为二维索引示意；完整三维视图请在工作站打开。</small>':''}${f.labels?.length?`<p style="font-size:11px;color:#657b8c">图例：${f.labels.map(escapeHTML).join(' / ')}</p>`:''}</section>`).join('')
}
