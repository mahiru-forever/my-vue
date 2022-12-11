export let Vue

export default function(_Vue) {
  Vue = _Vue

  Vue.mixin({
    beforeCreate() {
      const options = this.$options

      // 共享store，原理跟vue-router一样
      if (options.store) {
        this.$store = options.store
      } else if (this.$parent && this.$parent.$store) {
        this.$store = this.$parent.$store
      }
    }
  })
}
