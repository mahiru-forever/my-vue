import routerLink from './components/router-link'
import routerView from './components/router-view'

export let Vue

export default function install(_Vue) {
  Vue = _Vue

  Vue.mixin({
    beforeCreate() {
      // 组件渲染从父到子
      if (this.$options.router) {
        // 根实例
        this._routerRoot = this
        this._router = this.$options.router

        // 初始化，只执行一次
        this._router.init(this)

        // 给根实例添加一个属性，_route 就是当前的current对象
        // 此处不能用Vue.set，因为set方法不能给Vue实例属性
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 所有实例都能拿到根实例
        this._routerRoot = this.$parent && this.$parent._routerRoot
      }
    }
  })

  // 实例上通过 $router 取值
  Object.defineProperty(Vue.prototype, '$router', {
    get() {
      return this._routerRoot && this._routerRoot._router
    }
  })

  // 所有组件都有一个 $route 属性，对应history里写的current属性
  Object.defineProperty(Vue.prototype, '$route', {
    get() {
      return this._routerRoot && this._routerRoot._route
    }
  })

  Vue.component('router-link', routerLink)

  Vue.component('router-view', routerView)
}
