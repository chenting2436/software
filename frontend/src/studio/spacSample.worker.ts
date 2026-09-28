import {computeSpac,type SpacRequest} from './spacSampleEngine'
self.onmessage=(event:MessageEvent<SpacRequest>)=>{try{const result=computeSpac(event.data,value=>self.postMessage({progress:value}));self.postMessage({result})}catch(error){self.postMessage({error:String(error instanceof Error?error.message:error)})}}
