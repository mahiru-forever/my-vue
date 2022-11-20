let id = 0

// 收集watcher
class Dep {
  constructor() {
    this.id = id++
    this.subs = [] // 当前属性对应的watcher
  }

  depend() {
    // 实现双向记录
    Dep.target.addDep(this)
  }

  addSub(watcher) {
    this.subs.push(watcher)
  }

  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}

Dep.target = null
const stack = []
export function pushTarget(watcher) {
  stack.push(watcher)
  Dep.target = watcher
}
export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length - 1]
}

export default Dep
