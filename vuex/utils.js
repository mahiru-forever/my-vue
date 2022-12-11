export function foreachValue(target, cb) {
  Object.keys(target).forEach(key => cb(key, target[key]))
}
