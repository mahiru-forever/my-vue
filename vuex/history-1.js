import install, { Vue } from './install'

class Store {
  constructor(options) {
    const state = options.state
    const getters = options.getters
    const mutations = options.mutations
    const actions = options.actions

    this.getters = {}
    const computed = {}
    Object.keys(getters).forEach(getterKey => {
      // 将用户方法借助计算属性实现缓存
      computed[getterKey] = () => {
        // computed缓存 依赖值没有发生变化，函数不会执行
        return getters[getterKey](this.state)
      }
      Object.defineProperty(this.getters, getterKey, {
        get: () => {
          // 每次取值都会重新执行，所有需要依靠computed进行缓存
          return this._vm[getterKey]
        }
      })
    })

    // vuex只能在vue中使用，如果是别的地方则没有办法收集依赖，强绑定
    this._vm = new Vue({
      data: {
        // 私密性，需要通过_data获取，$与_开头的不会被代理到vm上
        $$state: state
      },
      computed
    })

    this.mutations = mutations
    this.actions = actions
  }

  get state() {
    return this._vm._data.$$state
  }

  // 解决this指向问题，防止外部解构使用
  commit = (type, payload) => {
    this.mutations[type](this.state, payload)
  }
  // 解决this指向问题，防止外部解构使用
  dispatch = (type, payload) => {
    this.actions[type](this, payload)
  }
}

export default {
  Store,
  install
}
