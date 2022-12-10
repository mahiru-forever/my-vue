import Base from './base'

function ensureSlash() {
  if (window.location.hash) {
    return
  }
  window.location.hash = '/'
}

function getHash() {
  return window.location.hash.slice(1)
}

class HashHistory extends Base {
  constructor(router) {
    super(router)

    // 初始化hash路由 要给定一个默认的hash路径 /
    ensureSlash()
  }

  // 监听hash变化
  setupListener() {
    window.addEventListener('hashchange', () => {
      // 路由变化也会执行transitonTo
      this.transitonTo(getHash())
    })
  }

  jump(location) {
    window.location.hash = location
  }

  getCurrentLocation() {
    return getHash()
  }
}

export default HashHistory
