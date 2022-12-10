<template>
  <div id="app">
    <div>{{ this.$route }}</div>
    <div>ROOT</div>
    <router-link to="/" tag="span">切/</router-link> |
    <router-link to="/a" tag="span">切/a</router-link> |
    <router-link to="/b" tag="span">切/b</router-link> |
    <router-link to="/about">切about</router-link> |
    <router-link to="/about/a">切about/a</router-link> |
    <router-link to="/about/b">切about/b</router-link>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {}
}
</script>
