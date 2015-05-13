(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global require*/
"use strict";

require("../../main");

document.addEventListener("DOMContentLoaded", function () {
	"use strict";
	document.dispatchEvent(new CustomEvent("o.DOMContentLoaded"));
});

},{"../../main":2}],2:[function(require,module,exports){
/*global require, module*/
"use strict";

var Header = require("./src/js/Header");

var constructAll = (function (_constructAll) {
  var _constructAllWrapper = function constructAll() {
    return _constructAll.apply(this, arguments);
  };

  _constructAllWrapper.toString = function () {
    return _constructAll.toString();
  };

  return _constructAllWrapper;
})(function () {
  Header.init();
  document.removeEventListener("o.DOMContentLoaded", constructAll);
});

document.addEventListener("o.DOMContentLoaded", constructAll);

module.exports = Header;

},{"./src/js/Header":3}],3:[function(require,module,exports){
"use strict";

function Header(rootEl) {}

/**
 * Initializes all header elements on the page or within the specified element.
 *
 * @param  [{HTMLElement}] element
 */
Header.init = function (element) {};

module.exports = Header;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy91YXJtb2FkLy5udm0vdjAuMTAuMzYvbGliL25vZGVfbW9kdWxlcy9vcmlnYW1pLWJ1aWxkLXRvb2xzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvdWFybW9hZC9Qcm9qZWN0cy9vcmlnYW1pL28taGUtaGVhZGVyL2RlbW9zL3NyYy9kZW1vLmpzIiwiL1VzZXJzL3Vhcm1vYWQvUHJvamVjdHMvb3JpZ2FtaS9vLWhlLWhlYWRlci9tYWluLmpzIiwiL1VzZXJzL3Vhcm1vYWQvUHJvamVjdHMvb3JpZ2FtaS9vLWhlLWhlYWRlci9zcmMvanMvSGVhZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FDQ0EsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDOztBQUV0QixRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsWUFBWTtBQUN6RCxhQUFZLENBQUM7QUFDYixTQUFRLENBQUMsYUFBYSxDQUFDLElBQUksV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztDQUM5RCxDQUFDLENBQUM7Ozs7QUNMSCxZQUFZLENBQUM7O0FBRWIsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7O0FBRXhDLElBQUksWUFBWTs7Ozs7Ozs7OztHQUFHLFlBQVk7QUFDN0IsUUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2QsVUFBUSxDQUFDLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLFlBQVksQ0FBQyxDQUFDO0NBQ2xFLENBQUEsQ0FBQzs7QUFFRixRQUFRLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLEVBQUUsWUFBWSxDQUFDLENBQUM7O0FBRTlELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDOzs7QUNaeEIsWUFBWSxDQUFDOztBQUViLFNBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUV2Qjs7Ozs7OztBQU9ELE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxPQUFPLEVBQUUsRUFFaEMsQ0FBQzs7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmdsb2JhbCByZXF1aXJlKi9cbnJlcXVpcmUoJy4uLy4uL21haW4nKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnby5ET01Db250ZW50TG9hZGVkJykpO1xufSk7XG4iLCIvKmdsb2JhbCByZXF1aXJlLCBtb2R1bGUqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgSGVhZGVyID0gcmVxdWlyZSgnLi9zcmMvanMvSGVhZGVyJyk7XG5cbnZhciBjb25zdHJ1Y3RBbGwgPSBmdW5jdGlvbiAoKSB7XG4gIEhlYWRlci5pbml0KCk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ28uRE9NQ29udGVudExvYWRlZCcsIGNvbnN0cnVjdEFsbCk7XG59O1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdvLkRPTUNvbnRlbnRMb2FkZWQnLCBjb25zdHJ1Y3RBbGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gSGVhZGVyKHJvb3RFbCkge1xuXG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYWxsIGhlYWRlciBlbGVtZW50cyBvbiB0aGUgcGFnZSBvciB3aXRoaW4gdGhlIHNwZWNpZmllZCBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSAgW3tIVE1MRWxlbWVudH1dIGVsZW1lbnRcbiAqL1xuSGVhZGVyLmluaXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcjtcbiJdfQ==
