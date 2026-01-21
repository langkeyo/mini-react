// MyReact.js

// 全局变量
let nextUnitOfWork = null // 下一个要执行的任务（Fiber 节点）
let currentRoot = null // 记录上一次提交的 Fiber 树（旧树）
let wipRoot = null // 正在构建的 Fiber 树（新树）
let deletions = null // 需要删除的节点（先暂时不处理复杂的删除，留个位子）
// 专供函数组件运行时使用
let wipFiber = null
let hookIndex = null

/**
 * 创建文本节点
 * @param {string|number|bigint|boolean|null|undefined|symbol|object|Function} text
 * @returns
 */
export function createTextElement(text) {
  // 1. 核心处理：string/number/BigInt
  if (
    typeof text === 'string' ||
    typeof text === 'number' ||
    typeof text === 'bigint'
  ) {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: text,
        children: []
      }
    }
  }

  // 2. 容错处理：false/null/undefined
  if (text === false || text === null || text === undefined) {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: '',
        children: []
      }
    }
  }

  // 3. 非法类型 Symbol/对象/函数等
  throw new Error(`无法创建文本节点：不支持的类型 ${typeof text}，值为 ${text}`)
}

/**
 * 创建虚拟 DOM
 * @param {string|Function} type
 * @param {object} props
 * @param  {string|number|bigint|boolean|null|undefined|symbol|object|Function} children
 * @returns
 */
export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children
        .filter(
          (c) => c !== null && c !== undefined && c !== false && c !== true
        )
        .map((child) =>
          typeof child === 'object' ? child : createTextElement(child)
        )
    }
  }
}

/**
 *
 * @param {object} element
 * @returns
 */
function createDom(element) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode(element.props.nodeValue)
      : document.createElement(element.type)

  const isProperty = (key) => key !== 'children'
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      if (name.startsWith('on')) {
        const eventType = name.toLowerCase().substring(2)
        dom.addEventListener(eventType, element.props[name])
      }
      if (name === 'className' && typeof element.props[name] === 'object') {
        Object.assign(dom.classList, element.props[name])
      }
      if (name === 'style' && typeof element.props[name] === 'object') {
        Object.assign(dom.style, element.props[name])
      } else {
        dom[name] = element.props[name]
      }
    })

  return dom
}

/**
 *
 * @param {HTMLElement|Node} dom
 * @param {Object} prevProps
 * @param {object} nextProps
 */
function updateDom(dom, prevProps, nextProps) {
  // 辅助函数：判断是否是事件（以 on 开头）
  const isEvent = (key) => key.startsWith('on')
  // 辅助函数：判断是否是属性（不吃 children 且不是事件）
  const isProperty = (key) => key !== 'children' && !isEvent(key)
  // 辅助函数：判断是否是新属性（新旧值不相等）
  const isNew = (prev, next) => (key) => prev[key] !== next[key]
  // 辅助函数：判断属性是否被移除（新 props 里没有这个 key）
  const isGone = (prev, next) => (key) => !(key in next)

  // 1.【删除】旧的事件监听
  // 如果新 props 里没有这个事件，或者事件回调函数变了，就需要把旧的删掉
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      // ⚠ 重点：removeEventListener 必须传入旧的回调函数
      dom.removeEventListener(eventType, prevProps[name])
    })

  // 2.【删除】旧的属性
  // 如果旧 props 里有，但新 props 里没了，就置空
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = ''
    })

  // 3.【设置】新的/改变的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // 针对 style 特殊处理一下，防止覆盖整个 style 对象
      if (name === 'style') {
        // 这里简单的做一个覆盖，更完善的 React 会逐项 diff style
        Object.assign(dom.style, nextProps[name] || {})
      } else {
        // 普通属性直接赋值，比如 className，id，title 等
        dom[name] = nextProps[name]
      }
    })

  // 4.【新增】新的事件监听
  // 只有新的或者改变的事件才添加
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

