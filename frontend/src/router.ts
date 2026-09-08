import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import NewGameView from './views/NewGameView.vue'
import GameView from './views/GameView.vue'
import RoundView from './views/RoundView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Flip 7' } },
    { path: '/games/new', name: 'new', component: NewGameView, meta: { title: 'Neues Spiel' } },
    { path: '/games/:id', name: 'game', component: GameView, meta: { title: 'Spiel' } },
    { path: '/games/:id/round', name: 'round', component: RoundView, meta: { title: 'Runde' } },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
