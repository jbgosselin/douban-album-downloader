import { fileURLToPath, URL } from 'node:url'
import { UserConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const config: UserConfig = {
  main: {},
  preload: {},
  renderer: {
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src/renderer', import.meta.url))
      }
    }
  },
}

export default config
