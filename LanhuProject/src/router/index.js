import Vue from 'vue'
import VueRouter from 'vue-router'
import lanhu_dapinggnssjizhanjiankongjiemian from '../views/lanhu_dapinggnssjizhanjiankongjiemian/index.vue'
import lanhu_dapingshouye from '../views/lanhu_dapingshouye/index.vue'
import lanhu_dengluye from '../views/lanhu_dengluye/index.vue'
import lanhu_dapinggnssjizhanjiankongjiemian_1 from '../views/lanhu_dapinggnssjizhanjiankongjiemian_1/index.vue'
import lanhu_dapingjizhunzhanshujuzhanshi from '../views/lanhu_dapingjizhunzhanshujuzhanshi/index.vue'

Vue.use(VueRouter)

const routes = [
    {
    path: '/',
    redirect: "/lanhu_dapinggnssjizhanjiankongjiemian"
  },
  {
    path: '/lanhu_dapinggnssjizhanjiankongjiemian',
    name: 'lanhu_dapinggnssjizhanjiankongjiemian',
    component: lanhu_dapinggnssjizhanjiankongjiemian
  },
  {
    path: '/lanhu_dapingshouye',
    name: 'lanhu_dapingshouye',
    component: lanhu_dapingshouye
  },
  {
    path: '/lanhu_dengluye',
    name: 'lanhu_dengluye',
    component: lanhu_dengluye
  },
  {
    path: '/lanhu_dapinggnssjizhanjiankongjiemian_1',
    name: 'lanhu_dapinggnssjizhanjiankongjiemian_1',
    component: lanhu_dapinggnssjizhanjiankongjiemian_1
  },
  {
    path: '/lanhu_dapingjizhunzhanshujuzhanshi',
    name: 'lanhu_dapingjizhunzhanshujuzhanshi',
    component: lanhu_dapingjizhunzhanshujuzhanshi
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
