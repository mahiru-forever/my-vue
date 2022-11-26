import { parseHTML, ELEMENT_TYPE, TEXT_TYPE, defaultTagRE } from './parse'

function genProps(attrs) {
  let str = ''
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    let value = attr.value

    // style需要是个对象
    if (attr.name === 'style') {
      value = attr.value.split(';').reduce((prev, cur, index, arr) => {
        const [k, v] = cur.split(':')

        if (v === undefined) {
          return prev
        }

        prev[k.trim()] = v.trim()
        return prev
      }, {})
    }

    str += `${attr.name}:${JSON.stringify(value)},`
  }
  return `{${str.slice(0, -1)}}`
}

function gen(node) {
  if (node.type === ELEMENT_TYPE) {
    return codegen(node)
  }
  if (node.type === TEXT_TYPE) {
    const text = node.text

    // 纯文本
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`
    }

    // 包含变量
    const tokens = []
    let match
    let lastIndex = 0
    defaultTagRE.lastIndex = 0 // 全局匹配正则，重置index
    while ((match = defaultTagRE.exec(text))) {
      const { index } = match
      // 截取{{}}前面的文本内容
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)))
      }

      tokens.push(`_s(${match[1].trim()})`)

      lastIndex = index + match[0].length
    }

    // 处理最后一段文本内容
    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)))
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
  const children = genChildren(ast.children)
  let code = `_c('${ast.tag}', ${
    ast.attrs.length > 0 ? genProps(ast.attrs) : null
  }${ast.children.length > 0 ? `,${children}` : ''})`

  return code
}

// 对模板进行编译(vue3没有再采用正则，单个字符串匹配)
export function compileToFunction(template) {
  // 1. 将template转换成ast语法树
  const ast = parseHTML(template)
  // console.log('ast————', ast)

  // 2. 生成render方法（render方法生成虚拟dom）
  const code = codegen(ast)
  // console.log('code————', code)

  // 指定作用于，挂载到vm上 (with + new Function)   render.call(vm)
  const render = new Function(`with(this) { return ${code} }`)
  return render
}
