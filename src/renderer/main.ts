import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

/// <reference types="../preload" />
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')

declare global {
    interface Window {
        electron: GlobElectron
    }
}