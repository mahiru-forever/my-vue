import install, { Vue } from './install'
import createMatcher from './create-matcher'
import HashHistory from './history/hash'
import BrowserHistory from './history/history'

class VueRouter {
  constructor(options) {
    let routers = options.routers || []
    this.beforeEachHooks = []
    this.afterEachHooks = []
    // 根据路由配置生成映射表（可以匹配，也可以添加新的路由）
    this.matcher = createMatcher(routers)

    // 根据不同的模式创建对应的路由系统
    let mode = options.mode || 'hash'
    if (mode === 'hash') {
      this.history = new HashHistory(this) // hashchange
    } else if (mode === 'history') {
      this.history = new BrowserHistory(this) // popstate
    }
  }

  match(location) {
    return this.matcher.match(location)
  }

  push(location) {
    // 跳转逻辑，但没有改变路径
    this.history.transitonTo(location, () => {
      this.history.jump(location)
    })
  }

  beforeEach(cb) {
    this.beforeEachHooks.push(cb)
  }

  afterEach(cb) {
    this.afterEachHooks.push(cb)
  }

  init(app) {
    const history = this.history

    // 根据路径的变化匹配对应的组件进行渲染，路径变化了需要视图更新（响应式）
    // 根据路径匹配到对应组件进行渲染，之后监听路由变化
    history.transitonTo(history.getCurrentLocation(), () => {
      history.setupListener() // 监听路由变化
    })

    // 每次路由切换都要调用listen的回调，实现更新
    history.listen(newRoute => {
      app._route = newRoute
    })
  }
}

// 1）将用户配置进行映射
// 2）将根实例注入的router属性共享给每个组件

VueRouter.install = install

export default VueRouter
