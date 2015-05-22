(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint browser:true, node:true*/

"use strict";

module.exports = Delegate;

/**
 * DOM event delegator
 *
 * The delegator will listen
 * for events that bubble up
 * to the root node.
 *
 * @constructor
 * @param {Node|string} [root] The root node or a selector string matching the root node
 */
function Delegate(root) {

  /**
   * Maintain a map of listener
   * lists, keyed by event name.
   *
   * @type Object
   */
  this.listenerMap = [{}, {}];
  if (root) {
    this.root(root);
  }

  /** @type function() */
  this.handle = Delegate.prototype.handle.bind(this);
}

/**
 * Start listening for events
 * on the provided DOM element
 *
 * @param  {Node|string} [root] The root node or a selector string matching the root node
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.root = function (root) {
  var listenerMap = this.listenerMap;
  var eventType;

  // Remove master event listeners
  if (this.rootElement) {
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, false);
      }
    }
  }

  // If no root or root is not
  // a dom node, then remove internal
  // root reference and exit here
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }

  /**
   * The root node at which
   * listeners are attached.
   *
   * @type Node
   */
  this.rootElement = root;

  // Set up master event listeners
  for (eventType in listenerMap[1]) {
    if (listenerMap[1].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, true);
    }
  }
  for (eventType in listenerMap[0]) {
    if (listenerMap[0].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, false);
    }
  }

  return this;
};

/**
 * @param {string} eventType
 * @returns boolean
 */
Delegate.prototype.captureForType = function (eventType) {
  return ["blur", "error", "focus", "load", "resize", "scroll"].indexOf(eventType) !== -1;
};

/**
 * Attach a handler to one
 * event for all elements
 * that match the selector,
 * now or in the future
 *
 * The handler function receives
 * three arguments: the DOM event
 * object, the node that matched
 * the selector while the event
 * was bubbling and a reference
 * to itself. Within the handler,
 * 'this' is equal to the second
 * argument.
 *
 * The node that actually received
 * the event can be accessed via
 * 'event.target'.
 *
 * @param {string} eventType Listen for these events
 * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
 * @param {function()} handler Handler function - event data passed here will be in event.data
 * @param {Object} [eventData] Data to pass in event.data
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.on = function (eventType, selector, handler, useCapture) {
  var root, listenerMap, matcher, matcherParam;

  if (!eventType) {
    throw new TypeError("Invalid event type: " + eventType);
  }

  // handler can be passed as
  // the second or third argument
  if (typeof selector === "function") {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // Fallback to sensible defaults
  // if useCapture not set
  if (useCapture === undefined) {
    useCapture = this.captureForType(eventType);
  }

  if (typeof handler !== "function") {
    throw new TypeError("Handler must be a type of Function");
  }

  root = this.rootElement;
  listenerMap = this.listenerMap[useCapture ? 1 : 0];

  // Add master handler for type if not created yet
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, useCapture);
    }
    listenerMap[eventType] = [];
  }

  if (!selector) {
    matcherParam = null;

    // COMPLEX - matchesRoot needs to have access to
    // this.rootElement, so bind the function to this.
    matcher = matchesRoot.bind(this);

    // Compile a matcher for the given selector
  } else if (/^[a-z]+$/i.test(selector)) {
    matcherParam = selector;
    matcher = matchesTag;
  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
    matcherParam = selector.slice(1);
    matcher = matchesId;
  } else {
    matcherParam = selector;
    matcher = matches;
  }

  // Add to the list of listeners
  listenerMap[eventType].push({
    selector: selector,
    handler: handler,
    matcher: matcher,
    matcherParam: matcherParam
  });

  return this;
};

/**
 * Remove an event handler
 * for elements that match
 * the selector, forever
 *
 * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
 * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
 * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.off = function (eventType, selector, handler, useCapture) {
  var i, listener, listenerMap, listenerList, singleEventType;

  // Handler can be passed as
  // the second or third argument
  if (typeof selector === "function") {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // If useCapture not set, remove
  // all event listeners
  if (useCapture === undefined) {
    this.off(eventType, selector, handler, true);
    this.off(eventType, selector, handler, false);
    return this;
  }

  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }

    return this;
  }

  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }

  // Remove only parameter matches
  // if specified
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];

    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      listenerList.splice(i, 1);
    }
  }

  // All listeners removed
  if (!listenerList.length) {
    delete listenerMap[eventType];

    // Remove the main handler
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
    }
  }

  return this;
};

/**
 * Handle an arbitrary event.
 *
 * @param {Event} event
 */
