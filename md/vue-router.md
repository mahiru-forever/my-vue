## 前端路由
- 1）hash模式
  - 根据hash不同渲染不同组件
  - 通过 window.addEventListener('popstate')监控hash变化（监听hashchange也一样）
  - 缺陷：
    - 丑，路劲都有#（锚点）
    - 服务端无法获取锚点（无法实现seo优化）
- 2）history模式 （没有#）
  - 可以改变路径，强制刷新时服务端可以解析路径，支持seo优化
  - 需要服务端支持
  - 通过puushState跳转（不通过服务端）
- 3）memeryHistory
  - ssr （node+vue）

## 导航守卫
内部会把所有钩子维护成一个数组(每个步骤也会维护成一个数组)，依次调用  二维数组
- 组件离开 beforeRouteLeave
- 切换到新组件 beforeEach 进入某个组件里面
- 是否更新，如果是组件更新 beforeRouteUpdate
- 走路由中配置的钩子 beforeEnter
- 解析异步组件
- 组件的钩子 beforeRouteEnter
- 确认切换完毕 beforeResolve
- 都走完了 afterEach
- 调用beforeRouteEnter中的 next 回调函数，创建好的组件实例最为回调的参数传入

## 路由钩子的实现
- 维护二维数组，通过 concat 降为成一维数组
- 实现 runQueue 迭代器，依次调用next执行钩子函数，全部执行完后，执行cb渲染操作
## 路由权限的实现
钩子 + addRoutes
## $router 与 $route 的区别
- $router 里面放的是方法  this._router
- $route 里面放的是属性  this.current
