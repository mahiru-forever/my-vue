import { isSameVNode } from './index'

function createComponent(vnode) {
  let i = vnode.data

  if ((i = i.hooks) && (i = i.init)) {
    i(vnode)
  }

  if (vnode.componentInstance) {
    return true
  }
}

export function createElm(vnode) {
  const { tag, data, children, text } = vnode

  if (typeof tag === 'string') {
    // 区分是组件还是元素
    if (createComponent(vnode)) {
      return vnode.componentInstance.$el
    }

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

export function patchProps(el, oldProps = {}, props = {}) {
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
  if (!oldVNode) {
    return createElm(vnode) // vm.$el 就是对应组件的渲染结果
  }

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

  function makeIndexByKey(children) {
    const map = {}

    children.forEach((child, index) => {
      map[child.key] = index
    })

    return map
  }

  const map = makeIndexByKey(oldChildren)

  // 新旧有一个 头指针 > 尾指针 就终止循环
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 处理空节点
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
    }

    // 头头比对  从前往后比  优化push，pop
    else if (isSameVNode(oldStartVnode, newStartVnode)) {
      // 如果节点相同则递归比较子节点
      patchVNode(oldStartVnode, newStartVnode)
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    }

    // 尾尾比对  从后往前比  优化shift，unshift
    else if (isSameVNode(oldEndVnode, newEndVnode)) {
      // 如果节点相同则递归比较子节点
      patchVNode(oldEndVnode, newEndVnode)
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    }

    // 交叉对比 优化reserve
    else if (isSameVNode(oldEndVnode, newStartVnode)) {
      patchVNode(oldEndVnode, newStartVnode)
      el.insertBefore(oldEndVnode.el, oldStartVnode.el) // 把老的尾节点移动到老的头结点前面
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    }

    // 交叉对比 优化reserve
    else if (isSameVNode(oldStartVnode, newEndVnode)) {
      patchVNode(oldStartVnode, newEndVnode)
      el.insertBefore(oldStartVnode.el, oldEndVnode.el, nextSibling) // 把老的头节点移动到老的尾结点后面
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    }

    // 乱序比对
    // 根据老的列表做一个映射关系，用新的去找，找到则移动，找不到则添加，最后剩下的删除
    else {
      const moveIndex = map[newStartVnode.key]
      if (moveIndex !== undefined) {
        // 找到对应的节点，进行复用
        const moveVNode = oldChildren[moveIndex]
        el.insertBefore(moveVNode.el, oldStartVnode.el)
        // 标记已被使用
        map[newStartVnode.key] = undefined
        oldChildren[moveIndex] = undefined
        // 比对属性和子节点
        patchVNode(moveVNode, newStartVnode)
      } else {
        // 没有对应节点，重新创建
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      }

      newStartVnode = newChildren[++newStartIndex]
    }
  }

  // 新的多余  插入
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      const childEl = createElm(newChildren[i])

      // 可能往后追加，也可能往前追加
      const anchor = newChildren[newEndIndex + 1]
        ? newChildren[newEndIndex + 1].el
        : null

      // 如果anchor为null，则相当于appendChild
      el.insertBefore(childEl, anchor)
      // el.appendChild(childEl)
    }
  }

  // 老的多余 删除
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      if (oldChildren[i]) {
        const childEl = oldChildren[i].el
        el.removeChild(childEl)
      }
    }
  }
}