Delegate.prototype.handle = function (event) {
  var i,
      l,
      type = event.type,
      root,
      phase,
      listener,
      returned,
      listenerList = [],
      target,
      /** @const */EVENTIGNORE = "ftLabsDelegateIgnore";

  if (event[EVENTIGNORE] === true) {
    return;
  }

  target = event.target;

  // Hardcode value of Node.TEXT_NODE
  // as not defined in IE8
  if (target.nodeType === 3) {
    target = target.parentNode;
  }

  root = this.rootElement;

  phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);

  switch (phase) {
    case 1:
      //Event.CAPTURING_PHASE:
      listenerList = this.listenerMap[1][type];
      break;
    case 2:
      //Event.AT_TARGET:
      if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
      if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
      break;
    case 3:
      //Event.BUBBLING_PHASE:
      listenerList = this.listenerMap[0][type];
      break;
  }

  // Need to continuously check
  // that the specific list is
  // still populated in case one
  // of the callbacks actually
  // causes the list to be destroyed.
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];

      // Bail from this loop if
      // the length changed and
      // no more listeners are
      // defined between i and l.
      if (!listener) {
        break;
      }

      // Check for match and fire
      // the event if there's one
      //
      // TODO:MCG:20120117: Need a way
      // to check if event#stopImmediatePropagation
      // was called. If so, break both loops.
      if (listener.matcher.call(target, listener.matcherParam, target)) {
        returned = this.fire(event, target, listener);
      }

      // Stop propagation to subsequent
      // callbacks if the callback returned
      // false
      if (returned === false) {
        event[EVENTIGNORE] = true;
        event.preventDefault();
        return;
      }
    }

    // TODO:MCG:20120117: Need a way to
    // check if event#stopPropagation
    // was called. If so, break looping
    // through the DOM. Stop if the
    // delegation root has been reached
    if (target === root) {
      break;
    }

    l = listenerList.length;
    target = target.parentElement;
  }
};

/**
 * Fire a listener on a target.
 *
 * @param {Event} event
 * @param {Node} target
 * @param {Object} listener
 * @returns {boolean}
 */
Delegate.prototype.fire = function (event, target, listener) {
  return listener.handler.call(target, event, target);
};

/**
 * Check whether an element
 * matches a generic selector.
 *
 * @type function()
 * @param {string} selector A CSS selector
 */
var matches = (function (el) {
  if (!el) return;
  var p = el.prototype;
  return p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector;
})(Element);

/**
 * Check whether an element
 * matches a tag selector.
 *
 * Tags are NOT case-sensitive,
 * except in XML (and XML-based
 * languages such as XHTML).
 *
 * @param {string} tagName The tag name to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesTag(tagName, element) {
  return tagName.toLowerCase() === element.tagName.toLowerCase();
}

/**
 * Check whether an element
 * matches the root.
 *
 * @param {?String} selector In this case this is always passed through as null and not used
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesRoot(selector, element) {
  /*jshint validthis:true*/
  if (this.rootElement === window) {
    return element === document;
  }return this.rootElement === element;
}

/**
 * Check whether the ID of
 * the element in 'this'
 * matches the given ID.
 *
 * IDs are case-sensitive.
 *
 * @param {string} id The ID to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesId(id, element) {
  return id === element.id;
}

/**
 * Short hand for off()
 * and root(), ie both
 * with no parameters
 *
 * @return void
 */
