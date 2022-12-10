## 1.vue2响应式数据的理解
监控数据的修改和获取操作。针对对象格式会给对象的每个属性进行劫持 Object.defineProperty

> 源码层面  initData -> observe -> defineReactive （内部对所有属性进行了重写 性能问题）递归  增加getter，setter

> 避免层级过深、不是响应式的数据不放在data里、考虑采用Object.freeze冻结对象

## 2.Vue中如何检测数组的变化
vue2中检测数组的变化并没有采用defineProperty<br>
因为修改索引的情况不多（如果直接使用defineProperty会造成性能浪费）。采用重写数组的变异方法来实现（函数劫持）

> initData -> observe -> 对传入的数组进行原型链修改 -> 对数组中的每个对象再次进行代理

修改数组索引、长度无法触发更新

## 3.Vue中如何进行依赖收集
- 观察者模式
  - 被观察者 dep -> 数据
  - 观察者 watcher -> 组件渲染watcher、计算属性、用户watcher
- 一个watcher中可能对应多个数据，watcher中保存dep（重新渲染的时候可以让属性重新记录watcher）计算属性也会用到
- dep收集watcher用于属性发生改变触发watcher更新，watcher收集dep用于清理

> 多对多 一个dep对应多个watcher，一个watcher有多个dep。默认渲染的时候会进行依赖收集（会触发get方法），数据更新了就会找到属性对应的watcher去触发更新

## 4.Vue模版编译原理
- template -> ast语法树
- 对语法树进行标记（标记静态节点）
- 将ast语法树生成render函数

> 最终每次渲染可以调用render函数返回对应的虚拟节点（递归是先子后父）

## 5.Vue生命周期钩子如何实现
内部用了发布订阅模式，将用户写的钩子维护成一个数组，后续一次调用callHook<br>

> 为什么有些钩子是先子再父，有些是先父再子，组件渲染是如何渲染的？<br>
遇到父组件先渲染父组件，遇到子组件就渲染子组件，先渲染完子组件后才能渲染完毕父组件（父 -> 子 -> 子完 ->父完）

## 6.Vue生命周期方法、及获取数据操作
- beforeCreate 这里没有实现响应式数据（只初始化了组件父子关系、事件、插槽等变量声明）vue3中废弃
- created 拿到响应式数据（初始化inject、响应式数据、provide）不涉及dom渲染，可以在服务端渲染中使用，在vue3中为setup
- beforeMount 
- Mounted 可以获取真实dom（在new Watcher之后执行）
- beforeUpdate 每次Watcher重新渲染之前(watcher的before钩子)
- updated 每次Watcher重新渲染之后
- activated keep-alive
- deactivated
- beforeDestroy 移除之前调用（方法、组件、响应式数据都还在）
- destroyed  移除之后调用（方法、组件、响应式数据都被清除）
- errorCaptured 捕获错误

> 一般请求在mounted（钩子是同步的，请求是异步的）

## 7.Vue.mixin的使用场景和原理
通过Vue.mixin来实现逻辑复用（有数据来源不明确的问题、命名冲突）

> mixin核心是合并属性（内部采用了策略模式，针对不同的属性有不同的合并策略）全局mixin、局部mixin

> extend 与 mixin类似（区别：extend不支持数组，mixin是数组 ）

## 8.Vue组件data为什么必须是个函数
- 根实例new Vue，所有可以是个对象
- 组件更具构造函数多次创建实例，内部会调用extend方法将data赋值给组件实例，如果是同一个对象的话，数据会互相影响。

## 9.nextTick在哪里使用？原理
- 内部采用了异步任务进行包装，多个nextTick调用内部会合并回调，最后在异步任务重一次性处理
- 异步方式（降级处理promise > MutationObserver > setImmediate > setTimeout）
- 场景：异步更新 （默认调度时，就会添加一个nextTick任务）获取最终渲染结果需要在内部任务执行之后再执行自定义逻辑（自定义逻辑需要放在nextTick中）

## 10.computed和watch区别
- 相同点
  - 底层都会创建一个watcher
- 区别
  - computed属性可以在模板中使用，watch不能
  - computed默认不会立即执行，只有取值的时候才会执行，内部维护一个dirty值来控制依赖是否发生变更。需要同步返回结果（有个包可以让computed支持异步返回）
  - watch默认会提供一个回调函数，数据变化会调用回到函数，可以用来监控某个值的变化

