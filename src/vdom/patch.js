import { isSameVNode } from './index'

export function createElm(vnode) {
  const { tag, data, children, text } = vnode

  if (typeof tag === 'string') {
    // 标签
    vnode.el = document.createElement(tag)

    patchProps(vnode.el, {}, data)

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

export function patchProps(el, oldProps, props) {
  const oldStyles = oldProps.style || {}
  const styles = props.style || {}

  // 旧的有，新的没有，则删除
  // 删除style
  for (const key in oldStyles) {
    if (!styles.hasOwnProperty(key)) {
      el.style[key] = ''
    }
  }
  // 删除其他属性
  for (const key in oldProps) {
    if (!props.hasOwnProperty(key)) {
      el.removeAttribute(key)
    }
  }

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

export function patch(oldVNode, vnode) {
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
    // 1. 两个节点不是同一个节点，直接删除原来的换上新的（不进行后续比对）
    // 2. 两个节点是同一个节点（需要比对节点的tag和key）； 最后在比较两个节点的属性，保留标签修改属性
    // 3. 两个节点比较完后，比对子节点
    // 4. 比较节点的文本内容
    return patchVNode(oldVNode, vnode)
  }
}

function patchVNode(oldVNode, vnode) {
  // 不是同一个节点，新的替换老的
  if (!isSameVNode(oldVNode, vnode)) {
    const el = createElm(vnode)
    oldVNode.el.parentNode.replaceChild(el, oldVNode.el)
    return el
  }

  // 复用老的dom
  const el = (vnode.el = oldVNode.el)

  // 文本节点的情况
  if (oldVNode.tag === undefined) {
    if (oldVNode.text !== vnode.text) {
      el.textContent = vnode.text
    }
    return el
  }

  // 新旧节点是同一个标签   进行属性比对
  patchProps(el, oldVNode.data, vnode.data)

  // 比对子节点
  // 1. 一方有子节点，一方没有子节点
  // 2. 两方都有子节点
  const oldChildren = oldVNode.children || []
  const newChildren = vnode.children || []

  if (oldChildren.length > 0 && newChildren.length > 0) {
    // 需要完整的比较
    updateChildren(el, oldChildren, newChildren)
  } else if (newChildren.length > 0) {
    // 挂载新的子节点
    mountChildren(el, newChildren)
  } else if (oldChildren.length > 0) {
    // 移除旧的子节点
    unmountChildren(el, oldChildren)
  }

  return el
}

function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    const child = newChildren[i]
    el.appendChild(createElm(child))
  }
}

function unmountChildren(el, oldChildren) {
  for (let i = 0; i < oldChildren.length; i++) {
    const child = oldChildren[i]
    el.removeChild(child.el)
  }
}

function updateChildren(el, oldChildren, newChildren) {
  // 双指针 对比新旧节点
  let oldStartIndex = 0
  let newStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newEndIndex = newChildren.length - 1

  let oldStartVnode = oldChildren[0]
  let newStartVnode = newChildren[0]
  let oldEndVnode = oldChildren[oldEndIndex]
  let newEndVnode = newChildren[newEndIndex]

  // 新旧有一个 头指针 > 尾指针 就终止循环
  while (oldStartIndex <= oldEndIndex || newStartIndex <= newEndIndex) {}
}
