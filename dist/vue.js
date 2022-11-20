(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  // 重写数组部分方法

  const oldArrayProto = Array.prototype;

  // 拷贝原数组原型方法，并且不影响原数组
  const newArrayProto = Object.create(oldArrayProto);

  // 7个变异方法  concat，slice不会改变原数组
  const arrayMethods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice'
  ];

  arrayMethods.forEach(method => {
    newArrayProto[method] = function(...args) {
      const result = oldArrayProto[method].call(this, ...args);

      let ob = this.__ob__;
      // 对新增的数据再次进行劫持
      let inserted;
      switch (method) {
        case 'push':
        case 'pop':
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }

      if (inserted) {
        // 新增内容再次进行观测
        ob.observeArray(inserted);
      }

      return result
    };
  });

  let id$1 = 0;

  // 收集watcher
  class Dep {
    constructor() {
      this.id = id$1++;
      this.subs = []; // 当前属性对应的watcher
    }

    depend() {
      // 实现双向记录
      Dep.target.addDep(this);
    }

    addSub(watcher) {
      this.subs.push(watcher);
    }

    notify() {
      this.subs.forEach(watcher => watcher.update());
    }
  }

  Dep.target = null;
  const stack = [];
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  class Observe {
    constructor(data) {
      // Object.defineProperty只能劫持已经存在的属性（$set,$delete...）

      // 作用：
      // 1.将this挂载到需要被监听data上，方便调用Observe提供的方法
      // 2.给被观测过的数据加上表示
      Object.defineProperty(data, '__ob__', {
        value: this,
        enumerable: false // 不可枚举，walk循环时无法获取
      });

      // 数组的情况单独处理，提升性能
      if (Array.isArray(data)) {
        // 保留数组原特性，重写数组变异方法
        data.__proto__ = newArrayProto;

        // 数组内的引用类型也要劫持
        this.observeArray(data);
      } else {
        this.walk(data);
      }
    }

    // 循环对象，对属性依次劫持
    walk(data) {
      // 重新定义属性
      Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
    }

    // 观测数组
    observeArray(data) {
      data.forEach(item => observe(item));
    }
  }

  // 属性劫持 闭包
  function defineReactive(target, key, value) {
    // 递归 深度属性劫持 对所有的对象属性都进行劫持
    observe(value);

    const dep = new Dep(); // 每个属性都有一个dep

    Object.defineProperty(target, key, {
      get() {
        if (Dep.target) {
          // 给当前属性的dep记录watcher
          // 只会对被获取的属性进行收集
          dep.depend();
        }
        // console.log(`取值————${value}`)
        return value
      },
      set(newValue) {
        if (value === newValue) {
          return
        }
        // 设置值如果是个对象需要再次代理
        observe(value);

        // console.log(`赋值————${newValue}，原值————${value}`)
        value = newValue;

        // 更新
        dep.notify();
      }
    });
  }

  function observe(data) {
    // 只对象进行劫持
    if (typeof data !== 'object' || data === null) {
      return
    }

    // 如果被劫持过，就不需要劫持了
    if (data.__ob__ instanceof Observe) {
      return data.__ob__
    }

    return new Observe(data)
  }

  let id = 0;

  // 需要给每个属性增加一个dep，用来收集watcher
  // 一个组件有多个属性， 多个dep对应一个watcher
  // 一个属性对应多个组建 一个dep对应多个watcher
  // 多对多

  // 属性 被观察者
  // watcher 观察者

  // 不同的组件用自己独立的watcher
  class Watcher {
    constructor(vm, fn, options) {
      this.id = id++;
      this.renderWatcher = options;
      this.getter = fn;
      this.deps = []; // 记录dep  组价卸载、计算属性
      this.depsId = new Set();
      this.lazy = options.lazy;
      this.dirty = this.lazy;
      this.vm = vm;

      this.lazy ? undefined : this.get();
    }

    // 1.创建渲染watcher时，把当前的watcher放到Dep.target上
    // 2.调用render时，取值时触发 属性的get方法
    get() {
      pushTarget(this);

      const value = this.getter.call(this.vm); // 去vm上取值

      popTarget();

      return value
    }

    evaluate() {
      this.value = this.get(); // 获取值之后标记为脏
      this.dirty = false;
    }

    depend() {
      let i = this.deps.length;

      if (i === 0) {
        return
      }

      while (i--) {
        // dep.depend()
        this.deps[i].depend(); // 让计算属性watcher，收集渲染watcher
      }
    }

    addDep(dep) {
      const id = dep.id;
      // 去重
      if (!this.depsId.has(id)) {
        // watcher 记录dep
        this.deps.push(dep);
        this.depsId.add(id);
        // 让dep记录watcher
        dep.addSub(this);
      }
    }

    update() {
      if (this.lazy) {
        // 依赖的值变化，计算属性变为脏值
        this.dirty = true;
      } else {
        // 异步 重新渲染
        queueWatcher(this);
      }
    }

    run() {
      this.get();
    }
  }

  let has = {};
  let queue = [];
  let pending = false;
  // 待更新watcher队列
  function queueWatcher(watcher) {
    const id = watcher.id;

    // 去重
    if (!has[id]) {
      queue.push(watcher);
      has[id] = true;

      // 防抖
      if (!pending) {
        pending = true;
        setTimeout(flushSchedulerQueue, 0);
      }
    }
  }

  function flushSchedulerQueue() {
    const flushQueue = [...queue];

    queue = [];
    has = {};
    pending = false;

    flushQueue.forEach(q => q.run());
  }

  let callbacks = [];
  let waitings = false;

  function flushCallbacks() {
    const cbs = [...callbacks];
    callbacks = [];
    waitings = false;
    cbs.forEach(cb => cb());
  }

  // vue 降级策略：
  // promise (微任务 ie不兼容) => MutationObserver (微任务 h5 api) => setImmediate (ie api) => setTimeout
  let timerFunc;
  if (Promise) {
    timerFunc = () => {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    const observer = new MutationObserver(flushCallbacks);

    timerFunc = () => {
      const textNode = document.createTextNode('');
      observer.observe(textNode, {
        characterData: true
      });
      textNode.textContent = '1';
    };
  } else if (setImmediate) {
    timerFunc = () => setImmediate(flushCallbacks);
  } else {
    timerFunc = () => setTimeout(flushCallbacks, 0);
  }

  // 将异步任务维护到队列中
  function nextTick(cb) {
    callbacks.push(cb);

    // 维护队列，减少定时器开启
    if (!waitings) {
      waitings = true;
      timerFunc();
    }
  }

  function initState(vm) {
    const opts = vm.$options;

    if (opts.data) {
      initData(vm);
    }

    if (opts.computed) {
      initComputed(vm);
    }
  }

  function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[target][key]
      },
      set(newValue) {
        vm[target][key] = newValue;
      }
    });
  }

  function initData(vm) {
    let data = vm.$options.data; // 根对象data可能是函数或者对象

    data = typeof data === 'function' ? data.call(vm) : data;
    vm._data = data; // 挂载到_data上

    // 对数据进行劫持
    observe(data);

    // 将vm._data用vm来代理
    for (let key in data) {
      proxy(vm, '_data', key);
    }
  }

  function initComputed(vm) {
    const computed = vm.$options.computed;
    // 保存vm下所有computed的watcher实例
    const watchers = (vm._computedWatchers = {});

    for (const key in computed) {
      if (computed.hasOwnProperty(key)) {
        const usrDef = computed[key];
        // 监控计算属性中getter的变化
        const getter = typeof usrDef === 'function' ? usrDef : usrDef.get;

        // 如果直接new Watcher就会直接指向getter， 将属性与watcher对应起来
        watchers[key] = new Watcher(vm, getter, {
          lazy: true
        });

        defineComputed(vm, key, usrDef);
      }
    }
  }

  function defineComputed(vm, key, usrDef) {
    const setter = usrDef.set || (() => {});

    Object.defineProperty(vm, key, {
      get: createComputedGetter(key),
      set: setter
    });
  }

  // 计算属性不会收集依赖，只会让自己依赖的属性收集依赖
  function createComputedGetter(key) {
    return function() {
      // 当前属性的watcher
      const watcher = this._computedWatchers[key];

      if (watcher.dirty) {
        watcher.evaluate(); // 求值后dirty为false
      }

      // 计算属性出栈后，还要收集渲染watcher，要让计算属性里dep记录的属性，收集上层watcher
      if (Dep.target) {
        watcher.depend();
      }

      return watcher.value
    }
  }

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签名 <div
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 结束标签名 </div>
  // 匹配属性 attr="xxx" attr='xxx' attr=xxx  正则1名字 345值
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // 开始标签结束 or 自闭合标签 <div> <br/>
  const startTagClose = /^\s*(\/?)>/;
  // 模板字符串 {{ xxxx }}
  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

  const ELEMENT_TYPE = 1;
  const TEXT_TYPE = 3;

  function parseHTML(html) {
    const stack = []; // 存放元素
    let currentParent; // 栈最后一个元素
    let root;

    function createASTElement(tag, attrs) {
      return {
        tag,
        attrs,
        type: ELEMENT_TYPE,
        children: [],
        parent: null
      }
    }

    // 利用栈构造树
    function start(tagName, attrs) {
      const node = createASTElement(tagName, attrs);

      // 是根节点
      if (!root) {
        root = node;
      }

      if (currentParent) {
        node.parent = currentParent;
        currentParent.children.push(node);
      }

      stack.push(node);
      currentParent = node;
    }

    function chars(text) {
      // 空格超过2个，转为一个空格
      text = text.replace(/\s{2,}/g, ' ');

      // 文本直接指向当前父节点
      currentParent.children.push({
        type: TEXT_TYPE,
        text,
        parent: currentParent
      });
    }

    function end(tagName) {
      // 校验标签
      // if (currentParent.tagName !== tagName) {
      //   console.error(`标签不合法<${currentParent.tagName}></${tagName}>`)
      //   return
      // }

      stack.pop();
      currentParent = stack[stack.length - 1];
    }

    function advance(len) {
      html = html.substring(len);
    }

    function parseStartTag() {
      const start = html.match(startTagOpen);
      if (start) {
        const match = {
          tagName: start[1], // 标签名
          attrs: []
        };
        advance(start[0].length);

        // 一直匹配到不是开始标签结束
        let attr, end;
        while (
          !(end = html.match(startTagClose)) &&
          (attr = html.match(attribute))
        ) {
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5] || true
          });
        }

        if (end) {
          advance(end[0].length);
        }

        return match
      }

      return false
    }

    while (html) {
      // textEnd === 0 开始标签 or 结束标签
      // textEnd > 0 文本结束的位置
      const textEnd = html.indexOf('<');

      if (textEnd === 0) {
        const startTagMatch = parseStartTag(); // 开始标签匹配结果

        // 是开始标签
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue
        }

        // 结束标签
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
        }
      }

      if (textEnd > 0) {
        let text = html.substring(0, textEnd); // 文本内容

        if (text) {
          chars(text);
          advance(text.length);
        }
      }
    }

    return root
  }

  function genProps(attrs) {
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      let value = attr.value;

      // style需要是个对象
      if (attr.name === 'style') {
        value = attr.value.split(';').reduce((prev, cur, index, arr) => {
          const [k, v] = cur.split(':');

          if (v === undefined) {
            return prev
          }

          prev[k.trim()] = v.trim();
          return prev
        }, {});
      }

      str += `${attr.name}:${JSON.stringify(value)},`;
    }
    return `{${str.slice(0, -1)}}`
  }

  function gen(node) {
    if (node.type === ELEMENT_TYPE) {
      return codegen(node)
    }
    if (node.type === TEXT_TYPE) {
      const text = node.text;

      // 纯文本
      if (!defaultTagRE.test(text)) {
        return `_v(${JSON.stringify(text)})`
      }

      // 包含变量
      const tokens = [];
      let match;
      let lastIndex = 0;
      defaultTagRE.lastIndex = 0; // 全局匹配正则，重置index
      while ((match = defaultTagRE.exec(text))) {
        const { index } = match;
        // 截取{{}}前面的文本内容
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }

        tokens.push(`_s(${match[1].trim()})`);

        lastIndex = index + match[0].length;
      }

      // 处理最后一段文本内容
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }

      return `_v(${tokens.join('+')})`
    }
  }

  function genChildren(children) {
    if (children) {
      return children.map(child => gen(child)).join(',')
    }
  }

  function codegen(ast) {
    const children = genChildren(ast.children);
    let code = `_c('${ast.tag}', ${
    ast.attrs.length > 0 ? genProps(ast.attrs) : null
  }${ast.children.length > 0 ? `,${children}` : ''})`;

    return code
  }

  // 对模板进行编译(vue3没有再采用正则，单个字符串匹配)
  function compileToFunction(template) {
    // 1. 将template转换成ast语法树
    const ast = parseHTML(template);
    console.log('ast————', ast);

    // 2. 生成render方法（render方法生成虚拟dom）
    const code = codegen(ast);
    console.log('code————', code);

    // 指定作用于，挂载到vm上 (with + new Function)   render.call(vm)
    const render = new Function(`with(this) { return ${code} }`);
    return render
  }

  // h() _c()
  function createElementVNode(vm, tag, data, ...children) {
    if (!data) {
      data = {};
    }

    const key = data.key;
    if (key) {
      delete data.key;
    }

    return vnode(vm, tag, key, data, children)
  }

  // _v()
  function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
  }

  // ast描述的是语法
  // 虚拟dom描述的是dom元素，可以增加一些自定义属性
  function vnode(vm, tag, key, data, children, text) {
    return {
      vm,
      tag,
      key,
      data,
      children,
      text
    }
  }

  // vue流程
  // 1.生成响应式数据
  // 2.模板转换成ast
  // 3.ast转成render函数
  // 4.后续每次更新都通过render函数，无需ast

  function createElm(vnode) {
    const { tag, data, children, text } = vnode;

    if (typeof tag === 'string') {
      // 标签
      vnode.el = document.createElement(tag);

      patchProps(vnode.el, data);

      // 处理子节点
      children.forEach(child => {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      // 文本
      vnode.el = document.createTextNode(text);
    }

    return vnode.el
  }

  function patchProps(el, props) {
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        if (key === 'style') {
          // style特殊处理
          for (const styleName in props.style) {
            if (props.style.hasOwnProperty(styleName)) {
              el.style[styleName] = props.style[styleName];
            }
          }
        } else {
          el.setAttribute(key, props[key]);
        }
      }
    }
  }

  function patch(oldVNode, vnode) {
    // 判断是不是真实的dom节点（处渲染是真实节点）
    const isRealElement = oldVNode.nodeType;
    if (isRealElement) {
      // 初渲染
      const elm = oldVNode;
      const parentElm = elm.parentNode;
      const newElm = createElm(vnode);
      parentElm.insertBefore(newElm, elm.nextSibling);
      parentElm.removeChild(elm);
      return newElm
    }
  }

  function initLifecycle(Vue) {
    Vue.prototype._update = function(vnode) {
      const vm = this;
      const el = vm.$el;
      // 初始化+更新
      vm.$el = patch(el, vnode);
    };

    // _c('div', {xxx}, ...children)
    Vue.prototype._c = function() {
      return createElementVNode(this, ...arguments)
    };

    // _v('text')
    Vue.prototype._v = function() {
      return createTextVNode(this, ...arguments)
    };

    // _s(name)
    Vue.prototype._s = function(v) {
      if (typeof v !== 'object') {
        return v
      }
      return JSON.stringify(v)
    };

    Vue.prototype._render = function() {
      const vm = this;

      // with中的this指向vm
      const vnode = vm.$options.render.call(vm);
      console.log('vnode——', vnode);

      // 渲染时从vnode实例中取值，将属性与视图绑定在一起
      return vnode
    };
  }

  function mountComponent(vm, el) {
    vm.$el = el;
    // 1. 调用render 生成虚拟节点（使用响应式数据）
    // 2. 根据虚拟dom生成真实dom
    // 3. 挂载到el上
    const updateComponent = () => {
      vm._update(vm._render());
    };

    new Watcher(vm, updateComponent, true); // true => 是一个渲染watcher
  }

  function callHooks(vm, hook) {
    const handlers = vm.$options[hook];

    if (handlers) {
      handlers.forEach(handler => handler.call(vm));
    }
  }

  const strats = {}; // 策略集

  const LIFECYCLE = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestory',
    'destoryed'
  ];

  // 生命周期的合并
  LIFECYCLE.forEach(hook => {
    strats[hook] = function(p, c) {
      if (c) {
        if (p) {
          return Array.isArray(c) ? p.concat(...c) : p.concat(c)
        } else {
          return Array.isArray(c) ? c : [c]
        }
      } else {
        return p
      }
    };
  });

  function mergeOptions(parent, child) {
    const options = {};

    for (const key in parent) {
      // 先处理原来的
      mergeField(key);
    }

    for (const key in child) {
      // 添加新的
      if (!parent.hasOwnProperty(key)) {
        mergeField(key);
      }
    }

    function mergeField(key) {
      // 策略模式
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        options[key] = child[key] || parent[key];
      }
    }

    return options
  }

  // 初始化
  function initMixin(Vue) {
    Vue.prototype._init = function(options) {
      const vm = this;

      // 将vue全局属性配置项 挂载到实例上
      vm.$options = mergeOptions(this.constructor.options, options);
      console.log('vue options————', this.$options);

      callHooks(vm, 'beforeCreate');
      // 初始化状态
      initState(vm);
      callHooks(vm, 'created');

      if (options.el) {
        vm.$mount(options.el);
      }
      // todo...
    };

    Vue.prototype.$mount = function(el) {
      const vm = this;
      const opts = vm.$options;

      el = document.querySelector(el);

      if (!opts.render) {
        let template;
        if (!opts.template && el) {
          template = el.outerHTML;
        } else if (el) {
          // runtime不包含模板编译，编译是打包时通过loader转义.vue文件，所有runtime不能用template配置
          template = opts.template; // 有模板优先用模板
        }

        if (template) {
          // 编译模板
          const render = compileToFunction(template);

          opts.render = render; // 如果是jsx build时最终编译成h('xxx')
        }
      }

      // 挂载组件
      mountComponent(vm, el);
    };
  }

  function initGlobalAPI(Vue) {
    // 静态方法
    Vue.options = {};

    Vue.mixin = function(mixin) {
      this.options = mergeOptions(this.options, mixin);
    };
  }

  // 用构造函数而不用class（避免所有方法耦合在一起）
  function Vue(options) {
    this._init(options);
  }

  Vue.prototype.$nextTick = nextTick;
  initMixin(Vue); // 扩展init方法
  initLifecycle(Vue);
  initGlobalAPI(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
