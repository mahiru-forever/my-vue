function createRoute(record, location) {
  const matched = []

  while (record) {
    matched.unshift(record)
    record = record.parent
  }

  return {
    ...location,
    matched
  }
}

function runQueue(queue, from, to, cb) {
  function next(index) {
    if (index >= queue.length) return cb()

    const hook = queue[index]
    hook(from, to, () => next(index + 1))
  }

  next(0)
}

class Base {
  constructor(router) {
    this.router = router

    this.current = createRoute(null, {
      path: '/'
    })
  }

  listen(cb) {
    this.cb = cb
  }

  // 路由切换的时候，都应该调用transitonTo，拿到新的记录
  transitonTo(location, listener) {
    const record = this.router.match(location)

    // 需要根据匹配的记录找到所有的组件，根据组件渲染到不同的router-view中
    const route = createRoute(record, { path: location })
    // 路由不变，不往下执行
    if (
      location === this.current.path &&
      // 排除路由相同，匹配的组件不同的情况（比如第一次进入且路由为 / 时）
      this.current.matched.length === route.matched.length
    ) {
      return
    }

    // 维护钩子函数队列
    const queue = [].concat(
      this.router.beforeEachHooks,
      this.router.afterEachHooks
    )

    runQueue(queue, this.current, record, () => {
      // 每次current发生变化，需要重新渲染
      this.current = route
      this.cb && this.cb(route)

      listener && listener()
    })
  }
}

export default Base