// 专门用于删除节点的辅助函数
function commitDeletion(fiber, domParentFiber) {
  // 安全防御：如果 fiber 本身是 null，直接返回
  if (!fiber) return

  if (fiber.dom) {
    // 如果当前 fiber 有 DOM，直接删
    // 需要找到真正的 DOM 父节点
    let parent = domParentFiber
    while (!parent.dom) {
      parent = parent.return
    }
    parent.dom.removeChild(fiber.dom)
  } else {
    // 如果是函数组件（没 DOM），就递归删除它的子节点
    commitDeletion(fiber.child, domParentFiber)
  }
}

// 递归提交 DOM 修改（这里还是可以用递归的，因为 DOM 操作必须同步且快）
function commitWork(fiber) {
  if (!fiber) {
    return
  }

  // 处理删除情况
  if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, fiber.return)
    return // 删完就不用管它的子节点了，直接返回
  }

  // 1. 向上查找最近的 有 DOM 的祖先
  let domParentFiber = fiber.return
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.return
  }
  const domParent = domParentFiber.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }

  // 3. 递归处理子节点和兄弟节点
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

// 一次性把改动提交到 DOM
function commitRoot() {
  // 1. 先处理需要删除的节点
  deletions.forEach(commitWork)

  // 2. 在处理剩下的新增和更新
  commitWork(wipRoot.child)

  // 关键点：提交完成后，当前的新树就变成了 “旧树”
  currentRoot = wipRoot
  // 提交完后，把 wipRoot 清空，防止无限循环提交
  wipRoot = null
}

// 调度逻辑（The Loop）

/**
 * 浏览器的调度循环
 * @param {IdleDeadline} deadline 浏览器传给我们的，告诉我们还剩多少时间
 */
function workLoop(deadline) {
  // 这里的逻辑是：
  // 1. 如果还有任务要做（nextUnitOfWork）
  // 2. 并且浏览器当前帧还有剩余时间（shouldYield 为 false）
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    // 执行一个任务单元，并返回下一个要执行的任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)

    // 看看时间还够不够，不够就得把控制权还给浏览器，等下一帧再接着干
    shouldYield = deadline.timeRemaining() < 1
  }

  // 新增：如果没任务了，并且根节点还存在，说明构建完成了，开始提交！
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  // 只要还有任务或者将来有任务，就继续请求浏览器的空闲时间
  requestIdleCallback(workLoop)
}

// 启动引擎！
requestIdleCallback(workLoop)

/**
 * 协调子节点：将 VNode 数组转换成 Fiber 链表
 * @param {Fiber} wipFiber 当前正在工作的 Fiber（爸爸）
 * @param {Array} elements 子节点 VNode 数组
 */
function reconcileChildren(wipFiber, elements) {
  let index = 0

  // 拿到旧 Fiber 的第一个孩子
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child // 暂时先不实现 diff，这里留个坑，后面会用到

  let prevSibling = null // 用于记录上一个兄弟，以便连接链表

  // 同时遍历 新的子元素数组 和 旧的 Fiber 链表
  while (index < elements.length || oldFiber !== null) {
    const element = elements[index]
    let newFiber = null

    // TODO: 这里其实需要比较 key 和 type，为了教学简化，我们先默认位置对上了就是同一个
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      // 情况1：节点复用（Update）
      // 如果类型一样（比如都是 div），我们就复用旧节点
      // 重点：要把 oldFiber.dom 和 oldFiber.alternate 传给新节点
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom, // 复用 DOM，不用重新创建
        return: wipFiber,
        alternate: oldFiber, // 这一步至关重要！也就是这里让 fiber 拿到了旧 fiber 的state
        effectTag: 'UPDATE'
      }
    }

    if (element && !sameType) {
      // 情况2：新增节点（Placement）
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        return: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }

    // 情况3：删除（Deletion）
    // 如果有旧节点，但是没有匹配上（类型不同，或者新节点不存在了）
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber) // 加入垃圾桶
    }

    // 移动旧链表的指针
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    // 只有当 newFiber 不为 null 时才构建链表
    if (newFiber) {
      // 关键步骤：构建链表
      if (index === 0) {
        // 如果是第一个孩子，它就是父节点的 child
        wipFiber.child = newFiber
      }
      // 同时确保 prevSibling 也不为 null
      else if (prevSibling) {
        // 如果不是第一个，它是前一个兄弟的 sibling
        prevSibling.sibling = newFiber
      }

      // 移动指针
      prevSibling = newFiber
    }
    index++
  }
}

