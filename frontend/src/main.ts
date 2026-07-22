import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './styles.css';
import { useUiStore } from './stores/ui';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Apply persisted dark-mode before first paint.
useUiStore().applyDarkMode();

app.mount('#app');
