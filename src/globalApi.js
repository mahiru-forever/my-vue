import { mergeOptions } from './utils'

export function initGlobalAPI(Vue) {
  // 静态方法
  Vue.options = {
    _base: Vue
  }

  Vue.mixin = function(mixin) {
    this.options = mergeOptions(this.options, mixin)
  }

  // 可以手动创建组件，并挂载
  // data必须是个函数，_init会执行mergeOptions方法，如果是对象的话（引用类型），组件重复创建data数据会被共享
  Vue.extend = function(options) {
    // 最终使用一个组件，就是new一个实例
    function Sub(options = {}) {
      // 默认对子类进行初始化操作
      this._init(options)
    }
    // 子类继承Vue
    Sub.prototype = Object.create(Vue.prototype)
    Sub.prototype.constructor = Sub // 需要重新指定一下constructor，不然constructor值是Vue

    // 保存传入的配置项，将用户配置项与全局配置项合并
    Sub.options = mergeOptions(Vue.options, options)

    return Sub
  }

  Vue.component = function(id, definition) {
    if (!Vue.options.components) {
      Vue.options.components = {}
    }
    Vue.options.components[id] =
      typeof definition === 'function' ? definition : Vue.extend(definition)
  }
}
