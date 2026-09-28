import {computeAnalysis,type AnalysisRequest} from './analysisEngine'
self.onmessage=(event:MessageEvent<{request:AnalysisRequest;token:number}>)=>{const {request,token}=event.data;try{self.postMessage({token,result:computeAnalysis(request)})}catch(error){self.postMessage({token,error:error instanceof Error?error.message:String(error)})}}
