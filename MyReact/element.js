// MyReact/element.js

/**
 * 创建文本节点
 */
export function createTextElement(text) {
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

  if (text === false || text === null || text === undefined) {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: '',
        children: []
      }
    }
  }

  throw new Error(`无法创建文本节点：不支持的类型 ${typeof text}，值为 ${text}`)
}

/**
 * 创建虚拟 DOM
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
