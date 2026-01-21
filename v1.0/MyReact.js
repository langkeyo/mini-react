// v1.0
// // MyReact.js
// // 全局变量，存状态
// let wipRoot = null // 暂时不用，先不管
// let hookIndex = 0 // 游标：当前正在处理第几个 hook
// let hooks = [] // 仓库：存放所有的 state

// /**
//  * 创建文本节点
//  * @param {string|number|bigint|boolean|null|undefined|symbol|object|Function} text
//  * @returns
//  */
// export function createTextElement(text) {
//   // 1. 核心处理：string/number/BigInt
//   if (
//     typeof text === 'string' ||
//     typeof text === 'number' ||
//     typeof text === 'bigint'
//   ) {
//     return {
//       type: 'TEXT_ELEMENT',
//       props: {
//         nodeValue: text,
//         children: []
//       }
//     }
//   }

//   // 2. 容错处理：false/null/undefined
//   if (text === false || text === null || text === undefined) {
//     return {
//       type: 'TEXT_ELEMENT',
//       props: {
//         nodeValue: '',
//         children: []
//       }
//     }
//   }

//   // 3. 非法类型 Symbol/对象/函数等
//   throw new Error(`无法创建文本节点：不支持的类型 ${typeof text}，值为 ${text}`)
// }

// /**
//  * 创建虚拟 DOM
//  * @param {string|Function} type
//  * @param {object} props
//  * @param  {string|number|bigint|boolean|null|undefined|symbol|object|Function} children
//  * @returns
//  */
// export function createElement(type, props, ...children) {
//   return {
//     type,
//     props: {
//       ...props,
//       children: children
//         .filter(
//           (c) => c !== null && c !== undefined && c !== false && c !== true
//         )
//         .map((child) =>
//           typeof child === 'object' ? child : createTextElement(child)
//         )
//     }
//   }
// }

// /**
//  *
//  * @param {object} element
//  * @returns
//  */
// function createDom(element) {
//   const dom =
//     element.type === 'TEXT_ELEMENT'
//       ? document.createTextNode(element.props.nodeValue)
//       : document.createElement(element.type)

//   const isProperty = (key) => key !== 'children'
//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       if (name.startsWith('on')) {
//         const eventType = name.toLowerCase().substring(2)
//         dom.addEventListener(eventType, element.props[name])
//       }
//       if (name === 'className' && typeof element.props[name] === 'object') {
//         Object.assign(dom.classList, element.props[name])
//       }
//       if (name === 'style' && typeof element.props[name] === 'object') {
//         Object.assign(dom.style, element.props[name])
//       } else {
//         dom[name] = element.props[name]
//       }
//     })

//   return dom
// }

// let rootElement, rootContainer

// export function render(element, container) {
//   rootElement = element // 保存顶层 vnode
//   rootContainer = container
//   rerender()
// }

// function commitRender(element, container) {
//   if (!element) return

//   // 新增逻辑：处理函数组件
//   if (typeof element.type === 'function') {
//     // 1. 只有在这个时刻，我们才去执行函数！
//     // 相当于运行 App() 或者 Counter()
//     const componentFunction = element.type
//     const componentProps = element.props

//     // 执行函数，得到类似 <div>...</div> 的结果
//     const childElement = componentFunction(componentProps)

//     // 2. 递归处理这个结果，把它挂载到当前的 container 上
//     commitRender(childElement, container)
//     return // 这个函数组件本身不对应真实的 DOM 节点，所以处理完它的孩子就结束
//   }

//   const dom = createDom(element)

//   // ⚠ 这里要注意：如果你的 element 是 div，它的 children 里可能有函数组件
//   // 所以这里递归，自然会回到上面的 if (typeof ... === 'function') 逻辑里
//   element.props.children.forEach((child) => commitRender(child, dom))

//   container.appendChild(dom)
// }

// export function rerender() {
//   hookIndex = 0 // 👈 必须重置！让组件从头开始取 state
//   rootContainer.innerHTML = ''
//   commitRender(rootElement, rootContainer)
// }

// export function useState(initial) {
//   // 1. 看看仓库里这个位置有没有旧值？
//   // 这里的 hooks[hookIndex] 就是之前存的 state
//   const oldHook = hooks[hookIndex]

//   // 2. 判断是否需要初始化
//   // 如果旧值不是 undefined，说明已经有值了，直接用。
//   // 如果是 undefined，说明是第一次渲染，使用 initial。
//   // 注意这里必须用严格判断，因为有时候你定义的时候，
//   // 💀 会用到 布尔 甚至 0 以及 空字符串 和 null。💀
//   const state = oldHook !== undefined ? oldHook : initial

//   // 如果是第一次，一定要把初始值存进仓库！
//   // 这样下一次 setState 取 hooks[currentHookIndex] 的时候才能取到值
//   // 只要 oldHook 不是 undefined（哪怕是 false/0/空字符串），我都认它是有效值
//   if (oldHook === undefined) hooks[hookIndex] = state

//   // 3. 记录当前的 index，为了下面 setState 闭包里能引用到正确的索引
//   const currentHookIndex = hookIndex

//   // 4. 定义 setState 函数
//   const setState = (action) => {
//     // 这里要重新从 hooks 里拿到最新的值，确保拿到的是上一次修改后的
//     const oldState = hooks[currentHookIndex]

//     // 如果 action 是函数，就执行函数拿到新值，否则直接拿值
//     const newState =
//       action instanceof Function ? action(hooks[currentHookIndex]) : action

//     // 对比新旧值，如果没变就不更新了（这里先简单处理，暂时不加 diff）
//     // 把新值存回仓库对应的位置
//     hooks[currentHookIndex] = newState

//     // 关键：每次 setState 都要触发重新渲染！
//     rerender()
//   }

//   // 5. 游标 + 1，为下一个 useState 腾位置
//   hookIndex++

//   // 6. 返回 React 标准格式
//   return [state, setState]
// }
