import { initMixin } from './init'
import { initLifecycle } from './lifecycle'
import { initGlobalAPI } from './globalApi'
import { initStateMixin } from './state'

// 用构造函数而不用class（避免所有方法耦合在一起）
function Vue(options) {
  this._init(options)
}

initMixin(Vue) // 扩展init方法
initLifecycle(Vue)
initGlobalAPI(Vue)
initStateMixin(Vue)

export default Vue
