import { initState } from './state'
import { compileToFunction } from './compiler/index'
import { mountComponent, callHooks } from './lifecycle'
import { mergeOptions } from './utils'

// 初始化
export function initMixin(Vue) {
  Vue.prototype._init = function(options) {
    const vm = this

    // 将vue全局属性配置项 挂载到实例上
    vm.$options = mergeOptions(this.constructor.options, options)
    // console.log('vue options————', this.$options)

    callHooks(vm, 'beforeCreate')
    // 初始化状态
    initState(vm)
    callHooks(vm, 'created')

    if (options.el) {
      vm.$mount(options.el)
    }
    // todo...
  }

  Vue.prototype.$mount = function(el) {
    const vm = this
    const opts = vm.$options

    el = document.querySelector(el)

    if (!opts.render) {
      let template
      if (!opts.template && el) {
        template = el.outerHTML
      } else {
        // runtime不包含模板编译，编译是打包时通过loader转义.vue文件，所有runtime不能用template配置
        template = opts.template // 有模板优先用模板
      }

      if (template) {
        // 编译模板
        const render = compileToFunction(template)

        opts.render = render // 如果是jsx build时最终编译成h('xxx')
      }
    }

    // 挂载组件
    mountComponent(vm, el)
  }
}
