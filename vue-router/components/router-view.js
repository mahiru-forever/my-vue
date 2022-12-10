export default {
  functional: true,
  render(h, { parent, data }) {
    const route = parent.$route
    let depth = 0

    data.routerView = true
    // 向上查找所有的父组件，查看有多少个router-view
    while (parent) {
      // _vnode是组件的渲染函数中的虚拟节点，$vnode是组件本身
      // $vnode是_vnode的父亲
      if (parent.$vnode && parent.$vnode.data.routerView) {
        depth++
      }

      parent = parent.$parent
    }

    const record = route.matched[depth]

    if (!record) {
      return h()
    }

    return h(record.component, data)
  }
}
