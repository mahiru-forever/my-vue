import install, { Vue } from './install'
import ModuleCollection from './module-collection'
import { foreachValue } from './utils'

// // 格式化
// {
//   _raw: 原来用户定义的对象,
//  state: 原来用户定义的state
//   _children: {
//     a: {
//       _raw: 原来用户定义的对象,
//       state: 原来用户定义的state,
//       _children: {}
//     },
//     c: {
//       _raw: 原来用户定义的对象,
//       state: 原来用户定义的state,
//       _children: {}
//     },
//   }
// }

function getState(store, path) {
  return path.reduce((prev, cur) => {
    return prev[cur]
  }, store.state)
}

function installModule(store, rootState, path, rootModule) {
  if (path.length > 0) {
    // 子模块，只有子模块才需要将子模块的状态定义在根模块上面

    // 找到父级state
    const parentState = path.slice(0, -1).reduce((prev, cur) => {
      return prev[cur]
    }, rootState)

    // 内部合法替换，不需要被监控
    store._withCommiting(
      () => Vue.set(parentState, path[path.length - 1], rootModule.state)
      // parentState[path[path.length - 1]] = rootModule.state
    )
  }

  // 获取命名空间前缀
  let namespaced = store._modules.getNamespace(path)

  rootModule.forEachMutation((mutationKey, mutationValue) => {
    store._mutations[namespaced + mutationKey] =
      store._mutations[namespaced + mutationKey] || []
    store._mutations[namespaced + mutationKey].push(payload => {
      store._withCommiting(() => {
        // 不能直接用rootModule.state，relaceState之后rootModule.state不会发生变化，通过getState方法获取最新的状态
        mutationValue(getState(store, path), payload) // 此时_commiting值为true
      })

      store._subscribes.forEach(fn =>
        fn({ type: namespaced + mutationKey, payload }, store.state)
      )
    })
  })
  rootModule.forEachAction((actionKey, actionValue) => {
    store._actions[namespaced + actionKey] =
      store._actions[namespaced + actionKey] || []
    store._actions[namespaced + actionKey].push(payload => {
      const res = actionValue(store, payload)
      return res
    })
  })
  rootModule.forEachGetter((getterKey, getterValue) => {
    if (store._wrappedGetters[namespaced + getterKey]) {
      console.error(`getter key: ${getterKey}，不能重复定义`)
      return
    }
    store._wrappedGetters[namespaced + getterKey] = () => {
      return getterValue(getState(store, path))
    }
  })
  rootModule.forEachModule((moduleKey, moduleValue) => {
    installModule(store, rootState, path.concat(moduleKey), moduleValue)
  })
}

function resetStoreVM(store, state) {
  const oldVm = store._vm

  store.getters = {}
  const computed = {}
  const wrappedGetters = store._wrappedGetters

  foreachValue(wrappedGetters, (getterKey, getterValue) => {
    computed[getterKey] = getterValue // 将installModule里包裹的计算属性赋值

    Object.defineProperty(store.getters, getterKey, {
      get: () => {
        return store._vm[getterKey]
      }
    })
  })

  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })

  // 如果是严格模式，则监控整个$$state，如果_commiting是false就会进行告警
  // 消耗性能，生成环境下避免使用
  if (store.strict) {
    // 同步watcher（sync：true）
    store._vm.$watch(
      () => store._vm._data.$$state,
      () => {
        console.assert(store._commiting, '不能再mutation之外修改state的值')
      },
      { sync: true, deep: true }
    )
  }

  // 清理老的vm
  if (oldVm) {
    Vue.nextTick(() => {
      oldVm.$destroy()
    })
  }
}

class Store {
  constructor(options) {
    // 将配置项进行初始化
    this._modules = new ModuleCollection(options)

    this._mutations = Object.create(null)
    this._actions = Object.create(null)
    this._wrappedGetters = Object.create(null) // 存放计算属性

    this.plugins = options.plugins || []
    this._subscribes = [] // 存放插件

    // 维护一个变量，在执行mutation时，设置为true，
    // 为false时，赋值操作会报错
    this._commiting = false
    // 严格模式
    this.strict = options.strict

    // 初始化根模块，并且安装所有子模块，收集所有模块的getter放在this._wrappedGetters里
    const state = this._modules.root.state
    installModule(this, state, [], this._modules.root)

    // 创建实例 将计算属性和state声明到实例上
    resetStoreVM(this, state)

    // 安装插件
    this.plugins.forEach(plugin => this._subscribes.push(plugin(this)))
  }

  _withCommiting(fn) {
    this._commiting = true
    fn()
    this._commiting = false
  }

  commit = (type, payload) => {
    this._mutations[type].forEach(fn => fn.call(this, payload))
  }
  dispatch = (type, payload) => {
    return Promise.all(this._actions[type].map(fn => fn.call(this, payload)))
  }

  registerModule(path, module) {
    if (typeof path === 'string') {
      path = path.split('/')
    }
    // 注册新模块
    this._modules.register(path, module)

    // 安装模块，此时新添加的属性不是响应式
    installModule(this, this.state, path, module._registedModule)

    // 重新生成新的vm实例，更新getter
    resetStoreVM(this, this.state)
  }

  replaceState(state) {
    // 内部合法替换，不需要被监控
    this._withCommiting(() => (this._vm._data.$$state = state))
  }

  get state() {
    return this._vm._data.$$state
  }

  subscribes(cb) {
    this._subscribes.push(cb)
  }
}

export default {
  Store,
  install
}
