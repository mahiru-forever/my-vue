import { foreachValue } from './utils'

export default class Module {
  constructor(module) {
    this._raw = module
    this._children = {}
    this.state = module.state
  }

  get namespaced() {
    return !!this._raw.namespaced
  }

  addChild(key, module) {
    this._children[key] = module
  }

  getChild(key) {
    return this._children[key]
  }

  forEachMutation(cb) {
    if (this._raw.mutations) {
      foreachValue(this._raw.mutations, cb)
    }
  }

  forEachAction(cb) {
    if (this._raw.actions) {
      foreachValue(this._raw.actions, cb)
    }
  }

  forEachGetter(cb) {
    if (this._raw.getters) {
      foreachValue(this._raw.getters, cb)
    }
  }

  forEachModule(cb) {
    // 循环模块，应该循环Module包装后的
    foreachValue(this._children, cb)
  }
}
