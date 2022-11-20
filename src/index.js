import { initMixin } from './init'
import { initLifecycle } from './lifecycle'
import { nextTick } from './observe/watcher'
import { initGlobalAPI } from './globalApi'

// 用构造函数而不用class（避免所有方法耦合在一起）
function Vue(options) {
  this._init(options)
}

Vue.prototype.$nextTick = nextTick
initMixin(Vue) // 扩展init方法
initLifecycle(Vue)
initGlobalAPI(Vue)

export default Vue
