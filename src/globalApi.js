import { mergeOptions } from './utils'

export function initGlobalAPI(Vue) {
  // 静态方法
  Vue.options = {}

  Vue.mixin = function(mixin) {
    this.options = mergeOptions(this.options, mixin)
  }
}
