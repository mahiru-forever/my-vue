const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 标签名 <div
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`) // 结束标签名 </div>
// 匹配属性 attr="xxx" attr='xxx' attr=xxx  正则1名字 345值
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// 开始标签结束 or 自闭合标签 <div> <br/>
const startTagClose = /^\s*(\/?)>/
// 模板字符串 {{ xxxx }}
export const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g

export const ELEMENT_TYPE = 1
export const TEXT_TYPE = 3

export function parseHTML(html) {
  const stack = [] // 存放元素
  let currentParent // 栈最后一个元素
  let root

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
    const node = createASTElement(tagName, attrs)

    // 是根节点
    if (!root) {
      root = node
    }

    if (currentParent) {
      node.parent = currentParent
      currentParent.children.push(node)
    }

    stack.push(node)
    currentParent = node
  }

  function chars(text) {
    // 空格超过2个，转为一个空格
    // text = text.replace(/\s{2,}/g, ' ')
    text = text.replace(/\s/g, '')
    if (text === '') {
      return
    }

    // 文本直接指向当前父节点
    currentParent.children.push({
      type: TEXT_TYPE,
      text,
      parent: currentParent
    })
  }

  function end(tagName) {
    // 校验标签
    // if (currentParent.tagName !== tagName) {
    //   console.error(`标签不合法<${currentParent.tagName}></${tagName}>`)
    //   return
    // }

    stack.pop()
    currentParent = stack[stack.length - 1]
  }

  function advance(len) {
    html = html.substring(len)
  }

  function parseStartTag() {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1], // 标签名
        attrs: []
      }
      advance(start[0].length)

      // 一直匹配到不是开始标签结束
      let attr, end
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        advance(attr[0].length)
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || true
        })
      }

      if (end) {
        advance(end[0].length)
      }

      return match
    }

    return false
  }

  while (html) {
    // textEnd === 0 开始标签 or 结束标签
    // textEnd > 0 文本结束的位置
    const textEnd = html.indexOf('<')

    if (textEnd === 0) {
      const startTagMatch = parseStartTag() // 开始标签匹配结果

      // 是开始标签
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }

      // 结束标签
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        end(endTagMatch[1])
        advance(endTagMatch[0].length)
      }
    }

    if (textEnd > 0) {
      let text = html.substring(0, textEnd) // 文本内容

      if (text) {
        chars(text)
        advance(text.length)
      }
    }
  }

  return root
}
