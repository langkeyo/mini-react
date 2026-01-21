// App.jsx
/** @jsx createElement */
// 👆这行注释告诉 Babel：遇到 JSX，请调用 createElement，别调用 React.createElement

import { createElement, render, useEffect, useState } from './MyReact/index.js'

function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('副作用执行了！count 变成了', count)
  }, [count])
  return (
    <div>
      <h1>Counter</h1>
      <button className="button" onClick={() => setCount((c) => c + 1)}>
        点我 不会增加，会卡住！ {count}
      </button>
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <h1 style={{ color: 'yellow' }}>Bug 演示现场</h1>
      <Counter />
    </div>
  )
}

render(<App />, document.getElementById('root'))
