// 重写数组部分方法

const oldArrayProto = Array.prototype

// 拷贝原数组原型方法，并且不影响原数组
export const newArrayProto = Object.create(oldArrayProto)

// 7个变异方法  concat，slice不会改变原数组
const arrayMethods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'reverse',
  'sort',
  'splice'
]

arrayMethods.forEach(method => {
  newArrayProto[method] = function(...args) {
    const result = oldArrayProto[method].call(this, ...args)

    let ob = this.__ob__
    // 对新增的数据再次进行劫持
    let inserted
    switch (method) {
      case 'push':
      case 'pop':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
      default:
        break
    }

    if (inserted) {
      // 新增内容再次进行观测
      ob.observeArray(inserted)
    }

    // 触发数组的watcher视图更新
    ob.dep.notify()
    return result
  }
})