/**
 * 处理原生标签（Host Component）
 * 1. 创建真实 DOM
 * 2. 协调子元素
 * @param {object} fiber
 */
function updateHostComponent(fiber) {
  // 给当前 Fiber 创建 DOM 节点
  // 注意：我们只创建，不挂载！挂载放到最后一口气完成（Commit 阶段）
  // 否则用户会看到界面一点点画出来的过程（UI撕裂）
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  // 原生标签的 children 就在 props 里
  reconcileChildren(fiber, fiber.props.children)
}

/**
 * 处理函数组件
 * 1. 执行函数
 * 2. 协调子元素
 * @param {object} fiber
 */
function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = [] // 每个组件都有自己的 hooks 数组了！

  // 执行函数组件，比如 App()，拿到返回值（即 VNode）
  const children = [fiber.type(fiber.props)]

  // 把返回的 VNode 转成 Fiber 链表
  reconcileChildren(fiber, children)
}

/**
 * 核心：处理一个 Fiber 节点，并返回下一个 Fiber 节点
 * 1. 创建真实 DOM（如果不存在）
 * 2. 协调子元素（创建子 Fiber）
 * 3. 返回下一个任务
 * @param {object} fiber 当前要处理的 Fiber
 */
function performUnitOfWork(fiber) {
  // 1. 判断是函数组件还是原生标签
  const isFunctionComponent = fiber.type instanceof Function

  // 2. 分流处理
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // 3. 寻找下一个任务（遍历顺序：子 -> 兄 -> 叔）

  // 3.1 如果有孩子，先处理孩子
  if (fiber.child) {
    return fiber.child
  }

  // 3.2 如果没孩子，就找兄弟
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    // 3.3 如果没兄弟，就找叔叔（回溯到父节点找父节点的兄弟）
    nextFiber = nextFiber.return
  }
}

// 新的入口
export function render(element, container) {
  // 以前是直接递归，现在我们只是创建一个 “根任务”
  // 这就是整棵 Fiber 树的 “始祖”
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    // 关键点：把旧树关联给新树的 alternate 属性
    alternate: currentRoot,
    // 链表指针初始化
    child: null,
    sibling: null,
    return: null
  }

  // 每次渲染，都清空垃圾桶
  deletions = []

  // 把根任务赋值给 nextUnitOfWork，这样 workLoop 就会在浏览器空闲时开始工作了
  nextUnitOfWork = wipRoot
}

export function useState(initial) {
  // 1. 获取旧的 hook
  // 我们正在出处理 wipFiber，通过 alternate 找到旧 Fiber
  // 然后通过 hookIndex 找到对应的旧 hook
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  // 2. 初始化 hook
  // 如果有旧 hook，就把它的 state 拿过来继承
  // 如果没有（第一次渲染），就用 initial
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [] // 用来存储 seState 的 update 动作
  }

  // 3. 执行 action（如果有的话）
  // 也就是处理 setState((c) => c + 1) 这种
  // 在这里，我们会看看上一轮渲染有没有遗留的操作
  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    // 如果是函数就执行，不是就直接覆盖
    hook.state = action instanceof Function ? action(hook.state) : action
  })

  // 4. 定义 setState
  const setState = (action) => {
    // 我们不直接修改 hook.state，而是把它推入队列
    // 这样下次渲染时，上面的步骤 3 会处理它
    hook.queue.push(action)

    // 关键：触发重新渲染！
    // 怎么触发？把 wipRoot 重置为 currentRoot，start workLoop again
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  // 5. 保存 hook 到当前 Fiber
  wipFiber.hooks.push(hook)
  hookIndex++

  return [hook.state, setState]
}
