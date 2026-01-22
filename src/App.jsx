// src/App.jsx

// 必须引入，为了让编译后的 createElement 有着落
import { useState } from '../MyReact/index.js'

function StyleTest() {
  const [toggle, setToggle] = useState(true)

  return (
    <div>
      <button
        style={toggle ? { color: 'red' } : { background: 'blue' }}
        onClick={() => setToggle(!toggle)}
      >
        切换样式
      </button>
    </div>
  )
}

function ClassTest() {
  const [toggle, setToggle] = useState(true)

  return (
    <div
      style={{
        padding: '32px 64px',
        borderRadius: '10px',
        background: '#fac',
        display: 'inline-block'
      }}
      className={toggle ? 'red' : 'blue'}
      onClick={() => setToggle(!toggle)}
    >
      切换 class
    </div>
  )
}

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>App Render</h1>
      <hr />
      <StyleTest />
      <hr />
      <ClassTest />
    </div>
  )
}
