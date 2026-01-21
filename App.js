function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// App.jsx
/** @jsx createElement */
// 👆这行注释告诉 Babel：遇到 JSX，请调用 createElement，别调用 React.createElement

import { createElement, render, useEffect, useState } from './MyReact/index.js';
function Counter() {
  var _useState = useState(0),
    _useState2 = _slicedToArray(_useState, 2),
    count = _useState2[0],
    setCount = _useState2[1];
  useEffect(function () {
    console.log('副作用执行了！count 变成了', count);
  }, [count]);
  return createElement("div", null, createElement("h1", null, "Counter"), createElement("button", {
    className: "button",
    onClick: function onClick() {
      return setCount(function (c) {
        return c + 1;
      });
    }
  }, "\u70B9\u6211 \u4E0D\u4F1A\u589E\u52A0\uFF0C\u4F1A\u5361\u4F4F\uFF01 ", count));
}
function App() {
  return createElement("div", {
    className: "app"
  }, createElement("h1", {
    style: {
      color: 'yellow'
    }
  }, "Bug \u6F14\u793A\u73B0\u573A"), createElement(Counter, null));
}
render(createElement(App, null), document.getElementById('root'));