import Vue from 'vue'
import App from './App.vue'
import VueRouter from '../../vue-router'
import Home from './Home.vue'
import About from './About.vue'

Vue.config.productionTip = false

Vue.use(VueRouter)

const routers = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: 'a',
        component: { render: h => <h1>a</h1> }
      },
      {
        path: 'b',
        component: { render: h => <h1>b</h1> }
      }
    ]
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    children: [
      {
        path: 'a',
        component: { render: h => <h1>aa</h1> }
      },
      {
        path: 'b',
        component: { render: h => <h1>bb</h1> }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: '/',
  routers
})

router.beforeEach((from, to, next) => {
  setTimeout(() => {
    console.log(1)
    next()
  }, 1000)
})
router.beforeEach((from, to, next) => {
  setTimeout(() => {
    console.log(2)
    next()
  }, 1000)
})

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