## 11.Vue.set方法如何实现
vue中的一个补丁方法（添加属性，数组无法监控索引长度）<br>
实现：给每个对象都添加了dep属性
- 数组：内部通过splice来实现
- 非响应式对象：直接复制
- 响应式对象：通过defineReactive实现

> Vue3不需要此方法

## 12.Vue为什么要虚拟dom
- 跨平台（主要）
  - 写代码需要针对不同平台（weex，web，小程序）可以不考虑跨平台问题
  - 不用关心兼容性，可以外部传入渲染方法，根据虚拟dom来渲染
- diff算法
  - 针对更新的时候，通过diff找到差异，只对差异部分进行修改

## 13.Vue中diff算法原理
diff算法特点是平级比较，内部采用双指针方式进行优化，对常见操作进行优化，采用了递归比较的方式

### 一个节点的比较
- 先比较根节点
  - 同一个节点：继续比较属性（先删除新属性中没有的，在更新新属性）
  - 不是同一个：直接替换成新的
- 属性比较后复用老节点，并比较子节点

### 比较子节点
- 一方有子节点，一方没有
  - 删除 or 添加
- 两方都有子节点
  - 优化比较(old-new)
    - 头头（成功=>双头指针向后移动1）
    - 尾尾（成功=>双尾指针向前移动1）
    - old头new尾（成功=>将头部节点插入到尾部节点的下一个节点的前面，old头向后移动1，new尾向前移动1）
    - old尾new头（成功=>将尾部节点插入到头部节点的前面，old尾向前移动1，new头向后移动1）
    - 以上都不是，做一个映射表，查找是否存在此元素，存在则移动，不存在则插入（根据老的索引和key简历映射表，用新的key去找，找到则移动并标识为undefined，但key相同元素不同则创建新元素）
  - 仅剩一方有剩下的
    - 全部删除 or 全部添加

### 缺陷
会有多移动的情况，vue3做了优化（最长递增子序列）

### 复杂度
O(n)

## 14.既然Vue通过数据劫持可以精准探测数据变化，为什么还需要虚拟dom进行diff检测差异
- 如果个每个属性都增加watcher，粒度太小不好控制，降低watcher的数量每个组件一个watcher（通过diff算法优化组件watcher的更新，通过diff算法和响应式原理折中处理）
- vue1没有diff用的就是每个属性创建watcher性能不好

## 15.Vue中key的作用和原理
isSameVnode中会通过key来判断两个元素是否是同一个元素，key不相同说明不是同一个元素（动态列表中不要使用索引作为key，会有bug）<br>
使用key尽量保证key的唯一性(优化diff算法)

## 16.Vue组件化的理解
组件的优点：
- 复用
- 组件相关的内容放在一起
- 合理规划组件，可以做到更新的时候是组件级更新
- 方便模块的拆分
组件化中的特性：
- 属性
- 事件
- 插槽

> Vue中怎样处理组件
> 1）Vue.extend根据用户传入的对象生成一个构造函数
> 2）根据组件产生对应的虚拟节点
> 3）组件初始化，将虚拟节点转化成真实节点（组件init方法）new Sub().$mount()

## 17.Vue组件渲染流程(init)
(同上面)
- 定义组件 vm.$options.components['my'] = { my:模板 }
- 创造组件的虚拟节点 createComponent  { tag: 'my', data: {hook:{init}}, componentOptions: {Ctor:Vue.extend({my:模板})} }
- 创造真实节点 createComponent  init -> new 组件().$mount() -> vm.componentInstance
- vm.$el插入到父节点

## 18.Vue组件更新流程(prepatch)
更新的几种情况
- data 数据更新
- props 属性更新
- slot 插槽更新
更新流程：
- 组件更新会触发 组件的prepatch方法，会复用组件，并且比较组件的属性、事件、插槽
- 父组件给子组件传递的(props)属性是响应式的，在模板中使用会做依赖收集，收集自己组件的watcher
- 稍后组件更新会重新给props赋值，赋值完成后会触发watcer重新更新
prepatch：
- 属性：验证属性类型，直接赋值
- 事件：对比是不是同一个事件，直接赋值

