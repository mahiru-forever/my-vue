import { createTextVNode, createElementVNode } from './vdom/index'
import Watcher from './observe/watcher'
import { patch } from './vdom/patch'

// vue流程
// 1.生成响应式数据
// 2.模板转换成ast
// 3.ast转成render函数
// 4.后续每次更新都通过render函数，无需ast

export function initLifecycle(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    const el = vm.$el

    const prevVnode = vm._vnode
    vm._vnode = vnode // 保存本次的虚拟节点，下一次更新时使用

    if (prevVnode) {
      // 更新
      vm.$el = patch(prevVnode, vnode)
    } else {
      // 初始化
      vm.$el = patch(el, vnode)
    }
  }

  // _c('div', {xxx}, ...children)
  Vue.prototype._c = function() {
    return createElementVNode(this, ...arguments)
  }

  // _v('text')
  Vue.prototype._v = function() {
    return createTextVNode(this, ...arguments)
  }

  // _s(name)
  Vue.prototype._s = function(v) {
    if (typeof v !== 'object') {
      return v
    }
    return JSON.stringify(v)
  }

  Vue.prototype._render = function() {
    const vm = this

    // with中的this指向vm
    const vnode = vm.$options.render.call(vm)
    // console.log('vnode——', vnode)

    // 渲染时从vnode实例中取值，将属性与视图绑定在一起
    return vnode
  }
}

export function mountComponent(vm, el) {
  vm.$el = el
  // 1. 调用render 生成虚拟节点（使用响应式数据）
  // 2. 根据虚拟dom生成真实dom
  // 3. 挂载到el上
  const updateComponent = () => {
    vm._update(vm._render())
  }

  // 组件触发更新时，执行updateComponent
  new Watcher(vm, updateComponent, true) // true => 是一个渲染watcher
}

export function callHooks(vm, hook) {
  const handlers = vm.$options[hook]

  if (handlers) {
    handlers.forEach(handler => handler.call(vm))
  }
}
