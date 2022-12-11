import { foreachValue } from './utils'
import Module from './module'

export default class ModuleCollection {
  constructor(options) {
    this.root = null
    // ast语法树，通过栈实现
    this.register([], options)
  }
  register(path, rootModule) {
    const newModule = new Module(rootModule)

    // 将包装后的module挂载到用户的传入的module上
    rootModule._registedModule = newModule

    if (!this.root) {
      this.root = newModule
    } else {
      // 找到父节点
      const parentModule = path.slice(0, -1).reduce((prev, cur) => {
        return prev.getChild(cur)
      }, this.root)
      // 将module定义在父节点的_children上
      parentModule.addChild(path[path.length - 1], newModule)
    }

    if (rootModule.modules) {
      foreachValue(rootModule.modules, (moduleName, moduleValue) => {
        this.register(path.concat(moduleName), moduleValue)
      })
    }
  }

  // 获取命名空间
  getNamespace(path) {
    let module = this.root
    return path.reduce((prev, cur) => {
      module = module.getChild(cur)
      if (module.namespaced) {
        return prev + `${cur}/`
      }
      return prev
    }, '')
  }
}