Delegate.prototype.destroy = function () {
  this.off();
  this.root();
};

},{}],2:[function(require,module,exports){
/*global require, module*/
"use strict";

var DropdownMenu = require("./src/js/DropdownMenu");

var constructAll = (function (_constructAll) {
	var _constructAllWrapper = function constructAll() {
		return _constructAll.apply(this, arguments);
	};

	_constructAllWrapper.toString = function () {
		return _constructAll.toString();
	};

	return _constructAllWrapper;
})(function () {
	DropdownMenu.init();
	document.removeEventListener("o.DOMContentLoaded", constructAll);
});

document.addEventListener("o.DOMContentLoaded", constructAll);

module.exports = DropdownMenu;

},{"./src/js/DropdownMenu":3}],3:[function(require,module,exports){
"use strict";

var DomDelegate = require("./../../../dom-delegate/lib/delegate.js");
var dispatchEvent = require("./utils").dispatchEvent;

function DropdownMenu(element) {
	if (!(this instanceof DropdownMenu)) throw new TypeError("Constructor DropdownMenu requires 'new'");
	if (!element) throw new TypeError("missing required argument: element");

	var dropdownMenu = this;
	this.element = element;

	var toggleElement = this.toggleElement = element.querySelector("[data-toggle=\"dropdown-menu\"]");
	if (!toggleElement) throw new Error("unable to locate a child element with selector: [data-toggle=\"dropdown-menu\"]");

	function handleClick(e) {
		e.preventDefault();
		dropdownMenu.toggle();
	}

	function handleKeydown(e) {
		// Handle up arrow, down arrow, escape, and space keys for elements that
		// are not inputs and textareas
		if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) {
			return;
		}e.preventDefault();
		e.stopPropagation();

		var element = getRootElement(e.target);
		var toggleElement = element.querySelector("[data-toggle=\"dropdown-menu\"]");

		var isExpanded = element.classList.contains("o-he-dropdown-menu--expanded");

		// Toggle the menu: if not expanded, keys other than esc will expand it;
		// if expanded, esc will collapse it.
		if (!isExpanded && e.which !== 27 || isExpanded && e.which === 27) {
			if (e.which === 27) dispatchEvent(toggleElement, "focus");
			return dispatchEvent(toggleElement, "click");
		}

		// Focus menu item
		var itemEls = element.querySelectorAll(".o-he-dropdown-menu__menu-item:not(.o-he-dropdown-menu__menu-item--disabled) a");

		if (!itemEls.length) {
			return;
		}var index = indexOfElement(itemEls, e.target);

		if (e.which === 38 && index > 0) index--;
		if (e.which === 40 && index < itemEls.length - 1) index++;
		if (! ~index) index = 0;

		itemEls[index].focus();
	}

	if (!DropdownMenu.bodyDelegate) {
		var bodyDelegate = new DomDelegate(document.body);

		bodyDelegate.on("click", function (e) {
			if (!e.defaultPrevented) collapseAll();
		});

		DropdownMenu.bodyDelegate = bodyDelegate;
	}

	var elementDelegate = new DomDelegate(element);

	elementDelegate.on("keydown", "[data-toggle=\"dropdown-menu\"]", handleKeydown);
	elementDelegate.on("keydown", "[role=\"menu\"]", handleKeydown);
	elementDelegate.on("click", handleClick);

	function destroy() {
		elementDelegate.destroy();
	}

	this.destroy = destroy;
}

DropdownMenu.init = function (element) {
	var dropdownMenuEls = selectAll(element);
	var dropdownMenus = [];

	for (var i = 0, l = dropdownMenuEls.length; i < l; i++) {
		dropdownMenus.push(new DropdownMenu(dropdownMenuEls[i]));
	}

	return dropdownMenus;
};

DropdownMenu.destroy = function () {
	DropdownMenu.bodyDelegate && DropdownMenu.bodyDelegate.destroy();
};

DropdownMenu.prototype.toggle = function () {
	var element = this.element;
	var toggleElement = this.toggleElement;

	var isDisabled = toggleElement.classList.contains("o-he-dropdown-menu__toggle--disabled") || toggleElement.disabled;

	var isExpanded = element.classList.contains("o-he-dropdown-menu--expanded");

	collapseAll();

	if (isDisabled) return;

	if (!isExpanded) {
		element.classList.add("o-he-dropdown-menu--expanded");
		toggleElement.setAttribute("aria-expanded", "true");
	}

	return this;
};

function getRootElement(element) {
	while (element !== null) {
		if (element.getAttribute("data-o-component") === "o-he-dropdown-menu") {
			return element;
		}element = element.parentElement;
	}
}

function indexOfElement(elements, element) {
	for (var i = 0, l = elements.length; i < l; i++) {
		if (elements[i] === element) {
			return i;
		}
	}

	return -1;
}

function selectAll(element) {
	if (!element) {
		element = document.body;
	} else if (!(element instanceof HTMLElement)) {
		element = document.querySelectorAll("[data-o-component=\"o-he-dropdown-menu\"]");
	}

	return element.querySelectorAll("[data-o-component=\"o-he-dropdown-menu\"]");
}

function collapseAll() {
	var dropdownMenuEls = selectAll();

	for (var i = 0, l = dropdownMenuEls.length; i < l; i++) {
		var element = dropdownMenuEls[i];
		var toggleElement = element.querySelector("[data-toggle=\"dropdown-menu\"]");

		if (!element.classList.contains("o-he-dropdown-menu--expanded")) continue;

		element.classList.remove("o-he-dropdown-menu--expanded");
		toggleElement.removeAttribute("aria-expanded");
	}
}

module.exports = DropdownMenu;

},{"./../../../dom-delegate/lib/delegate.js":1,"./utils":4}],4:[function(require,module,exports){
// Helper function to dispatch events
"use strict";

function dispatchEvent(element, name, data) {
	"use strict";
	if (document.createEvent && element.dispatchEvent) {
		var event = document.createEvent("Event");
		event.initEvent(name, true, true);

		if (data) {
			event.detail = data;
		}

		element.dispatchEvent(event);
	}
}

exports.dispatchEvent = dispatchEvent;

},{}],5:[function(require,module,exports){
"use strict";

require("./bower_components/o-he-dropdown-menu/main.js");

document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  var event;

  try {
    event = new CustomEvent("o.DOMContentLoaded");
  } catch (e) {
    // IE
    event = document.createEvent("CustomEvent");
    event.initCustomEvent("o.DOMContentLoaded", true, true, null);
  }

  document.dispatchEvent(event);
});

},{"./bower_components/o-he-dropdown-menu/main.js":2}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy91YXJtb2FkLy5udm0vdjAuMTAuMzYvbGliL25vZGVfbW9kdWxlcy9vcmlnYW1pLWJ1aWxkLXRvb2xzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvdWFybW9hZC90bXAvaGVhZGVyLWRyb3Bkb3duLXRlc3QvYm93ZXJfY29tcG9uZW50cy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwiL1VzZXJzL3Vhcm1vYWQvdG1wL2hlYWRlci1kcm9wZG93bi10ZXN0L2Jvd2VyX2NvbXBvbmVudHMvby1oZS1kcm9wZG93bi1tZW51L21haW4uanMiLCIvVXNlcnMvdWFybW9hZC90bXAvaGVhZGVyLWRyb3Bkb3duLXRlc3QvYm93ZXJfY29tcG9uZW50cy9vLWhlLWRyb3Bkb3duLW1lbnUvc3JjL2pzL0Ryb3Bkb3duTWVudS5qcyIsIi9Vc2Vycy91YXJtb2FkL3RtcC9oZWFkZXItZHJvcGRvd24tdGVzdC9ib3dlcl9jb21wb25lbnRzL28taGUtZHJvcGRvd24tbWVudS9zcmMvanMvdXRpbHMuanMiLCIvVXNlcnMvdWFybW9hZC90bXAvaGVhZGVyLWRyb3Bkb3duLXRlc3QvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7QUFZMUIsU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFOzs7Ozs7OztBQVF0QixNQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzVCLE1BQUksSUFBSSxFQUFFO0FBQ1IsUUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUNqQjs7O0FBR0QsTUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxD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Ozs7Ozs7QUN4SjlCLFNBQVMsYUFBYSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQzNDLGFBQVksQ0FBQztBQUNiLEtBQUksUUFBUSxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFO0FBQ2xELE1BQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUMsT0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVsQyxNQUFJLElBQUksRUFBRTtBQUNULFFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0dBQ3BCOztBQUVELFNBQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDN0I7Q0FDRDs7QUFFRCxPQUFPLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQzs7Ozs7QUNmdEMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7O0FBRTlCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxZQUFXO0FBQ3ZELGNBQVksQ0FBQztBQUNiLE1BQUksS0FBSyxDQUFDOztBQUVWLE1BQUk7QUFDRixTQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQztHQUMvQyxDQUNELE9BQU8sQ0FBQyxFQUFFOztBQUVSLFNBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzVDLFNBQUssQ0FBQyxlQUFlLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztHQUMvRDs7QUFFRCxVQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQy9CLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzaGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxlZ2F0ZTtcblxuLyoqXG4gKiBET00gZXZlbnQgZGVsZWdhdG9yXG4gKlxuICogVGhlIGRlbGVnYXRvciB3aWxsIGxpc3RlblxuICogZm9yIGV2ZW50cyB0aGF0IGJ1YmJsZSB1cFxuICogdG8gdGhlIHJvb3Qgbm9kZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqL1xuZnVuY3Rpb24gRGVsZWdhdGUocm9vdCkge1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIG1hcCBvZiBsaXN0ZW5lclxuICAgKiBsaXN0cywga2V5ZWQgYnkgZXZlbnQgbmFtZS5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB0aGlzLmxpc3RlbmVyTWFwID0gW3t9LCB7fV07XG4gIGlmIChyb290KSB7XG4gICAgdGhpcy5yb290KHJvb3QpO1xuICB9XG5cbiAgLyoqIEB0eXBlIGZ1bmN0aW9uKCkgKi9cbiAgdGhpcy5oYW5kbGUgPSBEZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlLmJpbmQodGhpcyk7XG59XG5cbi8qKlxuICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHNcbiAqIG9uIHRoZSBwcm92aWRlZCBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUucm9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgdmFyIGV2ZW50VHlwZTtcblxuICAvLyBSZW1vdmUgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG5vIHJvb3Qgb3Igcm9vdCBpcyBub3RcbiAgLy8gYSBkb20gbm9kZSwgdGhlbiByZW1vdmUgaW50ZXJuYWxcbiAgLy8gcm9vdCByZWZlcmVuY2UgYW5kIGV4aXQgaGVyZVxuICBpZiAoIXJvb3QgfHwgIXJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHJvb3Qgbm9kZSBhdCB3aGljaFxuICAgKiBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAdHlwZSBOb2RlXG4gICAqL1xuICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdDtcblxuICAvLyBTZXQgdXAgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmNhcHR1cmVGb3JUeXBlID0gZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gIHJldHVybiBbJ2JsdXInLCAnZXJyb3InLCAnZm9jdXMnLCAnbG9hZCcsICdyZXNpemUnLCAnc2Nyb2xsJ10uaW5kZXhPZihldmVudFR5cGUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogQXR0YWNoIGEgaGFuZGxlciB0byBvbmVcbiAqIGV2ZW50IGZvciBhbGwgZWxlbWVudHNcbiAqIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9yLFxuICogbm93IG9yIGluIHRoZSBmdXR1cmVcbiAqXG4gKiBUaGUgaGFuZGxlciBmdW5jdGlvbiByZWNlaXZlc1xuICogdGhyZWUgYXJndW1lbnRzOiB0aGUgRE9NIGV2ZW50XG4gKiBvYmplY3QsIHRoZSBub2RlIHRoYXQgbWF0Y2hlZFxuICogdGhlIHNlbGVjdG9yIHdoaWxlIHRoZSBldmVudFxuICogd2FzIGJ1YmJsaW5nIGFuZCBhIHJlZmVyZW5jZVxuICogdG8gaXRzZWxmLiBXaXRoaW4gdGhlIGhhbmRsZXIsXG4gKiAndGhpcycgaXMgZXF1YWwgdG8gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogVGhlIG5vZGUgdGhhdCBhY3R1YWxseSByZWNlaXZlZFxuICogdGhlIGV2ZW50IGNhbiBiZSBhY2Nlc3NlZCB2aWFcbiAqICdldmVudC50YXJnZXQnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgTGlzdGVuIGZvciB0aGVzZSBldmVudHNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc2VsZWN0b3IgT25seSBoYW5kbGUgZXZlbnRzIG9uIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IsIGlmIHVuZGVmaW5lZCBtYXRjaCByb290IGVsZW1lbnRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gaGFuZGxlciBIYW5kbGVyIGZ1bmN0aW9uIC0gZXZlbnQgZGF0YSBwYXNzZWQgaGVyZSB3aWxsIGJlIGluIGV2ZW50LmRhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXZlbnREYXRhXSBEYXRhIHRvIHBhc3MgaW4gZXZlbnQuZGF0YVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgcm9vdCwgbGlzdGVuZXJNYXAsIG1hdGNoZXIsIG1hdGNoZXJQYXJhbTtcblxuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZXZlbnQgdHlwZTogJyArIGV2ZW50VHlwZSk7XG4gIH1cblxuICAvLyBoYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIHNlbnNpYmxlIGRlZmF1bHRzXG4gIC8vIGlmIHVzZUNhcHR1cmUgbm90IHNldFxuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXNlQ2FwdHVyZSA9IHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIHR5cGUgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcblxuICAvLyBBZGQgbWFzdGVyIGhhbmRsZXIgZm9yIHR5cGUgaWYgbm90IGNyZWF0ZWQgeWV0XG4gIGlmICghbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSkge1xuICAgIGlmIChyb290KSB7XG4gICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICAgIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBudWxsO1xuXG4gICAgLy8gQ09NUExFWCAtIG1hdGNoZXNSb290IG5lZWRzIHRvIGhhdmUgYWNjZXNzIHRvXG4gICAgLy8gdGhpcy5yb290RWxlbWVudCwgc28gYmluZCB0aGUgZnVuY3Rpb24gdG8gdGhpcy5cbiAgICBtYXRjaGVyID0gbWF0Y2hlc1Jvb3QuYmluZCh0aGlzKTtcblxuICAvLyBDb21waWxlIGEgbWF0Y2hlciBmb3IgdGhlIGdpdmVuIHNlbGVjdG9yXG4gIH0gZWxzZSBpZiAoL15bYS16XSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc1RhZztcbiAgfSBlbHNlIGlmICgvXiNbYS16MC05XFwtX10rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3Iuc2xpY2UoMSk7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNJZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlcztcbiAgfVxuXG4gIC8vIEFkZCB0byB0aGUgbGlzdCBvZiBsaXN0ZW5lcnNcbiAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcbiAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICBtYXRjaGVyOiBtYXRjaGVyLFxuICAgIG1hdGNoZXJQYXJhbTogbWF0Y2hlclBhcmFtXG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICogZm9yIGVsZW1lbnRzIHRoYXQgbWF0Y2hcbiAqIHRoZSBzZWxlY3RvciwgZm9yZXZlclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZlbnRUeXBlXSBSZW1vdmUgaGFuZGxlcnMgZm9yIGV2ZW50cyBtYXRjaGluZyB0aGlzIHR5cGUsIGNvbnNpZGVyaW5nIHRoZSBvdGhlciBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ30gW3NlbGVjdG9yXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBvdGhlciB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IFtoYW5kbGVyXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBwcmV2aW91cyB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgaSwgbGlzdGVuZXIsIGxpc3RlbmVyTWFwLCBsaXN0ZW5lckxpc3QsIHNpbmdsZUV2ZW50VHlwZTtcblxuICAvLyBIYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHVzZUNhcHR1cmUgbm90IHNldCwgcmVtb3ZlXG4gIC8vIGFsbCBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIGZvciAoc2luZ2xlRXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoc2luZ2xlRXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLm9mZihzaW5nbGVFdmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG4gIGlmICghbGlzdGVuZXJMaXN0IHx8ICFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW1vdmUgb25seSBwYXJhbWV0ZXIgbWF0Y2hlc1xuICAvLyBpZiBzcGVjaWZpZWRcbiAgZm9yIChpID0gbGlzdGVuZXJMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICBpZiAoKCFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gbGlzdGVuZXIuc2VsZWN0b3IpICYmICghaGFuZGxlciB8fCBoYW5kbGVyID09PSBsaXN0ZW5lci5oYW5kbGVyKSkge1xuICAgICAgbGlzdGVuZXJMaXN0LnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBbGwgbGlzdGVuZXJzIHJlbW92ZWRcbiAgaWYgKCFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgZGVsZXRlIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cbiAgICAvLyBSZW1vdmUgdGhlIG1haW4gaGFuZGxlclxuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogSGFuZGxlIGFuIGFyYml0cmFyeSBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGksIGwsIHR5cGUgPSBldmVudC50eXBlLCByb290LCBwaGFzZSwgbGlzdGVuZXIsIHJldHVybmVkLCBsaXN0ZW5lckxpc3QgPSBbXSwgdGFyZ2V0LCAvKiogQGNvbnN0ICovIEVWRU5USUdOT1JFID0gJ2Z0TGFic0RlbGVnYXRlSWdub3JlJztcblxuICBpZiAoZXZlbnRbRVZFTlRJR05PUkVdID09PSB0cnVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG4gIC8vIEhhcmRjb2RlIHZhbHVlIG9mIE5vZGUuVEVYVF9OT0RFXG4gIC8vIGFzIG5vdCBkZWZpbmVkIGluIElFOFxuICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcblxuICBwaGFzZSA9IGV2ZW50LmV2ZW50UGhhc2UgfHwgKCBldmVudC50YXJnZXQgIT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgPyAzIDogMiApO1xuICBcbiAgc3dpdGNoIChwaGFzZSkge1xuICAgIGNhc2UgMTogLy9FdmVudC5DQVBUVVJJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjogLy9FdmVudC5BVF9UQVJHRVQ6XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFswXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pO1xuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMV0gJiYgdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKTtcbiAgICBicmVhaztcbiAgICBjYXNlIDM6IC8vRXZlbnQuQlVCQkxJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gTmVlZCB0byBjb250aW51b3VzbHkgY2hlY2tcbiAgLy8gdGhhdCB0aGUgc3BlY2lmaWMgbGlzdCBpc1xuICAvLyBzdGlsbCBwb3B1bGF0ZWQgaW4gY2FzZSBvbmVcbiAgLy8gb2YgdGhlIGNhbGxiYWNrcyBhY3R1YWxseVxuICAvLyBjYXVzZXMgdGhlIGxpc3QgdG8gYmUgZGVzdHJveWVkLlxuICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgd2hpbGUgKHRhcmdldCAmJiBsKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICAgIC8vIEJhaWwgZnJvbSB0aGlzIGxvb3AgaWZcbiAgICAgIC8vIHRoZSBsZW5ndGggY2hhbmdlZCBhbmRcbiAgICAgIC8vIG5vIG1vcmUgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gZGVmaW5lZCBiZXR3ZWVuIGkgYW5kIGwuXG4gICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYW5kIGZpcmVcbiAgICAgIC8vIHRoZSBldmVudCBpZiB0aGVyZSdzIG9uZVxuICAgICAgLy9cbiAgICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5XG4gICAgICAvLyB0byBjaGVjayBpZiBldmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBib3RoIGxvb3BzLlxuICAgICAgaWYgKGxpc3RlbmVyLm1hdGNoZXIuY2FsbCh0YXJnZXQsIGxpc3RlbmVyLm1hdGNoZXJQYXJhbSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm5lZCA9IHRoaXMuZmlyZShldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3AgcHJvcGFnYXRpb24gdG8gc3Vic2VxdWVudFxuICAgICAgLy8gY2FsbGJhY2tzIGlmIHRoZSBjYWxsYmFjayByZXR1cm5lZFxuICAgICAgLy8gZmFsc2VcbiAgICAgIGlmIChyZXR1cm5lZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZXZlbnRbRVZFTlRJR05PUkVdID0gdHJ1ZTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5IHRvXG4gICAgLy8gY2hlY2sgaWYgZXZlbnQjc3RvcFByb3BhZ2F0aW9uXG4gICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGxvb3BpbmdcbiAgICAvLyB0aHJvdWdoIHRoZSBET00uIFN0b3AgaWYgdGhlXG4gICAgLy8gZGVsZWdhdGlvbiByb290IGhhcyBiZWVuIHJlYWNoZWRcbiAgICBpZiAodGFyZ2V0ID09PSByb290KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXJlIGEgbGlzdGVuZXIgb24gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgZ2VuZXJpYyBzZWxlY3Rvci5cbiAqXG4gKiBAdHlwZSBmdW5jdGlvbigpXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3JcbiAqL1xudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oZWwpIHtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICB2YXIgcCA9IGVsLnByb3RvdHlwZTtcbiAgcmV0dXJuIChwLm1hdGNoZXMgfHwgcC5tYXRjaGVzU2VsZWN0b3IgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBwLm9NYXRjaGVzU2VsZWN0b3IpO1xufShFbGVtZW50KSk7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgdGFnIHNlbGVjdG9yLlxuICpcbiAqIFRhZ3MgYXJlIE5PVCBjYXNlLXNlbnNpdGl2ZSxcbiAqIGV4Y2VwdCBpbiBYTUwgKGFuZCBYTUwtYmFzZWRcbiAqIGxhbmd1YWdlcyBzdWNoIGFzIFhIVE1MKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBUaGUgdGFnIG5hbWUgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUYWcodGFnTmFtZSwgZWxlbWVudCkge1xuICByZXR1cm4gdGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgdGhlIHJvb3QuXG4gKlxuICogQHBhcmFtIHs/U3RyaW5nfSBzZWxlY3RvciBJbiB0aGlzIGNhc2UgdGhpcyBpcyBhbHdheXMgcGFzc2VkIHRocm91Z2ggYXMgbnVsbCBhbmQgbm90IHVzZWRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1Jvb3Qoc2VsZWN0b3IsIGVsZW1lbnQpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUqL1xuICBpZiAodGhpcy5yb290RWxlbWVudCA9PT0gd2luZG93KSByZXR1cm4gZWxlbWVudCA9PT0gZG9jdW1lbnQ7XG4gIHJldHVybiB0aGlzLnJvb3RFbGVtZW50ID09PSBlbGVtZW50O1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIElEIG9mXG4gKiB0aGUgZWxlbWVudCBpbiAndGhpcydcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIElELlxuICpcbiAqIElEcyBhcmUgY2FzZS1zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc0lkKGlkLCBlbGVtZW50KSB7XG4gIHJldHVybiBpZCA9PT0gZWxlbWVudC5pZDtcbn1cblxuLyoqXG4gKiBTaG9ydCBoYW5kIGZvciBvZmYoKVxuICogYW5kIHJvb3QoKSwgaWUgYm90aFxuICogd2l0aCBubyBwYXJhbWV0ZXJzXG4gKlxuICogQHJldHVybiB2b2lkXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub2ZmKCk7XG4gIHRoaXMucm9vdCgpO1xufTtcbiIsIi8qZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBEcm9wZG93bk1lbnUgPSByZXF1aXJlKCcuL3NyYy9qcy9Ecm9wZG93bk1lbnUnKTtcblxudmFyIGNvbnN0cnVjdEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0RHJvcGRvd25NZW51LmluaXQoKTtcblx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignby5ET01Db250ZW50TG9hZGVkJywgY29uc3RydWN0QWxsKTtcbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ28uRE9NQ29udGVudExvYWRlZCcsIGNvbnN0cnVjdEFsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25NZW51O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRG9tRGVsZWdhdGUgPSByZXF1aXJlKCdkb20tZGVsZWdhdGUnKTtcbnZhciBkaXNwYXRjaEV2ZW50ID0gcmVxdWlyZSgnLi91dGlscycpLmRpc3BhdGNoRXZlbnQ7XG5cbmZ1bmN0aW9uIERyb3Bkb3duTWVudShlbGVtZW50KSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBEcm9wZG93bk1lbnUpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25zdHJ1Y3RvciBEcm9wZG93bk1lbnUgcmVxdWlyZXMgXFwnbmV3XFwnJyk7XG5cdGlmICghZWxlbWVudCkgdGhyb3cgbmV3IFR5cGVFcnJvcignbWlzc2luZyByZXF1aXJlZCBhcmd1bWVudDogZWxlbWVudCcpO1xuXG5cdHZhciBkcm9wZG93bk1lbnUgPSB0aGlzO1xuXHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG5cdHZhciB0b2dnbGVFbGVtZW50ID0gdGhpcy50b2dnbGVFbGVtZW50ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cdGlmICghdG9nZ2xlRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKCd1bmFibGUgdG8gbG9jYXRlIGEgY2hpbGQgZWxlbWVudCB3aXRoIHNlbGVjdG9yOiBbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cblx0ZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRkcm9wZG93bk1lbnUudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGUpIHtcblx0XHQvLyBIYW5kbGUgdXAgYXJyb3csIGRvd24gYXJyb3csIGVzY2FwZSwgYW5kIHNwYWNlIGtleXMgZm9yIGVsZW1lbnRzIHRoYXRcblx0XHQvLyBhcmUgbm90IGlucHV0cyBhbmQgdGV4dGFyZWFzXG5cdFx0aWYgKCEvKDM4fDQwfDI3fDMyKS8udGVzdChlLndoaWNoKSB8fCAvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpKSByZXR1cm47XG5cblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHZhciBlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoZS50YXJnZXQpO1xuXHRcdHZhciB0b2dnbGVFbGVtZW50ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cblx0XHR2YXIgaXNFeHBhbmRlZCA9IGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJyk7XG5cblx0XHQvLyBUb2dnbGUgdGhlIG1lbnU6IGlmIG5vdCBleHBhbmRlZCwga2V5cyBvdGhlciB0aGFuIGVzYyB3aWxsIGV4cGFuZCBpdDtcblx0XHQvLyBpZiBleHBhbmRlZCwgZXNjIHdpbGwgY29sbGFwc2UgaXQuXG5cdFx0aWYgKCghaXNFeHBhbmRlZCAmJiBlLndoaWNoICE9PSAyNykgfHwgKGlzRXhwYW5kZWQgJiYgZS53aGljaCA9PT0gMjcpKSB7XG5cdFx0XHRpZiAoZS53aGljaCA9PT0gMjcpIGRpc3BhdGNoRXZlbnQodG9nZ2xlRWxlbWVudCwgJ2ZvY3VzJyk7XG5cdFx0XHRyZXR1cm4gZGlzcGF0Y2hFdmVudCh0b2dnbGVFbGVtZW50LCAnY2xpY2snKTtcblx0XHR9XG5cblx0XHQvLyBGb2N1cyBtZW51IGl0ZW1cblx0XHR2YXIgaXRlbUVscyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm8taGUtZHJvcGRvd24tbWVudV9fbWVudS1pdGVtOm5vdCguby1oZS1kcm9wZG93bi1tZW51X19tZW51LWl0ZW0tLWRpc2FibGVkKSBhJyk7XG5cblx0XHRpZiAoIWl0ZW1FbHMubGVuZ3RoKSByZXR1cm47XG5cblx0XHR2YXIgaW5kZXggPSBpbmRleE9mRWxlbWVudChpdGVtRWxzLCBlLnRhcmdldCk7XG5cblx0XHRpZiAoZS53aGljaCA9PT0gMzggJiYgaW5kZXggPiAwKSBpbmRleC0tO1xuXHRcdGlmIChlLndoaWNoID09PSA0MCAmJiBpbmRleCA8IGl0ZW1FbHMubGVuZ3RoIC0gMSkgaW5kZXgrKztcblx0XHRpZiAoIX5pbmRleCkgaW5kZXggPSAwO1xuXG5cdFx0aXRlbUVsc1tpbmRleF0uZm9jdXMoKTtcblx0fVxuXG5cdGlmICghRHJvcGRvd25NZW51LmJvZHlEZWxlZ2F0ZSkge1xuXHRcdHZhciBib2R5RGVsZWdhdGUgPSBuZXcgRG9tRGVsZWdhdGUoZG9jdW1lbnQuYm9keSk7XG5cblx0XHRib2R5RGVsZWdhdGUub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmICghZS5kZWZhdWx0UHJldmVudGVkKSBjb2xsYXBzZUFsbCgpO1xuXHRcdH0pO1xuXG5cdFx0RHJvcGRvd25NZW51LmJvZHlEZWxlZ2F0ZSA9IGJvZHlEZWxlZ2F0ZTtcblx0fVxuXG5cdHZhciBlbGVtZW50RGVsZWdhdGUgPSBuZXcgRG9tRGVsZWdhdGUoZWxlbWVudCk7XG5cblx0ZWxlbWVudERlbGVnYXRlLm9uKCdrZXlkb3duJywgJ1tkYXRhLXRvZ2dsZT1cImRyb3Bkb3duLW1lbnVcIl0nLCBoYW5kbGVLZXlkb3duKTtcblx0ZWxlbWVudERlbGVnYXRlLm9uKCdrZXlkb3duJywgJ1tyb2xlPVwibWVudVwiXScsIGhhbmRsZUtleWRvd24pO1xuXHRlbGVtZW50RGVsZWdhdGUub24oJ2NsaWNrJywgaGFuZGxlQ2xpY2spO1xuXG5cdGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdFx0ZWxlbWVudERlbGVnYXRlLmRlc3Ryb3koKTtcblx0fVxuXG5cdHRoaXMuZGVzdHJveSA9IGRlc3Ryb3k7XG59XG5cbkRyb3Bkb3duTWVudS5pbml0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0dmFyIGRyb3Bkb3duTWVudUVscyA9IHNlbGVjdEFsbChlbGVtZW50KTtcblx0dmFyIGRyb3Bkb3duTWVudXMgPSBbXTtcblxuXHRmb3IgKHZhciBpID0gMCwgbCA9IGRyb3Bkb3duTWVudUVscy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRkcm9wZG93bk1lbnVzLnB1c2gobmV3IERyb3Bkb3duTWVudShkcm9wZG93bk1lbnVFbHNbaV0pKTtcblx0fVxuXG5cdHJldHVybiBkcm9wZG93bk1lbnVzO1xufTtcblxuRHJvcGRvd25NZW51LmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cdERyb3Bkb3duTWVudS5ib2R5RGVsZWdhdGUgJiYgRHJvcGRvd25NZW51LmJvZHlEZWxlZ2F0ZS5kZXN0cm95KCk7XG59O1xuXG5Ecm9wZG93bk1lbnUucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQ7XG5cdHZhciB0b2dnbGVFbGVtZW50ID0gdGhpcy50b2dnbGVFbGVtZW50O1xuXG5cdHZhciBpc0Rpc2FibGVkID1cblx0XHR0b2dnbGVFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnby1oZS1kcm9wZG93bi1tZW51X190b2dnbGUtLWRpc2FibGVkJykgfHxcblx0XHR0b2dnbGVFbGVtZW50LmRpc2FibGVkO1xuXG5cdHZhciBpc0V4cGFuZGVkID0gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ28taGUtZHJvcGRvd24tbWVudS0tZXhwYW5kZWQnKTtcblxuXHRjb2xsYXBzZUFsbCgpO1xuXG5cdGlmIChpc0Rpc2FibGVkKSByZXR1cm47XG5cblx0aWYgKCFpc0V4cGFuZGVkKSB7XG5cdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJyk7XG5cdFx0dG9nZ2xlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBnZXRSb290RWxlbWVudChlbGVtZW50KSB7XG5cdHdoaWxlIChlbGVtZW50ICE9PSBudWxsKSB7XG5cdFx0aWYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW8tY29tcG9uZW50JykgPT09ICdvLWhlLWRyb3Bkb3duLW1lbnUnKSByZXR1cm4gZWxlbWVudDtcblx0XHRlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50KGVsZW1lbnRzLCBlbGVtZW50KSB7XG5cdGZvciAodmFyIGkgPSAwLCBsID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0aWYgKGVsZW1lbnRzW2ldID09PSBlbGVtZW50KSByZXR1cm4gaTtcblx0fVxuXG5cdHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gc2VsZWN0QWxsKGVsZW1lbnQpIHtcblx0aWYgKCFlbGVtZW50KSB7XG5cdFx0ZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cdH0gZWxzZSBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG5cdFx0ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW8tY29tcG9uZW50PVwiby1oZS1kcm9wZG93bi1tZW51XCJdJyk7XG5cdH1cblxuXHRyZXR1cm4gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vLWNvbXBvbmVudD1cIm8taGUtZHJvcGRvd24tbWVudVwiXScpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZUFsbCgpIHtcblx0dmFyIGRyb3Bkb3duTWVudUVscyA9IHNlbGVjdEFsbCgpO1xuXG5cdGZvciAodmFyIGkgPSAwLCBsID0gZHJvcGRvd25NZW51RWxzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdHZhciBlbGVtZW50ID0gZHJvcGRvd25NZW51RWxzW2ldO1xuXHRcdHZhciB0b2dnbGVFbGVtZW50ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cblx0XHRpZiAoIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJykpIGNvbnRpbnVlO1xuXG5cdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJyk7XG5cdFx0dG9nZ2xlRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duTWVudTtcbiIsIi8vIEhlbHBlciBmdW5jdGlvbiB0byBkaXNwYXRjaCBldmVudHNcbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoZWxlbWVudCwgbmFtZSwgZGF0YSkge1xuXHQndXNlIHN0cmljdCc7XG5cdGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCAmJiBlbGVtZW50LmRpc3BhdGNoRXZlbnQpIHtcblx0XHR2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG5cblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0ZXZlbnQuZGV0YWlsID0gZGF0YTtcblx0XHR9XG5cblx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuXHR9XG59XG5cbmV4cG9ydHMuZGlzcGF0Y2hFdmVudCA9IGRpc3BhdGNoRXZlbnQ7XG4iLCJyZXF1aXJlKCdvLWhlLWRyb3Bkb3duLW1lbnUnKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBldmVudDtcblxuICB0cnkge1xuICAgIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdvLkRPTUNvbnRlbnRMb2FkZWQnKTtcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIC8vIElFXG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQoJ28uRE9NQ29udGVudExvYWRlZCcsIHRydWUsIHRydWUsIG51bGwpO1xuICB9XG5cbiAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59KTsiXX0=
