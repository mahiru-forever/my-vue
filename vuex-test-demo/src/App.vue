<template>
  <div id="app">
    <div>age: {{ $store.state.age }}</div>
    <div>age: {{ $store.getters.myAge }}</div>

    <button @click="$store.commit('add', 1)">mutation</button>
    <button @click="$store.dispatch('add', 1)">ation</button>
    <button @click="$store.state.age++">修改</button>

    <div>age: {{ $store.state.a.age }}</div>
    <div>age: {{ $store.getters['a/myAge'] }}</div>

    <button @click="$store.commit('a/add', 1)">mutation</button>
    <button @click="$store.dispatch('a/add', 1)">ation</button>
    <button @click="$store.state.a.age++">修改</button>

    <div>age: {{ $store.state.c.age }}</div>

    <button @click="$store.commit('c/add', 1)">mutation</button>
    <button @click="$store.dispatch('c/add', 1)">ation</button>
    <button @click="$store.state.c.age++">修改</button>

    <div>age: {{ $store.state.a.e.name }}</div>
    <button @click="$store.commit('a/e/add')">mutation</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {}
}
</script>
