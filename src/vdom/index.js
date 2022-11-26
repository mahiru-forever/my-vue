// 列出所有原生标签。。。
const isReservedTag = tag =>
  [
    'div',
    'a',
    'p',
    'ul',
    'li',
    'span',
    'img',
    'nav',
    'pre',
    'input',
    'textarea',
    'table',
    'tbody',
    'thead',
    'th',
    'td',
    'iframe',
    'video',
    'br',
    'em',
    's',
    'i',
    'button'
  ].includes(tag)

// h() _c()
export function createElementVNode(vm, tag, data, ...children) {
  if (!data) {
    data = {}
  }

  const key = data.key
  if (key) {
    delete data.key
  }

  if (isReservedTag(tag)) {
    return vnode(vm, tag, key, data, children)
  } else {
    // 创造一个组件的虚拟节点（包括组件的构造函数）
    // Ctor就是组件的定义，可能是一个Sub类，也可能是组件的obj配置项
    const Ctor = vm.$options.components[tag]

    return createComponentVnode(vm, tag, key, data, children, Ctor)
  }
}

function createComponentVnode(vm, tag, key, data, children, Ctor) {
  if (typeof Ctor === 'object' && Ctor !== null) {
    Ctor = vm.$options._base.extend(Ctor)
  }

  data.hooks = {
    a: 1,
    // 创造真实节点的时候，如果是组件则调用此init方法
    init(vnode) {
      const instance = (vnode.componentInstance = new vnode.componentOptions.Ctor())

      instance.$mount() // instance.$el
    }
  }

  return vnode(vm, tag, key, data, children, null, { Ctor })
}

// _v()
export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text)
}

// ast描述的是语法
// 虚拟dom描述的是dom元素，可以增加一些自定义属性
function vnode(vm, tag, key, data, children, text, componentOptions) {
  return {
    vm,
    tag,
    key,
    data,
    children,
    text,
    componentOptions // 组件的构造函数
  }
}

export function isSameVNode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}
