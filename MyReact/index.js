// MyReact/index.js
import { createElement, createTextElement } from './element.js'
import { render, useState, useEffect } from './reconciler.js'

// 咱们也得学学 React，默认导出一个对象，同时也可以解构导出
const MyReact = {
  createElement,
  createTextElement, // 虽然用户很少直接用这个
  render,
  useState,
  useEffect
}

export { createElement, render, useState, useEffect }
export default MyReact
