import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    // 关键点在这里！
    // 告诉 esbuild：看到 JSX，就把它编译成 createElement
    jsxFactory: 'createElement',

    // 这一行是处理 <> </> 空标签的（Fragment），咱们还没实现 Fragment，先不管，或者是先留个位子
    jsxFragment: 'Fragment'
  }
})
