// src/main.jsx

// 必须引入，为了让编译后的 createElement 有着落
import {
  createElement,
  render,
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo
} from '../MyReact/index.js'

// 1. 一个普通的子组件（没加 memo）
// 每次父组件更新，它都会打印
function NormalChild({ name }) {
  console.log(`😭 ${name} 居然被渲染了！明明我没变！`)
  return <p>我是 {name} (普通组件)</p>
}

// 2. 一个加了 memo 的子组件
// 只有 name 变了，它才会打印
const MemoChild = memo(function ({ name }) {
  console.log(`😄 ${name} 渲染了（因为名字变了）`)
  return <p style={{ color: 'green' }}>我是 {name} (Memo组件)</p>
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>MyReact Memo Test</h1>
      <h2>父组件 Count: {count}</h2>
      <button onClick={() => setCount((c) => c + 1)}>父组件 + 1</button>

      <div
        style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}
      >
        {/* 情况A：Prop 没变 */}
        <NormalChild name="普通小明" />
        <MemoChild name="Memo小红" />
      </div>
    </div>
  )
}

const root = document.getElementById('root')
render(<App />, root)
