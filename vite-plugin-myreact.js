export default function myReactPlugin() {
  return {
    name: 'vite-plugin-myreact',
    config() {
      return {
        esbuild: {
          jsxFactory: 'createElement',
          jsxFragment: 'Fragment'
        }
      }
    },
    transform(code, id) {
      if (id.endsWith('.jsx')) {
        // 自动在每个 JSX 文件前面加上 import
        const inject = `import { createElement, Fragment } from 'myreact'\n`
        return {
          code: inject + code,
          map: null
        }
      }
    }
  }
}
