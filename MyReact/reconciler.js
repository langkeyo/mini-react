// MyReact/reconciler.js
import { createDom, updateDom } from './dom.js'

// ================= 全局变量 =================
let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null
let wipFiber = null
let hookIndex = null

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

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
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
