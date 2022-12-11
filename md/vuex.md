## vuex的目的
- 统一管理状态
- 可以修改状态，更新状态
- 给状态分模块

## 模块——命名空间
- action、mutation
  - 没有命名空间时，会收集同名方法，且方法会定义在根模块上
  - 有命名空间时，通过 xxx/xxx 路径调用
- getters
  - 没有命名空间时，重复定义会报错，且会定义在根模块上
  - 有命名空间时，通过 xxx/xxx 路径获取
- state
  - 都会定义在根模块行 通过 xx.xx 获取
  - 遇到重名会进行覆盖（注意：子模块名字不能和根模块状态重名）

## 动态添加模块
registerModule

## vuex数据持久化
- 1）重新渲染时访问后台接口
- 2）储存本地
  - 插件

## mutation 和 action 的区别
- mutation 改状态
- action 处理公共逻辑，可以进行异步操作（支持promise）
- mutation可以修改状态， action中不能修改状态 strict: true (切片编程) 只建议开发环境下使用（消耗性能）

## mapMutations,mapActions 原理
本质上是个高阶函数，取值操作封装成函数  computed: { ...{ xxx: fn }  }
