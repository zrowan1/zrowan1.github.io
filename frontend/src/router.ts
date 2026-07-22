import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
    { path: '/', name: 'vandaag', component: () => import('./views/VandaagView.vue') },
    { path: '/verdeling', name: 'verdeling', component: () => import('./views/VerdelingView.vue') },
    { path: '/koken', name: 'koken', component: () => import('./views/KokenView.vue') },
    { path: '/boodschappen', name: 'boodschappen', component: () => import('./views/BoodschappenView.vue') },
    { path: '/stats', name: 'stats', component: () => import('./views/StatsView.vue') },
    { path: '/instellingen', name: 'instellingen', component: () => import('./views/InstellingenView.vue') },
  ],
});

// Auth guard: everything except /login requires a session.
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.fetchMe();
  if (to.name !== 'login' && !auth.isLoggedIn) return { name: 'login' };
  if (to.name === 'login' && auth.isLoggedIn) return { name: 'vandaag' };
  return true;
});

export default router;
