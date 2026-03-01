import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

/// <reference types="../preload" />
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')

function applyTheme(isDark: boolean) {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
}

window.electron.theme.isDark().then(applyTheme);
window.electron.theme.onChange((_event, isDark) => applyTheme(isDark));

declare global {
    interface Window {
        electron: GlobElectron
    }
}