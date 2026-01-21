// MyReact/reconciler.js
import { createDom, updateDom } from './dom.js'

// ================= 全局变量 =================
let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null
let wipFiber = null
let hookIndex = null

// 简单的浅比较
function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true

  // 如果其中一个是 null 或者是基本类型，那就直接看上面等不等，不等就是 false
  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false
  }

  return true
}

// ================= Commit 阶段 =================

function commitDeletion(fiber, domParentFiber) {
  if (!fiber) return
  if (fiber.dom) {
    let parent = domParentFiber
    while (!parent.dom) {
      parent = parent.return
    }
    parent.dom.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParentFiber)
  }
}

function commitEffectHook(fiber) {
  if (!fiber) return
  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.tag === 'effect' && hook.callback) {
        hook.callback()
      }
    })
  }
  commitEffectHook(fiber.child)
  commitEffectHook(fiber.sibling)
}

function commitWork(fiber) {
  if (!fiber) return
  if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, fiber.return)
    return
  }

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

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  // 执行副作用
  commitEffectHook(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

// ================= Render / Reconcile 阶段 =================

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber = null
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        return: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        return: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (newFiber) {
      if (index === 0) {
        wipFiber.child = newFiber
      } else if (prevSibling) {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
    }
    index++
  }
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

/**
 * 处理函数组件
 */
function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []

  // ================= 改动开始 =================

  // 1. 拿到真实的组件函数
  // 如果是 memo 包裹的，fiber.type 是个对象，函数在 fiber.type.fn 里
  // 如果是普通组件，fiber.type 就是函数本身
  let component = fiber.type
  let isMemo = false

  // 检查是不是 memo 组件
  if (fiber.type && fiber.type.type === 'MEMO') {
    isMemo = true
    component = fiber.type.fn
  }

  // 2. 检查是否可以“偷懒”（Bailout）
  // 条件：是 memo 组件 && 有旧 fiber && props 没变
  if (
    isMemo &&
    fiber.alternate &&
    fiber.alternate.child // 确保旧树有孩子，没孩子得重新跑
  ) {
    const oldProps = fiber.alternate.props
    const newProps = fiber.props

    // 如果用户传了自定义比较器用用户的，没传用 shallowEqual
    const compare = fiber.type.propsAreEqual || shallowEqual

    // 如果 props 没变，直接复用！
    if (compare(oldProps, newProps)) {
      // 【高能预警】这里是“偷天换日”的核心！
      // 我们直接把旧 fiber 的孩子拿过来，当做新 fiber 的孩子
      fiber.child = fiber.alternate.child

      // 这里的逻辑有点绕：因为我们偷了旧节点，
      // 我们需要把旧节点的“父亲”指针，指向现在的 fiber
      let child = fiber.child
      while (child) {
        child.return = fiber
        child = child.sibling
      }

      // 完事！不需要 reconcileChildren 了，直接返回
      return
    }
  }

  // ================= 改动结束 =================

  // 如果不能偷懒，就老老实实执行组件函数
  const children = [component(fiber.props)]
  reconcileChildren(fiber, children)
}

function performUnitOfWork(fiber) {
  // 修改判断逻辑：不仅看是不是 Function，还要看是不是 MEMO 对象
  const isFunctionComponent =
    fiber.type instanceof Function || (fiber.type && fiber.type.type === 'MEMO')

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) return fiber.child
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.return
  }
}

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

// ================= 导出 API =================

export function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

// ================= Hooks =================

export function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = action instanceof Function ? action(hook.state) : action
  })

  const setState = (action) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

export function useEffect(callback, deps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hasChanged = deps
    ? !oldHook || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true

  const hook = {
    tag: 'effect',
    callback: hasChanged ? callback : null,
    deps: deps
  }

  wipFiber.hooks.push(hook)
  hookIndex++
}

/**
 * useMemo
 * @param {Function} callback 返回值的生成函数
 * @param {Array} deps 依赖数组
 */
export function useMemo(callback, deps) {
  // 1. 获取旧的 hook
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  // 2. 判断依赖变没变
  const hasChanged = deps
    ? !oldHook || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true

  // 3. 核心逻辑：
  // 如果变了，就执行 callback 拿到新值（value）
  // 如果没变，就复用旧 hook 里的值
  const value = hasChanged ? callback() : oldHook.value

  // 4. 构建新 hook
  // 这里我们要存两个东西：value（结果）和 deps（依赖）
  wipFiber.hooks.push({
    tag: 'memo', // 标记一下，虽然暂时没啥大用，方便调试
    value,
    deps
  })

  hookIndex

  // 5. 返回结果
}

/**
 * useCallback
 * @param {Function} callback 咱们要缓存的函数
 * @param {Array} deps 依赖数组
 */
export function useCallback(callback, deps) {
  // 逻辑一模一样，直接赋值粘贴 useMemo 的逻辑都行，就改一个地方
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hasChanged = deps
    ? !oldHook || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true

  // 重点在这：useCallback 缓存的是 callback 本身，不是 callback() 的结果！
  const callbackToReturn = hasChanged ? callback : oldHook.callback

  wipFiber.hooks.push({
    tag: 'callback',
    callback: callbackToReturn, // 存汉纳树
    deps
  })

  hookIndex++

  return callbackToReturn
}
