// src/main.js
import MyReact from '../MyReact/index.js'
import App from './App.jsx'

const root = document.getElementById('root')
MyReact.render(MyReact.createElement(App, null), root)
