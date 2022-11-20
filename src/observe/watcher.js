import Dep, { pushTarget, popTarget } from './dep'

let id = 0

// 需要给每个属性增加一个dep，用来收集watcher
// 一个组件有多个属性， 多个dep对应一个watcher
// 一个属性对应多个组建 一个dep对应多个watcher
// 多对多

// 属性 被观察者
// watcher 观察者

// 不同的组件用自己独立的watcher
class Watcher {
  constructor(vm, fn, options) {
    this.id = id++
    this.renderWatcher = options
    this.getter = fn
    this.deps = [] // 记录dep  组价卸载、计算属性
    this.depsId = new Set()
    this.lazy = options.lazy
    this.dirty = this.lazy
    this.vm = vm

    this.lazy ? undefined : this.get()
  }

  // 1.创建渲染watcher时，把当前的watcher放到Dep.target上
  // 2.调用render时，取值时触发 属性的get方法
  get() {
    pushTarget(this)

    const value = this.getter.call(this.vm) // 去vm上取值

    popTarget()

    return value
  }

  evaluate() {
    this.value = this.get() // 获取值之后标记为脏
    this.dirty = false
  }

  depend() {
    let i = this.deps.length

    if (i === 0) {
      return
    }

    while (i--) {
      // dep.depend()
      this.deps[i].depend() // 让计算属性watcher，收集渲染watcher
    }
  }

  addDep(dep) {
    const id = dep.id
    // 去重
    if (!this.depsId.has(id)) {
      // watcher 记录dep
      this.deps.push(dep)
      this.depsId.add(id)
      // 让dep记录watcher
      dep.addSub(this)
    }
  }

  update() {
    if (this.lazy) {
      // 依赖的值变化，计算属性变为脏值
      this.dirty = true
    } else {
      // 异步 重新渲染
      queueWatcher(this)
    }
  }

  run() {
    this.get()
  }
}

let has = {}
let queue = []
let pending = false
// 待更新watcher队列
function queueWatcher(watcher) {
  const id = watcher.id

  // 去重
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true

    // 防抖
    if (!pending) {
      pending = true
      setTimeout(flushSchedulerQueue, 0)
    }
  }
}

function flushSchedulerQueue() {
  const flushQueue = [...queue]

  queue = []
  has = {}
  pending = false

  flushQueue.forEach(q => q.run())
}

let callbacks = []
let waitings = false

function flushCallbacks() {
  const cbs = [...callbacks]
  callbacks = []
  waitings = false
  cbs.forEach(cb => cb())
}

// vue 降级策略：
// promise (微任务 ie不兼容) => MutationObserver (微任务 h5 api) => setImmediate (ie api) => setTimeout
let timerFunc
if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks)
  }
} else if (MutationObserver) {
  const observer = new MutationObserver(flushCallbacks)

  timerFunc = () => {
    const textNode = document.createTextNode('')
    observer.observe(textNode, {
      characterData: true
    })
    textNode.textContent = '1'
  }
} else if (setImmediate) {
  timerFunc = () => setImmediate(flushCallbacks)
} else {
  timerFunc = () => setTimeout(flushCallbacks, 0)
}

// 将异步任务维护到队列中
export function nextTick(cb) {
  callbacks.push(cb)

  // 维护队列，减少定时器开启
  if (!waitings) {
    waitings = true
    timerFunc()
  }
}

export default Watcher
