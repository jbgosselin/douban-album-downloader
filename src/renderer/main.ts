import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

import { createApp } from 'vue'
import App from './App.vue'
import { bridge } from './tauri-bridge'

const app = createApp(App)

app.mount('#app')

function applyTheme(isDark: boolean) {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
}

bridge.theme.isDark().then(applyTheme);
bridge.theme.onChange(applyTheme);
