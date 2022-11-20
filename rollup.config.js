import babel from 'rollup-plugin-babel'
import pluginNodeResolve from '@rollup/plugin-node-resolve'

export default {
  input: './src/index.js',
  output: {
    file: './dist/vue.js',
    name: 'Vue', // global.Vue
    format: 'umd', // esm es6 commonjs iife umd(amd+commonjs)
    sourcemap: true
  },
  plugin: [
    babel({
      exclude: 'node_modules/**' // 排除node_modules所有文件
    }),
    pluginNodeResolve()
  ]
}
