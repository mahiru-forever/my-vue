export default {
  props: {
    to: { type: String, require: true },
    tag: { type: String, default: 'a' }
  },
  methods: {
    handler() {
      this.$router.push(this.to)
    }
  },
  render() {
    const tag = this.tag
    return <tag onClick={this.handler}>{this.$slots.default}</tag>
  }
}