## 19.Vue中异步组件原理
作用：大的组件可以异步加载 markdown、editor等。<br>
原理：先渲染一个注释标签，等组件加载完毕，最后重新渲染（类似图片懒加载）使用异步组件会配合webpack（code-splitting）<br>
### 使用方法
```js
// 旧写法
Vue.component('组件名', function(resolve) {
  // 需要webpack支持
  require(['xxx'], resolve)
})

// 新写法
Vue.component('组件名', () => import('xxx'))

// or

new Vue({
  components: {
    '组件名': () => import('xxx')
  }
})

// or

const AsyncComponent = () => ({
  component: import('xxx'),
  loading: LoadingComponent, // 异步加载中使用的组件
  err: ErrorComponent, // 加载失败使用的组件
  delay: 200, // 展示加载时组件的延时时间
  timeout: 3000 // 超时时间（超时使用失败组件）
})
```
异步组件解析：异步组件是个函数，内部调用createComponent，Ctor是个函数，不会调用Vue.extend变成构造函数

> 原理：异步组件默认不会调用Vue.extend方法，所有Ctor上没有cid属性，没有cid属性就是异步组件。会渲染一个占位符组件，但是有loading会先渲染loading。如果用户调用了resolve，会将结果赋给factory.resolved并且强制重新渲染。重新渲染时重新调用resolveAsyncComponent中，会直接拿到factory.resolved结果来进行渲染

## 20.函数组件的优势及原理
> React中组件：类组件(正常方式创建的)、函数式组价(没有this，没有状态，没有生命周期)
### 函数式组价好处
性能好，不需要创建watcher
### Vue函数式组件
需要设定functional为true，没有data，只能接受props
### 适合范围
只有渲染逻辑的组件
### 原理
直接调用render拿到返回的结果

## 21.Vue组件间传值的方式及之间区别
- props 父传子 （把解析后的props验证后定义在当前实例上，通过defineReactive，即都是响应式数据）
- emit 子传父
- eventBus 订阅发布模式 $bus = new Vue()
- $parent $children  直接通过父组件、子组件实例调用
- ref 获取dom元素和组件实例
- provide，inject
- $attrs 所有组件上的属性，不包括props
- $listeners 组件上所有的事件
- Vue.observalble 创建全局对象用于通信
- vuex
### props原理
- 解析组件属性，根据props配置项分为props和attrs两部分
- 维护一个_props用于储存props属性，将_props变为响应式数据，并映射到this上（原理类似_data）
- 父组件属性修改，会调用子组件的prepatch方法，对比props值，如果不一致直接给_props进行赋值
- _props因为是响应式，值发生变化会触发对应的watcher进行更新，执行对应patch方法
### emit原理（与@click.native原理不一样）
- 发布订阅模式
- 创建虚拟节点的时候将所有的事件绑定到listeners
- 通过$on()方法绑定事件，事件保存到events里
- 通过$emit()方法触发事件，从events里找到对应方法，调用执行
### ref
- 虚拟dom没有处理ref，因为此时没有创建实例
- 创建dom时，会将所有dom属性维护到cbs中（都是从操作属性的方法create,update,insert,destory）依次调用
- cbs中ref相关的操作，会操作ref并赋值（组件实例 || dom实例），如果是v-for渲染会将ref维护成一个数组
### provide inject
- provide原理：将provide赋值到_provide上
- inject原理：从父组件里找到当前属性的定义，将找到的值定义在当前组件属性上
### 其他注意点
- methods和data里写函数的区别：methods里的函数会被bind(this)，data不会，传递给子组件调用会有this指向的问题
- provide和inject的绑定是非响应的（如果是对象，则对象的属性可以响应）
- 配置项inheritAttrs为false，attrs属性不会绑定在标签上

## 22.v-if和v-for优先级
```js
function render() {
  with(this) {
    return _c('div', _l((3), function (i) {
      return (flag) ? _c('span') : _e()
    }), 0)
  }
}
```
> v-for优先级更高，编译时v-for变成渲染函数，v-if变为三元表达式，这两个不能在一起使用
> 区别：v-if（控制渲染）、v-show的（控制样式，display:none），v-if会变成表达式（编译时），v-show会变成指令（运行时）
> v-show指令会先保存原始的display值，如果条件满足会采用原始的display（不用这些的原因：visibility：不能响应事件但是会占位，opacity两者都会）

