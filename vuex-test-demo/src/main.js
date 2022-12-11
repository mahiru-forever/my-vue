import Vue from 'vue'
import App from './App.vue'
import Vuex from '../../vuex'

Vue.config.productionTip = false

Vue.use(Vuex)

const persitsPlugin = store => {
  store.subscribe(function(mutactionType, rootState) {})
}

const store = new Vuex.Store({
  plugins: [persitsPlugin],
  state: {
    age: 10
  },
  getters: {
    myAge(state) {
      return state.age + 10
    }
  },
  mutations: {
    add(state, payload) {
      state.age += payload
    }
  },
  actions: {
    add({ commit }, payload) {
      setTimeout(() => {
        commit('add', payload)
      }, 1000)
    }
  },
  modules: {
    a: {
      namespaced: true,
      state: {
        age: 30
      },
      getters: {
        myAge(state) {
          return state.age + 10
        }
      },
      mutations: {
        add(state, payload) {
          state.age += payload
        }
      },
      actions: {
        add({ commit }, payload) {
          setTimeout(() => {
            commit('add', payload)
          }, 1000)
        }
      }
    },
    c: {
      namespaced: true,
      state: {
        age: 50
      },
      mutations: {
        add(state, payload) {
          state.age += payload
        }
      },
      actions: {
        add({ commit }, payload) {
          setTimeout(() => {
            commit('add', payload)
          }, 1000)
        }
      }
    }
  }
})

store.registerModule(['a', 'e'], {
  namespaced: true,
  state: {
    name: 'hello'
  },
  mutations: {
    add(state) {
      state.name += '!'
    }
  }
})

new Vue({
  render: h => h(App),
  store
}).$mount('#app')
