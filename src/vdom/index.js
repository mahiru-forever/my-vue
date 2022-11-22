// h() _c()
export function createElementVNode(vm, tag, data, ...children) {
  if (!data) {
    data = {}
  }

  const key = data.key
  if (key) {
    delete data.key
  }

  return vnode(vm, tag, key, data, children)
}

// _v()
export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text)
}

// ast描述的是语法
// 虚拟dom描述的是dom元素，可以增加一些自定义属性
function vnode(vm, tag, key, data, children, text) {
  return {
    vm,
    tag,
    key,
    data,
    children,
    text
  }
}

export function isSameVNode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}
