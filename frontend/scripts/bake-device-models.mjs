import {build} from 'esbuild'
import {mkdir,writeFile} from 'node:fs/promises'
import {fileURLToPath,pathToFileURL} from 'node:url'
const folder=fileURLToPath(new URL('../public/scene-assets/',import.meta.url));await mkdir(folder,{recursive:true})
const cache=fileURLToPath(new URL('../node_modules/.cache/kuangda-models.mjs',import.meta.url))
await build({entryPoints:[fileURLToPath(new URL('../src/studio/threeModels.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',outfile:cache,external:['three']})
const {createDeviceModel,disposeScene}=await import(pathToFileURL(cache).href)
const {GLTFExporter}=await import('three/examples/jsm/exporters/GLTFExporter.js')
globalThis.FileReader=class {result=null;onloadend=null;async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.()}async readAsDataURL(blob){this.result=`data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;this.onloadend?.()}}
for(const kind of ['satellite','drone','rover','deep']){const model=createDeviceModel(kind);const data=await new GLTFExporter().parseAsync(model.root,{binary:true});await writeFile(folder+kind+'.glb',Buffer.from(data));disposeScene(model.root);console.log(kind,data.byteLength)}
