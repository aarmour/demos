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
/*global require*/
"use strict";

require("../../main");

document.addEventListener("DOMContentLoaded", function () {
	"use strict";
	document.dispatchEvent(new CustomEvent("o.DOMContentLoaded"));
});

},{"../../main":3}],3:[function(require,module,exports){
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

},{"./src/js/DropdownMenu":4}],4:[function(require,module,exports){
"use strict";

var DomDelegate = require("./../../bower_components/dom-delegate/lib/delegate.js");
var dispatchEvent = require("./utils").dispatchEvent;

/**
 * Represents a contextual menu for displaying list items.
 * @param {HTMLElement} element
 */
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

/**
 * Initializes all dropdown-menu elements on the page or within
 * the element passed in.
 * @param  {HTMLElement|string} element DOM element or selector.
 * @return {DropdownMenu[]} List of DropdownMenu instances that
 * have been initialized.
 */
DropdownMenu.init = function (element) {
	var dropdownMenuEls = selectAll(element);
	var dropdownMenus = [];

	for (var i = 0, l = dropdownMenuEls.length; i < l; i++) {
		dropdownMenus.push(new DropdownMenu(dropdownMenuEls[i]));
	}

	return dropdownMenus;
};

/**
 * Destroys all dropdown-menu instances on the page.
 */
DropdownMenu.destroy = function () {
	DropdownMenu.bodyDelegate && DropdownMenu.bodyDelegate.destroy();
};

/**
 * Expands or collapses the menu items.
 */
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
		element = document.querySelectorAll(element);
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

},{"./../../bower_components/dom-delegate/lib/delegate.js":1,"./utils":5}],5:[function(require,module,exports){
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy91YXJtb2FkLy5udm0vdjAuMTAuMzYvbGliL25vZGVfbW9kdWxlcy9vcmlnYW1pLWJ1aWxkLXRvb2xzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvdWFybW9hZC9Qcm9qZWN0cy9vcmlnYW1pL28taGUtZHJvcGRvd24tbWVudS9ib3dlcl9jb21wb25lbnRzL2RvbS1kZWxlZ2F0ZS9saWIvZGVsZWdhdGUuanMiLCIvVXNlcnMvdWFybW9hZC9Qcm9qZWN0cy9vcmlnYW1pL28taGUtZHJvcGRvd24tbWVudS9kZW1vcy9zcmMvZGVtby5qcyIsIi9Vc2Vycy91YXJtb2FkL1Byb2plY3RzL29yaWdhbWkvby1oZS1kcm9wZG93bi1tZW51L21haW4uanMiLCIvVXNlcnMvdWFybW9hZC9Qcm9qZWN0cy9vcmlnYW1pL28taGUtZHJvcGRvd24tbWVudS9zcmMvanMvRHJvcGRvd25NZW51LmpzIiwiL1VzZXJzL3Vhcm1vYWQvUHJvamVjdHMvb3JpZ2FtaS9vLWhlLWRyb3Bkb3duLW1lbnUvc3JjL2pzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxZQUFZLENBQUM7O0FBRWIsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7Ozs7Ozs7Ozs7OztBQVkxQixTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUU7Ozs7Ozs7O0FBUXRCLE1BQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUIsTUFBSSxJQUFJLEVBQUU7QUFDUixRQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQ2pCOzs7QUFHRCxNQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNwRDs7Ozs7Ozs7O0FBU0QsUUFBUSxDQUFDLFNBQVMs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QUUsU0FBUzs7QUFFMUUsU0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUN6RCxlQUFhLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0VBQy9DO0NBQ0Q7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUM7Ozs7OztBQ3pLOUIsU0FBUyxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDM0MsYUFBWSxDQUFDO0FBQ2IsS0FBSSxRQUFRLENBQUMsV0FBVyxJQUFJLE9BQU8sQ0FBQyxhQUFhLEVBQUU7QUFDbEQsTUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxPQUFLLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWxDLE1BQUksSUFBSSxFQUFFO0FBQ1QsUUFBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7R0FDcEI7O0FBRUQsU0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUM3QjtDQUNEOztBQUVELE9BQU8sQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGVnYXRlO1xuXG4vKipcbiAqIERPTSBldmVudCBkZWxlZ2F0b3JcbiAqXG4gKiBUaGUgZGVsZWdhdG9yIHdpbGwgbGlzdGVuXG4gKiBmb3IgZXZlbnRzIHRoYXQgYnViYmxlIHVwXG4gKiB0byB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICovXG5mdW5jdGlvbiBEZWxlZ2F0ZShyb290KSB7XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgbWFwIG9mIGxpc3RlbmVyXG4gICAqIGxpc3RzLCBrZXllZCBieSBldmVudCBuYW1lLlxuICAgKlxuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gIHRoaXMubGlzdGVuZXJNYXAgPSBbe30sIHt9XTtcbiAgaWYgKHJvb3QpIHtcbiAgICB0aGlzLnJvb3Qocm9vdCk7XG4gIH1cblxuICAvKiogQHR5cGUgZnVuY3Rpb24oKSAqL1xuICB0aGlzLmhhbmRsZSA9IERlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUuYmluZCh0aGlzKTtcbn1cblxuLyoqXG4gKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50c1xuICogb24gdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5yb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICB2YXIgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICB2YXIgZXZlbnRUeXBlO1xuXG4gIC8vIFJlbW92ZSBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgbm8gcm9vdCBvciByb290IGlzIG5vdFxuICAvLyBhIGRvbSBub2RlLCB0aGVuIHJlbW92ZSBpbnRlcm5hbFxuICAvLyByb290IHJlZmVyZW5jZSBhbmQgZXhpdCBoZXJlXG4gIGlmICghcm9vdCB8fCAhcm9vdC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnJvb3RFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBub2RlIGF0IHdoaWNoXG4gICAqIGxpc3RlbmVycyBhcmUgYXR0YWNoZWQuXG4gICAqXG4gICAqIEB0eXBlIE5vZGVcbiAgICovXG4gIHRoaXMucm9vdEVsZW1lbnQgPSByb290O1xuXG4gIC8vIFNldCB1cCBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuY2FwdHVyZUZvclR5cGUgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgcmV0dXJuIFsnYmx1cicsICdlcnJvcicsICdmb2N1cycsICdsb2FkJywgJ3Jlc2l6ZScsICdzY3JvbGwnXS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYSBoYW5kbGVyIHRvIG9uZVxuICogZXZlbnQgZm9yIGFsbCBlbGVtZW50c1xuICogdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3IsXG4gKiBub3cgb3IgaW4gdGhlIGZ1dHVyZVxuICpcbiAqIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHJlY2VpdmVzXG4gKiB0aHJlZSBhcmd1bWVudHM6IHRoZSBET00gZXZlbnRcbiAqIG9iamVjdCwgdGhlIG5vZGUgdGhhdCBtYXRjaGVkXG4gKiB0aGUgc2VsZWN0b3Igd2hpbGUgdGhlIGV2ZW50XG4gKiB3YXMgYnViYmxpbmcgYW5kIGEgcmVmZXJlbmNlXG4gKiB0byBpdHNlbGYuIFdpdGhpbiB0aGUgaGFuZGxlcixcbiAqICd0aGlzJyBpcyBlcXVhbCB0byB0aGUgc2Vjb25kXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBUaGUgbm9kZSB0aGF0IGFjdHVhbGx5IHJlY2VpdmVkXG4gKiB0aGUgZXZlbnQgY2FuIGJlIGFjY2Vzc2VkIHZpYVxuICogJ2V2ZW50LnRhcmdldCcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBMaXN0ZW4gZm9yIHRoZXNlIGV2ZW50c1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzZWxlY3RvciBPbmx5IGhhbmRsZSBldmVudHMgb24gZWxlbWVudHMgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvciwgaWYgdW5kZWZpbmVkIG1hdGNoIHJvb3QgZWxlbWVudFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBoYW5kbGVyIEhhbmRsZXIgZnVuY3Rpb24gLSBldmVudCBkYXRhIHBhc3NlZCBoZXJlIHdpbGwgYmUgaW4gZXZlbnQuZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IFtldmVudERhdGFdIERhdGEgdG8gcGFzcyBpbiBldmVudC5kYXRhXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciByb290LCBsaXN0ZW5lck1hcCwgbWF0Y2hlciwgbWF0Y2hlclBhcmFtO1xuXG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBldmVudCB0eXBlOiAnICsgZXZlbnRUeXBlKTtcbiAgfVxuXG4gIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gc2Vuc2libGUgZGVmYXVsdHNcbiAgLy8gaWYgdXNlQ2FwdHVyZSBub3Qgc2V0XG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB1c2VDYXB0dXJlID0gdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgdHlwZSBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuXG4gIC8vIEFkZCBtYXN0ZXIgaGFuZGxlciBmb3IgdHlwZSBpZiBub3QgY3JlYXRlZCB5ZXRcbiAgaWYgKCFsaXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuICB9XG5cbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIG1hdGNoZXJQYXJhbSA9IG51bGw7XG5cbiAgICAvLyBDT01QTEVYIC0gbWF0Y2hlc1Jvb3QgbmVlZHMgdG8gaGF2ZSBhY2Nlc3MgdG9cbiAgICAvLyB0aGlzLnJvb3RFbGVtZW50LCBzbyBiaW5kIHRoZSBmdW5jdGlvbiB0byB0aGlzLlxuICAgIG1hdGNoZXIgPSBtYXRjaGVzUm9vdC5iaW5kKHRoaXMpO1xuXG4gIC8vIENvbXBpbGUgYSBtYXRjaGVyIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3JcbiAgfSBlbHNlIGlmICgvXlthLXpdKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzVGFnO1xuICB9IGVsc2UgaWYgKC9eI1thLXowLTlcXC1fXSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3Rvci5zbGljZSgxKTtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc0lkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzO1xuICB9XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICBsaXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgbWF0Y2hlclBhcmFtOiBtYXRjaGVyUGFyYW1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG4gKiBmb3IgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogdGhlIHNlbGVjdG9yLCBmb3JldmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIFJlbW92ZSBoYW5kbGVycyBmb3IgZXZlbnRzIG1hdGNoaW5nIHRoaXMgdHlwZSwgY29uc2lkZXJpbmcgdGhlIG90aGVyIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3JdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIG90aGVyIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gW2hhbmRsZXJdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIHByZXZpb3VzIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciBpLCBsaXN0ZW5lciwgbGlzdGVuZXJNYXAsIGxpc3RlbmVyTGlzdCwgc2luZ2xlRXZlbnRUeXBlO1xuXG4gIC8vIEhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gSWYgdXNlQ2FwdHVyZSBub3Qgc2V0LCByZW1vdmVcbiAgLy8gYWxsIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgZm9yIChzaW5nbGVFdmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShzaW5nbGVFdmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMub2ZmKHNpbmdsZUV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcbiAgaWYgKCFsaXN0ZW5lckxpc3QgfHwgIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbW92ZSBvbmx5IHBhcmFtZXRlciBtYXRjaGVzXG4gIC8vIGlmIHNwZWNpZmllZFxuICBmb3IgKGkgPSBsaXN0ZW5lckxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgIGlmICgoIXNlbGVjdG9yIHx8IHNlbGVjdG9yID09PSBsaXN0ZW5lci5zZWxlY3RvcikgJiYgKCFoYW5kbGVyIHx8IGhhbmRsZXIgPT09IGxpc3RlbmVyLmhhbmRsZXIpKSB7XG4gICAgICBsaXN0ZW5lckxpc3Quc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFsbCBsaXN0ZW5lcnMgcmVtb3ZlZFxuICBpZiAoIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICBkZWxldGUgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcblxuICAgIC8vIFJlbW92ZSB0aGUgbWFpbiBoYW5kbGVyXG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBIYW5kbGUgYW4gYXJiaXRyYXJ5IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgaSwgbCwgdHlwZSA9IGV2ZW50LnR5cGUsIHJvb3QsIHBoYXNlLCBsaXN0ZW5lciwgcmV0dXJuZWQsIGxpc3RlbmVyTGlzdCA9IFtdLCB0YXJnZXQsIC8qKiBAY29uc3QgKi8gRVZFTlRJR05PUkUgPSAnZnRMYWJzRGVsZWdhdGVJZ25vcmUnO1xuXG4gIGlmIChldmVudFtFVkVOVElHTk9SRV0gPT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cbiAgLy8gSGFyZGNvZGUgdmFsdWUgb2YgTm9kZS5URVhUX05PREVcbiAgLy8gYXMgbm90IGRlZmluZWQgaW4gSUU4XG4gIGlmICh0YXJnZXQubm9kZVR5cGUgPT09IDMpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gIHBoYXNlID0gZXZlbnQuZXZlbnRQaGFzZSB8fCAoIGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCA/IDMgOiAyICk7XG4gIFxuICBzd2l0Y2ggKHBoYXNlKSB7XG4gICAgY2FzZSAxOiAvL0V2ZW50LkNBUFRVUklOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV07XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOiAvL0V2ZW50LkFUX1RBUkdFVDpcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzBdICYmIHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSk7XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFsxXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMzogLy9FdmVudC5CVUJCTElOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV07XG4gICAgYnJlYWs7XG4gIH1cblxuICAvLyBOZWVkIHRvIGNvbnRpbnVvdXNseSBjaGVja1xuICAvLyB0aGF0IHRoZSBzcGVjaWZpYyBsaXN0IGlzXG4gIC8vIHN0aWxsIHBvcHVsYXRlZCBpbiBjYXNlIG9uZVxuICAvLyBvZiB0aGUgY2FsbGJhY2tzIGFjdHVhbGx5XG4gIC8vIGNhdXNlcyB0aGUgbGlzdCB0byBiZSBkZXN0cm95ZWQuXG4gIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICB3aGlsZSAodGFyZ2V0ICYmIGwpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgICAgLy8gQmFpbCBmcm9tIHRoaXMgbG9vcCBpZlxuICAgICAgLy8gdGhlIGxlbmd0aCBjaGFuZ2VkIGFuZFxuICAgICAgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyBkZWZpbmVkIGJldHdlZW4gaSBhbmQgbC5cbiAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBtYXRjaCBhbmQgZmlyZVxuICAgICAgLy8gdGhlIGV2ZW50IGlmIHRoZXJlJ3Mgb25lXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXlcbiAgICAgIC8vIHRvIGNoZWNrIGlmIGV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblxuICAgICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGJvdGggbG9vcHMuXG4gICAgICBpZiAobGlzdGVuZXIubWF0Y2hlci5jYWxsKHRhcmdldCwgbGlzdGVuZXIubWF0Y2hlclBhcmFtLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybmVkID0gdGhpcy5maXJlKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RvcCBwcm9wYWdhdGlvbiB0byBzdWJzZXF1ZW50XG4gICAgICAvLyBjYWxsYmFja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybmVkXG4gICAgICAvLyBmYWxzZVxuICAgICAgaWYgKHJldHVybmVkID09PSBmYWxzZSkge1xuICAgICAgICBldmVudFtFVkVOVElHTk9SRV0gPSB0cnVlO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXkgdG9cbiAgICAvLyBjaGVjayBpZiBldmVudCNzdG9wUHJvcGFnYXRpb25cbiAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgbG9vcGluZ1xuICAgIC8vIHRocm91Z2ggdGhlIERPTS4gU3RvcCBpZiB0aGVcbiAgICAvLyBkZWxlZ2F0aW9uIHJvb3QgaGFzIGJlZW4gcmVhY2hlZFxuICAgIGlmICh0YXJnZXQgPT09IHJvb3QpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmUgYSBsaXN0ZW5lciBvbiBhIHRhcmdldC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIGxpc3RlbmVyLmhhbmRsZXIuY2FsbCh0YXJnZXQsIGV2ZW50LCB0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSBnZW5lcmljIHNlbGVjdG9yLlxuICpcbiAqIEB0eXBlIGZ1bmN0aW9uKClcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvclxuICovXG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbihlbCkge1xuICBpZiAoIWVsKSByZXR1cm47XG4gIHZhciBwID0gZWwucHJvdG90eXBlO1xuICByZXR1cm4gKHAubWF0Y2hlcyB8fCBwLm1hdGNoZXNTZWxlY3RvciB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IHAub01hdGNoZXNTZWxlY3Rvcik7XG59KEVsZW1lbnQpKTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSB0YWcgc2VsZWN0b3IuXG4gKlxuICogVGFncyBhcmUgTk9UIGNhc2Utc2Vuc2l0aXZlLFxuICogZXhjZXB0IGluIFhNTCAoYW5kIFhNTC1iYXNlZFxuICogbGFuZ3VhZ2VzIHN1Y2ggYXMgWEhUTUwpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFRoZSB0YWcgbmFtZSB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1RhZyh0YWdOYW1lLCBlbGVtZW50KSB7XG4gIHJldHVybiB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyB0aGUgcm9vdC5cbiAqXG4gKiBAcGFyYW0gez9TdHJpbmd9IHNlbGVjdG9yIEluIHRoaXMgY2FzZSB0aGlzIGlzIGFsd2F5cyBwYXNzZWQgdGhyb3VnaCBhcyBudWxsIGFuZCBub3QgdXNlZFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzUm9vdChzZWxlY3RvciwgZWxlbWVudCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSovXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50ID09PSB3aW5kb3cpIHJldHVybiBlbGVtZW50ID09PSBkb2N1bWVudDtcbiAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQgPT09IGVsZW1lbnQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgSUQgb2ZcbiAqIHRoZSBlbGVtZW50IGluICd0aGlzJ1xuICogbWF0Y2hlcyB0aGUgZ2l2ZW4gSUQuXG4gKlxuICogSURzIGFyZSBjYXNlLXNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIElEIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzSWQoaWQsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlkID09PSBlbGVtZW50LmlkO1xufVxuXG4vKipcbiAqIFNob3J0IGhhbmQgZm9yIG9mZigpXG4gKiBhbmQgcm9vdCgpLCBpZSBib3RoXG4gKiB3aXRoIG5vIHBhcmFtZXRlcnNcbiAqXG4gKiBAcmV0dXJuIHZvaWRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vZmYoKTtcbiAgdGhpcy5yb290KCk7XG59O1xuIiwiLypnbG9iYWwgcmVxdWlyZSovXG5yZXF1aXJlKCcuLi8uLi9tYWluJyk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnby5ET01Db250ZW50TG9hZGVkJykpO1xufSk7XG4iLCIvKmdsb2JhbCByZXF1aXJlLCBtb2R1bGUqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRHJvcGRvd25NZW51ID0gcmVxdWlyZSgnLi9zcmMvanMvRHJvcGRvd25NZW51Jyk7XG5cbnZhciBjb25zdHJ1Y3RBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdERyb3Bkb3duTWVudS5pbml0KCk7XG5cdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ28uRE9NQ29udGVudExvYWRlZCcsIGNvbnN0cnVjdEFsbCk7XG59O1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdvLkRPTUNvbnRlbnRMb2FkZWQnLCBjb25zdHJ1Y3RBbGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duTWVudTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIERvbURlbGVnYXRlID0gcmVxdWlyZShcIi4vLi4vLi4vYm93ZXJfY29tcG9uZW50cy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzXCIpO1xudmFyIGRpc3BhdGNoRXZlbnQgPSByZXF1aXJlKCcuL3V0aWxzJykuZGlzcGF0Y2hFdmVudDtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29udGV4dHVhbCBtZW51IGZvciBkaXNwbGF5aW5nIGxpc3QgaXRlbXMuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIERyb3Bkb3duTWVudShlbGVtZW50KSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBEcm9wZG93bk1lbnUpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25zdHJ1Y3RvciBEcm9wZG93bk1lbnUgcmVxdWlyZXMgXFwnbmV3XFwnJyk7XG5cdGlmICghZWxlbWVudCkgdGhyb3cgbmV3IFR5cGVFcnJvcignbWlzc2luZyByZXF1aXJlZCBhcmd1bWVudDogZWxlbWVudCcpO1xuXG5cdHZhciBkcm9wZG93bk1lbnUgPSB0aGlzO1xuXHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG5cdHZhciB0b2dnbGVFbGVtZW50ID0gdGhpcy50b2dnbGVFbGVtZW50ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cdGlmICghdG9nZ2xlRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKCd1bmFibGUgdG8gbG9jYXRlIGEgY2hpbGQgZWxlbWVudCB3aXRoIHNlbGVjdG9yOiBbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cblx0ZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRkcm9wZG93bk1lbnUudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGUpIHtcblx0XHQvLyBIYW5kbGUgdXAgYXJyb3csIGRvd24gYXJyb3csIGVzY2FwZSwgYW5kIHNwYWNlIGtleXMgZm9yIGVsZW1lbnRzIHRoYXRcblx0XHQvLyBhcmUgbm90IGlucHV0cyBhbmQgdGV4dGFyZWFzXG5cdFx0aWYgKCEvKDM4fDQwfDI3fDMyKS8udGVzdChlLndoaWNoKSB8fCAvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpKSByZXR1cm47XG5cblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHZhciBlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoZS50YXJnZXQpO1xuXHRcdHZhciB0b2dnbGVFbGVtZW50ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cblx0XHR2YXIgaXNFeHBhbmRlZCA9IGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJyk7XG5cblx0XHQvLyBUb2dnbGUgdGhlIG1lbnU6IGlmIG5vdCBleHBhbmRlZCwga2V5cyBvdGhlciB0aGFuIGVzYyB3aWxsIGV4cGFuZCBpdDtcblx0XHQvLyBpZiBleHBhbmRlZCwgZXNjIHdpbGwgY29sbGFwc2UgaXQuXG5cdFx0aWYgKCghaXNFeHBhbmRlZCAmJiBlLndoaWNoICE9PSAyNykgfHwgKGlzRXhwYW5kZWQgJiYgZS53aGljaCA9PT0gMjcpKSB7XG5cdFx0XHRpZiAoZS53aGljaCA9PT0gMjcpIGRpc3BhdGNoRXZlbnQodG9nZ2xlRWxlbWVudCwgJ2ZvY3VzJyk7XG5cdFx0XHRyZXR1cm4gZGlzcGF0Y2hFdmVudCh0b2dnbGVFbGVtZW50LCAnY2xpY2snKTtcblx0XHR9XG5cblx0XHQvLyBGb2N1cyBtZW51IGl0ZW1cblx0XHR2YXIgaXRlbUVscyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm8taGUtZHJvcGRvd24tbWVudV9fbWVudS1pdGVtOm5vdCguby1oZS1kcm9wZG93bi1tZW51X19tZW51LWl0ZW0tLWRpc2FibGVkKSBhJyk7XG5cblx0XHRpZiAoIWl0ZW1FbHMubGVuZ3RoKSByZXR1cm47XG5cblx0XHR2YXIgaW5kZXggPSBpbmRleE9mRWxlbWVudChpdGVtRWxzLCBlLnRhcmdldCk7XG5cblx0XHRpZiAoZS53aGljaCA9PT0gMzggJiYgaW5kZXggPiAwKSBpbmRleC0tO1xuXHRcdGlmIChlLndoaWNoID09PSA0MCAmJiBpbmRleCA8IGl0ZW1FbHMubGVuZ3RoIC0gMSkgaW5kZXgrKztcblx0XHRpZiAoIX5pbmRleCkgaW5kZXggPSAwO1xuXG5cdFx0aXRlbUVsc1tpbmRleF0uZm9jdXMoKTtcblx0fVxuXG5cdGlmICghRHJvcGRvd25NZW51LmJvZHlEZWxlZ2F0ZSkge1xuXHRcdHZhciBib2R5RGVsZWdhdGUgPSBuZXcgRG9tRGVsZWdhdGUoZG9jdW1lbnQuYm9keSk7XG5cblx0XHRib2R5RGVsZWdhdGUub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmICghZS5kZWZhdWx0UHJldmVudGVkKSBjb2xsYXBzZUFsbCgpO1xuXHRcdH0pO1xuXG5cdFx0RHJvcGRvd25NZW51LmJvZHlEZWxlZ2F0ZSA9IGJvZHlEZWxlZ2F0ZTtcblx0fVxuXG5cdHZhciBlbGVtZW50RGVsZWdhdGUgPSBuZXcgRG9tRGVsZWdhdGUoZWxlbWVudCk7XG5cblx0ZWxlbWVudERlbGVnYXRlLm9uKCdrZXlkb3duJywgJ1tkYXRhLXRvZ2dsZT1cImRyb3Bkb3duLW1lbnVcIl0nLCBoYW5kbGVLZXlkb3duKTtcblx0ZWxlbWVudERlbGVnYXRlLm9uKCdrZXlkb3duJywgJ1tyb2xlPVwibWVudVwiXScsIGhhbmRsZUtleWRvd24pO1xuXHRlbGVtZW50RGVsZWdhdGUub24oJ2NsaWNrJywgaGFuZGxlQ2xpY2spO1xuXG5cdGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdFx0ZWxlbWVudERlbGVnYXRlLmRlc3Ryb3koKTtcblx0fVxuXG5cdHRoaXMuZGVzdHJveSA9IGRlc3Ryb3k7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYWxsIGRyb3Bkb3duLW1lbnUgZWxlbWVudHMgb24gdGhlIHBhZ2Ugb3Igd2l0aGluXG4gKiB0aGUgZWxlbWVudCBwYXNzZWQgaW4uXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudHxzdHJpbmd9IGVsZW1lbnQgRE9NIGVsZW1lbnQgb3Igc2VsZWN0b3IuXG4gKiBAcmV0dXJuIHtEcm9wZG93bk1lbnVbXX0gTGlzdCBvZiBEcm9wZG93bk1lbnUgaW5zdGFuY2VzIHRoYXRcbiAqIGhhdmUgYmVlbiBpbml0aWFsaXplZC5cbiAqL1xuRHJvcGRvd25NZW51LmluaXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXHR2YXIgZHJvcGRvd25NZW51RWxzID0gc2VsZWN0QWxsKGVsZW1lbnQpO1xuXHR2YXIgZHJvcGRvd25NZW51cyA9IFtdO1xuXG5cdGZvciAodmFyIGkgPSAwLCBsID0gZHJvcGRvd25NZW51RWxzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdGRyb3Bkb3duTWVudXMucHVzaChuZXcgRHJvcGRvd25NZW51KGRyb3Bkb3duTWVudUVsc1tpXSkpO1xuXHR9XG5cblx0cmV0dXJuIGRyb3Bkb3duTWVudXM7XG59O1xuXG4vKipcbiAqIERlc3Ryb3lzIGFsbCBkcm9wZG93bi1tZW51IGluc3RhbmNlcyBvbiB0aGUgcGFnZS5cbiAqL1xuRHJvcGRvd25NZW51LmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cdERyb3Bkb3duTWVudS5ib2R5RGVsZWdhdGUgJiYgRHJvcGRvd25NZW51LmJvZHlEZWxlZ2F0ZS5kZXN0cm95KCk7XG59O1xuXG4vKipcbiAqIEV4cGFuZHMgb3IgY29sbGFwc2VzIHRoZSBtZW51IGl0ZW1zLlxuICovXG5Ecm9wZG93bk1lbnUucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQ7XG5cdHZhciB0b2dnbGVFbGVtZW50ID0gdGhpcy50b2dnbGVFbGVtZW50O1xuXG5cdHZhciBpc0Rpc2FibGVkID1cblx0XHR0b2dnbGVFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnby1oZS1kcm9wZG93bi1tZW51X190b2dnbGUtLWRpc2FibGVkJykgfHxcblx0XHR0b2dnbGVFbGVtZW50LmRpc2FibGVkO1xuXG5cdHZhciBpc0V4cGFuZGVkID0gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ28taGUtZHJvcGRvd24tbWVudS0tZXhwYW5kZWQnKTtcblxuXHRjb2xsYXBzZUFsbCgpO1xuXG5cdGlmIChpc0Rpc2FibGVkKSByZXR1cm47XG5cblx0aWYgKCFpc0V4cGFuZGVkKSB7XG5cdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJyk7XG5cdFx0dG9nZ2xlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBnZXRSb290RWxlbWVudChlbGVtZW50KSB7XG5cdHdoaWxlIChlbGVtZW50ICE9PSBudWxsKSB7XG5cdFx0aWYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW8tY29tcG9uZW50JykgPT09ICdvLWhlLWRyb3Bkb3duLW1lbnUnKSByZXR1cm4gZWxlbWVudDtcblx0XHRlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGluZGV4T2ZFbGVtZW50KGVsZW1lbnRzLCBlbGVtZW50KSB7XG5cdGZvciAodmFyIGkgPSAwLCBsID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0aWYgKGVsZW1lbnRzW2ldID09PSBlbGVtZW50KSByZXR1cm4gaTtcblx0fVxuXG5cdHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gc2VsZWN0QWxsKGVsZW1lbnQpIHtcblx0aWYgKCFlbGVtZW50KSB7XG5cdFx0ZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cdH0gZWxzZSBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG5cdFx0ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudCk7XG5cdH1cblxuXHRyZXR1cm4gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vLWNvbXBvbmVudD1cIm8taGUtZHJvcGRvd24tbWVudVwiXScpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZUFsbCgpIHtcblx0dmFyIGRyb3Bkb3duTWVudUVscyA9IHNlbGVjdEFsbCgpO1xuXG5cdGZvciAodmFyIGkgPSAwLCBsID0gZHJvcGRvd25NZW51RWxzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdHZhciBlbGVtZW50ID0gZHJvcGRvd25NZW51RWxzW2ldO1xuXHRcdHZhciB0b2dnbGVFbGVtZW50ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS10b2dnbGU9XCJkcm9wZG93bi1tZW51XCJdJyk7XG5cblx0XHRpZiAoIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJykpIGNvbnRpbnVlO1xuXG5cdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdvLWhlLWRyb3Bkb3duLW1lbnUtLWV4cGFuZGVkJyk7XG5cdFx0dG9nZ2xlRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duTWVudTtcbiIsIi8vIEhlbHBlciBmdW5jdGlvbiB0byBkaXNwYXRjaCBldmVudHNcbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoZWxlbWVudCwgbmFtZSwgZGF0YSkge1xuXHQndXNlIHN0cmljdCc7XG5cdGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCAmJiBlbGVtZW50LmRpc3BhdGNoRXZlbnQpIHtcblx0XHR2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG5cblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0ZXZlbnQuZGV0YWlsID0gZGF0YTtcblx0XHR9XG5cblx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuXHR9XG59XG5cbmV4cG9ydHMuZGlzcGF0Y2hFdmVudCA9IGRpc3BhdGNoRXZlbnQ7XG4iXX0=