## 23.v-if，v-model，v-for实现原理
- v-if 会被编译成三元表达式
- v-for 会被编译成 _l(value, render)
- v-model （放在表单元素上可以实现双向绑定，组件不一样）
  - 不同元素上编译结果不同
    - 文本：value + input + 指令处理(中文输入优化)
      - value和input实现双向绑定，阻止中文触发
      - compositionEnd事件，输入完成手动触发input事件
    - checkbox：checked + change
    - select：change
    - radio：change
  - 绑定在组件上（value和input事件的语法糖）
    - 默认为value和input（可以通过配置项model修改  model: { prop: 'xx', event: 'fn' }）

## 24.Vue中sync修饰符作用及原理
- 和v-model一样，实现状态同步，在Vue3中被移除了（vue3起别名）
- vue2中解决v-model重名问题，触发事件通过$emit('update:xx', value)

## 25.Vue中native修饰符作用
用在组件标签上，作为监听原生事件使用

## 26.Vue.use原理及作用
作用：将vue的构造函数传给插件，让所有插件用同一个vue版本
- 写法1：Vue.use(plugin, ...opts)  默认调用插件
- 写法2：Vue.use({ install: plugin, xxx }, ...opts) 默认调用插件的install
- 内部做校验（防止重复安装）
- 内部会 obj.install.apply(obj, opts) or plugin.apply(null, opts)

## 27.组件中写name选项的好处及作用
- 在vue中有name属性的组件可以被递归调用，在模板中通过name调用自身（需要有终止条件v-if）
- 声明组件时 Sub.options.components[name] = Sub
- 用来标识组件，通过name找到对应的组件，实现跨级通信

## 28.Vue中slot是如何实现的，什么时候使用
- 普通插槽 渲染数据采用的是父组件（插槽的render函数会立即执行）
  - 在解析组件的时候会将组件的children放到componentOptions上作为虚拟节点的属性
  - 将children取出来放到组件的 vm.$options._renderChildren中
  - 做出一个映射表放到vm.$slots上 -> 将结果放到 vm.$scopeSlots上  vm.$scopeSlots = { a: fn, default: fn }
  - 渲染组件的时候会调用 _t 方法，此时会去vm.$scopeSlots山找到对应的函数来渲染内容
- 具名插槽
  - 普通插槽的基础上，多加了个名字

- 作用域插槽 （插槽的render函数不是立即执行）
  - 左云插槽渲染的时候不是作为children，而是做成了一个属性scopedSlots
  - 制作一个映射关系 $scopedSlots = { defualt: function({msg}){return _c('div',{},[_v(_s(msg))])} }
  - 稍后渲染组价模版时，会通过name找对对应函数，将数据传入函数才会渲染虚拟节点，用虚拟检点替换 _t('default')

> 普通插槽在父组件中渲染，作用域插槽在子组件中渲染
> vm.$scopeSlots {key:fn}  vm.$slots = {key:[vnode]}

## 29.keep-alive平时在哪里使用、原理
使用场景：（目的：为了缓存组件的$el）
- keep-alive 在路由中使用
- 在component:is 中使用（缓存）

原理：
- keep-alive的原理是默认缓存加载过的组件实例，内部采用 LRU 算法
- 下次组件切换加载的时候 此时会找到对应的缓存节点来进行初始化，但是会采用上次缓存的$el来触发（不用再将虚拟节点转成真实节点的操作）
- 更新和销毁会触发 actived 和 deactived

> LRU 最近最少使用算法，有限长度缓存，（缓存列表中删除当前使用的key，并加key放在队尾，超过长度额外删除队头）
> keep-alive中缓存的组件，不会触发生命周期

## 30.如何理解自定义指令
- 自定义指令就是用户定义好对应的钩子，元素在不同的状态时会调用对应的钩子（所有的钩子都会合并到 cbs 对应的方法上，到时候依次调用）

## 31.Vue事件修饰符有哪些，实现原理
- 实现主要靠模版编译原理 addEventListener（stop，prevent） self  capture passvie once
- number trim
### 直接编译在事件内部
stop，prevent
### 编译时增加标识
capture passvie once
### 键盘事件
enter keydown
