// 扁平化路由信息
export default function createRouteMap(routes, pathMap) {
  pathMap = pathMap || {}
  routes.forEach(route => {
    addRouteRecord(route, pathMap)
  })

  return { pathMap }
}

function addRouteRecord(route, pathMap, parentRecord) {
  const path = (parentRecord
    ? `${parentRecord.path === '/' ? '/' : parentRecord.path + '/'}/${
        route.path
      }`
    : route.path
  ).replace(/\/\//g, '/')

  const record = {
    path,
    component: route.component,
    props: route.props,
    meta: route.meta,
    parent: parentRecord
  }
  if (!pathMap[path]) {
    // 维护路径对应的属性
    pathMap[path] = record
  }

  route.children &&
    route.children.forEach(child => {
      addRouteRecord(child, pathMap, record)
    })
}
