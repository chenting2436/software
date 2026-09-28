import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteStaticCopy} from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), viteStaticCopy({targets:['Workers','ThirdParty','Assets','Widgets'].map(folder=>({src:`node_modules/cesium/Build/Cesium/${folder}`,dest:'cesium',rename:{stripBase:4}}))})],
  define: { CESIUM_BASE_URL: JSON.stringify('./cesium/') },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
})
