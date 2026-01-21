// src/main.jsx

// 必须引入，为了让编译后的 createElement 有着落
import { createElement, render, useEffect, useState } from '../MyReact/index.js'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('effect', count)
  }, [count])

  return (
    <div style={{ padding: '20px', border: '1px solid red' }}>
      <h1>Hello Vite + MyReact</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>点我加1</button>
    </div>
  )
}

const root = document.getElementById('root')
render(<App />, root)
