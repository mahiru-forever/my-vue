import { createTextVNode, createElementVNode } from './vdom/index'
import Watcher from './observe/watcher'

// vue流程
// 1.生成响应式数据
// 2.模板转换成ast
// 3.ast转成render函数
// 4.后续每次更新都通过render函数，无需ast

function createElm(vnode) {
  const { tag, data, children, text } = vnode

  if (typeof tag === 'string') {
    // 标签
    vnode.el = document.createElement(tag)

    patchProps(vnode.el, data)

    // 处理子节点
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    // 文本
    vnode.el = document.createTextNode(text)
  }

  return vnode.el
}

function patchProps(el, props) {
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      if (key === 'style') {
        // style特殊处理
        for (const styleName in props.style) {
          if (props.style.hasOwnProperty(styleName)) {
            el.style[styleName] = props.style[styleName]
          }
        }
      } else {
        el.setAttribute(key, props[key])
      }
    }
  }
}

function patch(oldVNode, vnode) {
  // 判断是不是真实的dom节点（处渲染是真实节点）
  const isRealElement = oldVNode.nodeType
  if (isRealElement) {
    // 初渲染
    const elm = oldVNode
    const parentElm = elm.parentNode
    const newElm = createElm(vnode)
    parentElm.insertBefore(newElm, elm.nextSibling)
    parentElm.removeChild(elm)
    return newElm
  } else {
    // diff
  }
}

export function initLifecycle(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    const el = vm.$el
    // 初始化+更新
    vm.$el = patch(el, vnode)
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
    console.log('vnode——', vnode)

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

  new Watcher(vm, updateComponent, true) // true => 是一个渲染watcher
}

export function callHooks(vm, hook) {
  const handlers = vm.$options[hook]

  if (handlers) {
    handlers.forEach(handler => handler.call(vm))
  }
}
