// MyReact/dom.js

/**
 * 创建真实 DOM
 */
export function createDom(element) {
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
 * 更新真实 DOM
 */
export function updateDom(dom, prevProps, nextProps) {
  const isEvent = (key) => key.startsWith('on')
  const isProperty = (key) => key !== 'children' && !isEvent(key)
  const isNew = (prev, next) => (key) => prev[key] !== next[key]
  const isGone = (prev, next) => (key) => !(key in next)

  // 1. 删除旧事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // 2. 删除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = ''
    })

  // 3. 设置新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (name === 'style') {
        Object.assign(dom.style, nextProps[name] || {})
      } else {
        dom[name] = nextProps[name]
      }
    })

  // 4. 添加新事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}
