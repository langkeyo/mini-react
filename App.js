function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// App.jsx
/** @jsx MyReact.createElement */
// 👆这行注释告诉 Babel：遇到 JSX，请调用 MyReact.createElement，别调用 React.createElement

import * as MyReact from './MyReact.js';
function Counter() {
  var _MyReact$useState = MyReact.useState(0),
    _MyReact$useState2 = _slicedToArray(_MyReact$useState, 2),
    count = _MyReact$useState2[0],
    setCount = _MyReact$useState2[1];
  return MyReact.createElement("div", null, MyReact.createElement("h1", {
    style: true
  }, "Counter"), MyReact.createElement("button", {
    className: "button",
    onClick: function onClick() {
      return setCount(function (c) {
        return c + 1;
      });
    }
  }, "\u70B9\u6211 \u4E0D\u4F1A\u589E\u52A0\uFF0C\u4F1A\u5361\u4F4F\uFF01 ", count));
}
function App() {
  return MyReact.createElement("div", {
    className: "app"
  }, MyReact.createElement("h1", {
    style: {
      color: 'yellow'
    }
  }, "Bug \u6F14\u793A\u73B0\u573A"), MyReact.createElement(Counter, null));
}
MyReact.render(MyReact.createElement(App, null), document.getElementById('root'));