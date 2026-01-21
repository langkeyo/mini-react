// App.jsx
/** @jsx MyReact.createElement */
// 👆这行注释告诉 Babel：遇到 JSX，请调用 MyReact.createElement，别调用 React.createElement

import * as MyReact from './MyReact.js'

function Counter() {
  const [count, setCount] = MyReact.useState(0)
  return (
    <div>
      <h1 style>Counter</h1>
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

MyReact.render(<App />, document.getElementById('root'))
