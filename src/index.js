import { initMixin } from './init'
import { initLifecycle } from './lifecycle'
import Watcher, { nextTick } from './observe/watcher'
import { initGlobalAPI } from './globalApi'

// 用构造函数而不用class（避免所有方法耦合在一起）
function Vue(options) {
  this._init(options)
}

Vue.prototype.$nextTick = nextTick
initMixin(Vue) // 扩展init方法
initLifecycle(Vue)
initGlobalAPI(Vue)

// $watch的监听不会立即执行，多次修改值只会执行一次（watcher中的异步队列）
Vue.prototype.$watch = function(exprOrFn, cb, options = {}) {
  new Watcher(
    this,
    exprOrFn,
    {
      usr: true,
      ...options
    },
    cb
  )
}

export default Vue
