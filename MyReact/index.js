// MyReact/index.js
import { createElement, createTextElement } from './element.js'
import {
  render,
  useState,
  useEffect,
  useMemo,
  useCallback
} from './reconciler.js'

// 咱们也得学学 React，默认导出一个对象，同时也可以解构导出
const MyReact = {
  createElement,
  createTextElement, // 虽然用户很少直接用这个
  render,
  useState,
  useEffect,
  useMemo,
  useCallback
}

/**
 * memo 函数
 * @param {Function} component 你的函数组件
 * @param {Function} propsAreEqual 可选，自定义函数
 */
export function memo(component, propsAreEqual) {
  return {
    type: 'MEMO',
    fn: component,
    propsAreEqual: propsAreEqual || null
  }
}

export { createElement, render, useState, useEffect, useMemo, useCallback }
export default MyReact
