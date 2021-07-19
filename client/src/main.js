import { createApp } from 'vue'
import App from './App.vue'
import installElementPlus from './plugins/element'
import store from './store'
import router from './router'

const app = createApp(App).use(router).use(store)
installElementPlus(app)
app.mount('#app')