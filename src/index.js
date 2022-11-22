import { initMixin } from './init'
import { initLifecycle } from './lifecycle'
import { initGlobalAPI } from './globalApi'
import { initStateMixin } from './state'
import { compileToFunction } from './compiler/index'
import { patch, createElm } from './vdom/patch'

// 用构造函数而不用class（避免所有方法耦合在一起）
function Vue(options) {
  this._init(options)
}

initMixin(Vue) // 扩展init方法
initLifecycle(Vue)
initGlobalAPI(Vue)
initStateMixin(Vue)

const render1 = compileToFunction(`<ul a="1">
  <li key="a">a</li>
  <li key="b">b</li>
  <li key="c">c</li>
</ul>`)
const vm1 = new Vue({ data: { age: 10 } })
const oldVnode = render1.call(vm1)
const el = createElm(oldVnode)
document.body.appendChild(el)

const render2 = compileToFunction(`<ul a="1" style="color: red">
  <li key="a">a</li>
  <li key="b">b</li>
  <li key="c">c</li>
  <li key="d">d</li>
</ul>`)
const vm2 = new Vue({ data: { age: 20 } })
const newVnode = render2.call(vm2)

setTimeout(() => {
  patch(oldVnode, newVnode)

  // const newEl = createElm(newVnode)
  // el.parentNode.replaceChild(newEl, el)
}, 1000)

export default Vue
