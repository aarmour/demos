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

var Collapse = require("./src/js/Collapse");

var constructAll = (function (_constructAll) {
	var _constructAllWrapper = function constructAll() {
		return _constructAll.apply(this, arguments);
	};

	_constructAllWrapper.toString = function () {
		return _constructAll.toString();
	};

	return _constructAllWrapper;
})(function () {
	Collapse.init();
	document.removeEventListener("o.DOMContentLoaded", constructAll);
});

document.addEventListener("o.DOMContentLoaded", constructAll);

module.exports = Collapse;

},{"./src/js/Collapse":4}],4:[function(require,module,exports){
"use strict";

var DomDelegate = require("./../../bower_components/dom-delegate/lib/delegate.js");
var forEach = require("./utils").forEach;

function Collapse(element) {
	if (!(this instanceof Collapse)) throw new TypeError("Failed to construct Collapse: constructor requires 'new'.");
	if (arguments.length === 0) throw new TypeError("Failed to construct Collapse: 1 argument required, but 0 provided.");
	if (!(element instanceof HTMLElement)) throw new TypeError("Failed to construct Collapse: element must be HTMLElement");

	var triggerSelector = "[data-toggle=\"o-he-collapse\"][href=\"#" + element.id + "\"]," + "[data-toggle=\"o-he-collapse\"][data-target=\"#" + element.id + "\"]";

	this.target = element;
	this.trigger = document.querySelectorAll(triggerSelector);
	Collapse.cache.set(element, this);

	if (!element.classList.contains("o-he-collapse")) element.classList.add("o-he-collapse");

	if (!Collapse.bodyDelegate) {
		var bodyDelegate = new DomDelegate(document.body);

		bodyDelegate.on("click", "[data-toggle=\"o-he-collapse\"]", function handleClick(e) {
			e.preventDefault();

			var target = getTargetFromTrigger(e.target);

			forEach(target, function (index, target) {
				var collapsible = Collapse.cache.get(target);

				if (!collapsible && target.getAttribute("data-o-component") === "o-he-collapse") {
					collapsible = new Collapse(target);
				}

				if (collapsible) collapsible.toggle();
			});
		});

		Collapse.bodyDelegate = bodyDelegate;
	}
}

Collapse.cache = new WeakMap();

/**
 * Initializes all collapsible elements on the page or within
 * the element passed in.
 * @param  {HTMLElement|string} element DOM element or selector.
 * @return {Collapse[]} List of Collapse instances that
 * have been initialized.
 */
Collapse.init = function (element) {
	var collapseEls = selectAll(element);
	var collapsibles = [];

	for (var i = 0, l = collapseEls.length; i < l; i++) {
		collapsibles.push(new Collapse(collapseEls[i]));
	}

	return collapsibles;
};

/**
 * Destroys all collapsible elements on the page.
 */
Collapse.destroy = function () {
	if (Collapse.bodyDelegate) Collapse.bodyDelegate.destroy();
};

/**
 * Expands the collapsible element if it is not already expanded.
 */
Collapse.prototype.show = function () {
	var target = this.target;
	var trigger = this.trigger;

	if (target.classList.contains("o-he-collapse--expanded")) return;

	target.classList.add("o-he-collapse--expanded");
	target.setAttribute("aria-expanded", true);

	forEach(trigger, function (index, trigger) {
		trigger.setAttribute("aria-expanded", true);
	});
};

/**
 * Collapses the collapsible element if it is not already collapsed.
 */
Collapse.prototype.hide = function () {
	var target = this.target;
	var trigger = this.trigger;

	if (!target.classList.contains("o-he-collapse--expanded")) return;

	target.classList.remove("o-he-collapse--expanded");
	target.setAttribute("aria-expanded", false);

	forEach(trigger, function (index, trigger) {
		trigger.setAttribute("aria-expanded", false);
	});
};

/**
 * Toggles the collapsible element based on its current state.
 */
Collapse.prototype.toggle = function () {
	this[this.target.classList.contains("o-he-collapse--expanded") ? "hide" : "show"]();
};

function selectAll(element) {
	if (!element) {
		element = document.body;
	} else if (!(element instanceof HTMLElement)) {
		element = document.querySelector(element);
	}

	return element.querySelectorAll("[data-o-component=\"o-he-collapse\"]");
}

function getTargetFromTrigger(element) {
	var target = element.getAttribute("data-target") || element.getAttribute("href");
	return document.querySelectorAll(target);
}

module.exports = Collapse;

},{"./../../bower_components/dom-delegate/lib/delegate.js":1,"./utils":5}],5:[function(require,module,exports){
"use strict";

exports.forEach = function (array, callback) {
	for (var i = 0, l = array.length; i < l; i++) {
		callback.call(this, i, array[i]);
	}
};

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy91YXJtb2FkLy5udm0vdjAuMTAuMzYvbGliL25vZGVfbW9kdWxlcy9vcmlnYW1pLWJ1aWxkLXRvb2xzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvdWFybW9hZC9Qcm9qZWN0cy9vcmlnYW1pL28taGUtY29sbGFwc2UvYm93ZXJfY29tcG9uZW50cy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwiL1VzZXJzL3Vhcm1vYWQvUHJvamVjdHMvb3JpZ2FtaS9vLWhlLWNvbGxhcHNlL2RlbW9zL3NyYy9kZW1vLmpzIiwiL1VzZXJzL3Vhcm1vYWQvUHJvamVjdHMvb3JpZ2FtaS9vLWhlLWNvbGxhcHNlL21haW4uanMiLCIvVXNlcnMvdWFybW9hZC9Qcm9qZWN0cy9vcmlnYW1pL28taGUtY29sbGFwc2Uvc3JjL2pzL0NvbGxhcHNlLmpzIiwiL1VzZXJzL3Vhcm1vYWQvUHJvamVjdHMvb3JpZ2FtaS9vLWhlLWNvbGxhcHNlL3NyYy9qcy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7QUFZMUIsU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFOzs7Ozs7OztBQVF0QixNQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzVCLE1BQUksSUFBSSxFQUFFO0FBQ1IsUUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUNqQjs7O0FBR0QsTUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDcEQ7Ozs7Ozs7OztBQVNELFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVMsSUFBSSxFQUFF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QUFZLENBQUM7O0FBRWIsT0FBTyxDQUFDLE9BQU8sR0FBRyxVQUFVLEtBQUssRUFBRSxRQUFRLEVBQUU7QUFDNUMsTUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3QyxVQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakM7Q0FDRCxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGVnYXRlO1xuXG4vKipcbiAqIERPTSBldmVudCBkZWxlZ2F0b3JcbiAqXG4gKiBUaGUgZGVsZWdhdG9yIHdpbGwgbGlzdGVuXG4gKiBmb3IgZXZlbnRzIHRoYXQgYnViYmxlIHVwXG4gKiB0byB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICovXG5mdW5jdGlvbiBEZWxlZ2F0ZShyb290KSB7XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgbWFwIG9mIGxpc3RlbmVyXG4gICAqIGxpc3RzLCBrZXllZCBieSBldmVudCBuYW1lLlxuICAgKlxuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gIHRoaXMubGlzdGVuZXJNYXAgPSBbe30sIHt9XTtcbiAgaWYgKHJvb3QpIHtcbiAgICB0aGlzLnJvb3Qocm9vdCk7XG4gIH1cblxuICAvKiogQHR5cGUgZnVuY3Rpb24oKSAqL1xuICB0aGlzLmhhbmRsZSA9IERlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUuYmluZCh0aGlzKTtcbn1cblxuLyoqXG4gKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50c1xuICogb24gdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5yb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICB2YXIgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICB2YXIgZXZlbnRUeXBlO1xuXG4gIC8vIFJlbW92ZSBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgbm8gcm9vdCBvciByb290IGlzIG5vdFxuICAvLyBhIGRvbSBub2RlLCB0aGVuIHJlbW92ZSBpbnRlcm5hbFxuICAvLyByb290IHJlZmVyZW5jZSBhbmQgZXhpdCBoZXJlXG4gIGlmICghcm9vdCB8fCAhcm9vdC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnJvb3RFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBub2RlIGF0IHdoaWNoXG4gICAqIGxpc3RlbmVycyBhcmUgYXR0YWNoZWQuXG4gICAqXG4gICAqIEB0eXBlIE5vZGVcbiAgICovXG4gIHRoaXMucm9vdEVsZW1lbnQgPSByb290O1xuXG4gIC8vIFNldCB1cCBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuY2FwdHVyZUZvclR5cGUgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgcmV0dXJuIFsnYmx1cicsICdlcnJvcicsICdmb2N1cycsICdsb2FkJywgJ3Jlc2l6ZScsICdzY3JvbGwnXS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYSBoYW5kbGVyIHRvIG9uZVxuICogZXZlbnQgZm9yIGFsbCBlbGVtZW50c1xuICogdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3IsXG4gKiBub3cgb3IgaW4gdGhlIGZ1dHVyZVxuICpcbiAqIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHJlY2VpdmVzXG4gKiB0aHJlZSBhcmd1bWVudHM6IHRoZSBET00gZXZlbnRcbiAqIG9iamVjdCwgdGhlIG5vZGUgdGhhdCBtYXRjaGVkXG4gKiB0aGUgc2VsZWN0b3Igd2hpbGUgdGhlIGV2ZW50XG4gKiB3YXMgYnViYmxpbmcgYW5kIGEgcmVmZXJlbmNlXG4gKiB0byBpdHNlbGYuIFdpdGhpbiB0aGUgaGFuZGxlcixcbiAqICd0aGlzJyBpcyBlcXVhbCB0byB0aGUgc2Vjb25kXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBUaGUgbm9kZSB0aGF0IGFjdHVhbGx5IHJlY2VpdmVkXG4gKiB0aGUgZXZlbnQgY2FuIGJlIGFjY2Vzc2VkIHZpYVxuICogJ2V2ZW50LnRhcmdldCcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBMaXN0ZW4gZm9yIHRoZXNlIGV2ZW50c1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzZWxlY3RvciBPbmx5IGhhbmRsZSBldmVudHMgb24gZWxlbWVudHMgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvciwgaWYgdW5kZWZpbmVkIG1hdGNoIHJvb3QgZWxlbWVudFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBoYW5kbGVyIEhhbmRsZXIgZnVuY3Rpb24gLSBldmVudCBkYXRhIHBhc3NlZCBoZXJlIHdpbGwgYmUgaW4gZXZlbnQuZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IFtldmVudERhdGFdIERhdGEgdG8gcGFzcyBpbiBldmVudC5kYXRhXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciByb290LCBsaXN0ZW5lck1hcCwgbWF0Y2hlciwgbWF0Y2hlclBhcmFtO1xuXG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBldmVudCB0eXBlOiAnICsgZXZlbnRUeXBlKTtcbiAgfVxuXG4gIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gc2Vuc2libGUgZGVmYXVsdHNcbiAgLy8gaWYgdXNlQ2FwdHVyZSBub3Qgc2V0XG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB1c2VDYXB0dXJlID0gdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgdHlwZSBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuXG4gIC8vIEFkZCBtYXN0ZXIgaGFuZGxlciBmb3IgdHlwZSBpZiBub3QgY3JlYXRlZCB5ZXRcbiAgaWYgKCFsaXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuICB9XG5cbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIG1hdGNoZXJQYXJhbSA9IG51bGw7XG5cbiAgICAvLyBDT01QTEVYIC0gbWF0Y2hlc1Jvb3QgbmVlZHMgdG8gaGF2ZSBhY2Nlc3MgdG9cbiAgICAvLyB0aGlzLnJvb3RFbGVtZW50LCBzbyBiaW5kIHRoZSBmdW5jdGlvbiB0byB0aGlzLlxuICAgIG1hdGNoZXIgPSBtYXRjaGVzUm9vdC5iaW5kKHRoaXMpO1xuXG4gIC8vIENvbXBpbGUgYSBtYXRjaGVyIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3JcbiAgfSBlbHNlIGlmICgvXlthLXpdKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzVGFnO1xuICB9IGVsc2UgaWYgKC9eI1thLXowLTlcXC1fXSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3Rvci5zbGljZSgxKTtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc0lkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzO1xuICB9XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICBsaXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgbWF0Y2hlclBhcmFtOiBtYXRjaGVyUGFyYW1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG4gKiBmb3IgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogdGhlIHNlbGVjdG9yLCBmb3JldmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIFJlbW92ZSBoYW5kbGVycyBmb3IgZXZlbnRzIG1hdGNoaW5nIHRoaXMgdHlwZSwgY29uc2lkZXJpbmcgdGhlIG90aGVyIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3JdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIG90aGVyIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gW2hhbmRsZXJdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIHByZXZpb3VzIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciBpLCBsaXN0ZW5lciwgbGlzdGVuZXJNYXAsIGxpc3RlbmVyTGlzdCwgc2luZ2xlRXZlbnRUeXBlO1xuXG4gIC8vIEhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gSWYgdXNlQ2FwdHVyZSBub3Qgc2V0LCByZW1vdmVcbiAgLy8gYWxsIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgZm9yIChzaW5nbGVFdmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShzaW5nbGVFdmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMub2ZmKHNpbmdsZUV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcbiAgaWYgKCFsaXN0ZW5lckxpc3QgfHwgIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbW92ZSBvbmx5IHBhcmFtZXRlciBtYXRjaGVzXG4gIC8vIGlmIHNwZWNpZmllZFxuICBmb3IgKGkgPSBsaXN0ZW5lckxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgIGlmICgoIXNlbGVjdG9yIHx8IHNlbGVjdG9yID09PSBsaXN0ZW5lci5zZWxlY3RvcikgJiYgKCFoYW5kbGVyIHx8IGhhbmRsZXIgPT09IGxpc3RlbmVyLmhhbmRsZXIpKSB7XG4gICAgICBsaXN0ZW5lckxpc3Quc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFsbCBsaXN0ZW5lcnMgcmVtb3ZlZFxuICBpZiAoIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICBkZWxldGUgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcblxuICAgIC8vIFJlbW92ZSB0aGUgbWFpbiBoYW5kbGVyXG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBIYW5kbGUgYW4gYXJiaXRyYXJ5IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgaSwgbCwgdHlwZSA9IGV2ZW50LnR5cGUsIHJvb3QsIHBoYXNlLCBsaXN0ZW5lciwgcmV0dXJuZWQsIGxpc3RlbmVyTGlzdCA9IFtdLCB0YXJnZXQsIC8qKiBAY29uc3QgKi8gRVZFTlRJR05PUkUgPSAnZnRMYWJzRGVsZWdhdGVJZ25vcmUnO1xuXG4gIGlmIChldmVudFtFVkVOVElHTk9SRV0gPT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cbiAgLy8gSGFyZGNvZGUgdmFsdWUgb2YgTm9kZS5URVhUX05PREVcbiAgLy8gYXMgbm90IGRlZmluZWQgaW4gSUU4XG4gIGlmICh0YXJnZXQubm9kZVR5cGUgPT09IDMpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gIHBoYXNlID0gZXZlbnQuZXZlbnRQaGFzZSB8fCAoIGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCA/IDMgOiAyICk7XG4gIFxuICBzd2l0Y2ggKHBoYXNlKSB7XG4gICAgY2FzZSAxOiAvL0V2ZW50LkNBUFRVUklOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV07XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOiAvL0V2ZW50LkFUX1RBUkdFVDpcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzBdICYmIHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSk7XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFsxXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMzogLy9FdmVudC5CVUJCTElOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV07XG4gICAgYnJlYWs7XG4gIH1cblxuICAvLyBOZWVkIHRvIGNvbnRpbnVvdXNseSBjaGVja1xuICAvLyB0aGF0IHRoZSBzcGVjaWZpYyBsaXN0IGlzXG4gIC8vIHN0aWxsIHBvcHVsYXRlZCBpbiBjYXNlIG9uZVxuICAvLyBvZiB0aGUgY2FsbGJhY2tzIGFjdHVhbGx5XG4gIC8vIGNhdXNlcyB0aGUgbGlzdCB0byBiZSBkZXN0cm95ZWQuXG4gIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICB3aGlsZSAodGFyZ2V0ICYmIGwpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgICAgLy8gQmFpbCBmcm9tIHRoaXMgbG9vcCBpZlxuICAgICAgLy8gdGhlIGxlbmd0aCBjaGFuZ2VkIGFuZFxuICAgICAgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyBkZWZpbmVkIGJldHdlZW4gaSBhbmQgbC5cbiAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBtYXRjaCBhbmQgZmlyZVxuICAgICAgLy8gdGhlIGV2ZW50IGlmIHRoZXJlJ3Mgb25lXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXlcbiAgICAgIC8vIHRvIGNoZWNrIGlmIGV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblxuICAgICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGJvdGggbG9vcHMuXG4gICAgICBpZiAobGlzdGVuZXIubWF0Y2hlci5jYWxsKHRhcmdldCwgbGlzdGVuZXIubWF0Y2hlclBhcmFtLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybmVkID0gdGhpcy5maXJlKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RvcCBwcm9wYWdhdGlvbiB0byBzdWJzZXF1ZW50XG4gICAgICAvLyBjYWxsYmFja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybmVkXG4gICAgICAvLyBmYWxzZVxuICAgICAgaWYgKHJldHVybmVkID09PSBmYWxzZSkge1xuICAgICAgICBldmVudFtFVkVOVElHTk9SRV0gPSB0cnVlO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXkgdG9cbiAgICAvLyBjaGVjayBpZiBldmVudCNzdG9wUHJvcGFnYXRpb25cbiAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgbG9vcGluZ1xuICAgIC8vIHRocm91Z2ggdGhlIERPTS4gU3RvcCBpZiB0aGVcbiAgICAvLyBkZWxlZ2F0aW9uIHJvb3QgaGFzIGJlZW4gcmVhY2hlZFxuICAgIGlmICh0YXJnZXQgPT09IHJvb3QpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmUgYSBsaXN0ZW5lciBvbiBhIHRhcmdldC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIGxpc3RlbmVyLmhhbmRsZXIuY2FsbCh0YXJnZXQsIGV2ZW50LCB0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSBnZW5lcmljIHNlbGVjdG9yLlxuICpcbiAqIEB0eXBlIGZ1bmN0aW9uKClcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvclxuICovXG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbihlbCkge1xuICBpZiAoIWVsKSByZXR1cm47XG4gIHZhciBwID0gZWwucHJvdG90eXBlO1xuICByZXR1cm4gKHAubWF0Y2hlcyB8fCBwLm1hdGNoZXNTZWxlY3RvciB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IHAub01hdGNoZXNTZWxlY3Rvcik7XG59KEVsZW1lbnQpKTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSB0YWcgc2VsZWN0b3IuXG4gKlxuICogVGFncyBhcmUgTk9UIGNhc2Utc2Vuc2l0aXZlLFxuICogZXhjZXB0IGluIFhNTCAoYW5kIFhNTC1iYXNlZFxuICogbGFuZ3VhZ2VzIHN1Y2ggYXMgWEhUTUwpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFRoZSB0YWcgbmFtZSB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1RhZyh0YWdOYW1lLCBlbGVtZW50KSB7XG4gIHJldHVybiB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyB0aGUgcm9vdC5cbiAqXG4gKiBAcGFyYW0gez9TdHJpbmd9IHNlbGVjdG9yIEluIHRoaXMgY2FzZSB0aGlzIGlzIGFsd2F5cyBwYXNzZWQgdGhyb3VnaCBhcyBudWxsIGFuZCBub3QgdXNlZFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzUm9vdChzZWxlY3RvciwgZWxlbWVudCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSovXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50ID09PSB3aW5kb3cpIHJldHVybiBlbGVtZW50ID09PSBkb2N1bWVudDtcbiAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQgPT09IGVsZW1lbnQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgSUQgb2ZcbiAqIHRoZSBlbGVtZW50IGluICd0aGlzJ1xuICogbWF0Y2hlcyB0aGUgZ2l2ZW4gSUQuXG4gKlxuICogSURzIGFyZSBjYXNlLXNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIElEIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzSWQoaWQsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlkID09PSBlbGVtZW50LmlkO1xufVxuXG4vKipcbiAqIFNob3J0IGhhbmQgZm9yIG9mZigpXG4gKiBhbmQgcm9vdCgpLCBpZSBib3RoXG4gKiB3aXRoIG5vIHBhcmFtZXRlcnNcbiAqXG4gKiBAcmV0dXJuIHZvaWRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vZmYoKTtcbiAgdGhpcy5yb290KCk7XG59O1xuIiwiLypnbG9iYWwgcmVxdWlyZSovXG5yZXF1aXJlKCcuLi8uLi9tYWluJyk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnby5ET01Db250ZW50TG9hZGVkJykpO1xufSk7XG4iLCIvKmdsb2JhbCByZXF1aXJlLCBtb2R1bGUqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29sbGFwc2UgPSByZXF1aXJlKCcuL3NyYy9qcy9Db2xsYXBzZScpO1xuXG52YXIgY29uc3RydWN0QWxsID0gZnVuY3Rpb24gKCkge1xuXHRDb2xsYXBzZS5pbml0KCk7XG5cdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ28uRE9NQ29udGVudExvYWRlZCcsIGNvbnN0cnVjdEFsbCk7XG59O1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdvLkRPTUNvbnRlbnRMb2FkZWQnLCBjb25zdHJ1Y3RBbGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhcHNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRG9tRGVsZWdhdGUgPSByZXF1aXJlKFwiLi8uLi8uLi9ib3dlcl9jb21wb25lbnRzL2RvbS1kZWxlZ2F0ZS9saWIvZGVsZWdhdGUuanNcIik7XG52YXIgZm9yRWFjaCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5mb3JFYWNoO1xuXG5mdW5jdGlvbiBDb2xsYXBzZShlbGVtZW50KSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBDb2xsYXBzZSkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZhaWxlZCB0byBjb25zdHJ1Y3QgQ29sbGFwc2U6IGNvbnN0cnVjdG9yIHJlcXVpcmVzIFxcJ25ld1xcJy4nKTtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ZhaWxlZCB0byBjb25zdHJ1Y3QgQ29sbGFwc2U6IDEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCAwIHByb3ZpZGVkLicpO1xuXHRpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdGYWlsZWQgdG8gY29uc3RydWN0IENvbGxhcHNlOiBlbGVtZW50IG11c3QgYmUgSFRNTEVsZW1lbnQnKTtcblxuXHR2YXIgdHJpZ2dlclNlbGVjdG9yID1cblx0XHQnW2RhdGEtdG9nZ2xlPVwiby1oZS1jb2xsYXBzZVwiXVtocmVmPVwiIycgKyBlbGVtZW50LmlkICsgJ1wiXSwnICtcblx0XHQnW2RhdGEtdG9nZ2xlPVwiby1oZS1jb2xsYXBzZVwiXVtkYXRhLXRhcmdldD1cIiMnICsgZWxlbWVudC5pZCArICdcIl0nO1xuXG5cdHRoaXMudGFyZ2V0ID0gZWxlbWVudDtcblx0dGhpcy50cmlnZ2VyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0cmlnZ2VyU2VsZWN0b3IpO1xuXHRDb2xsYXBzZS5jYWNoZS5zZXQoZWxlbWVudCwgdGhpcyk7XG5cblx0aWYgKCFlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnby1oZS1jb2xsYXBzZScpKSBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ28taGUtY29sbGFwc2UnKTtcblxuXHRpZiAoIUNvbGxhcHNlLmJvZHlEZWxlZ2F0ZSkge1xuXHRcdHZhciBib2R5RGVsZWdhdGUgPSBuZXcgRG9tRGVsZWdhdGUoZG9jdW1lbnQuYm9keSk7XG5cblx0XHRib2R5RGVsZWdhdGUub24oJ2NsaWNrJywgJ1tkYXRhLXRvZ2dsZT1cIm8taGUtY29sbGFwc2VcIl0nLCBmdW5jdGlvbiBoYW5kbGVDbGljayhlKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHZhciB0YXJnZXQgPSBnZXRUYXJnZXRGcm9tVHJpZ2dlcihlLnRhcmdldCk7XG5cblx0XHRcdGZvckVhY2godGFyZ2V0LCBmdW5jdGlvbiAoaW5kZXgsIHRhcmdldCkge1xuXHRcdFx0XHR2YXIgY29sbGFwc2libGUgPSBDb2xsYXBzZS5jYWNoZS5nZXQodGFyZ2V0KTtcblxuXHRcdFx0XHRpZiAoIWNvbGxhcHNpYmxlICYmIHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtby1jb21wb25lbnQnKSA9PT0gJ28taGUtY29sbGFwc2UnKSB7XG5cdFx0XHRcdFx0Y29sbGFwc2libGUgPSBuZXcgQ29sbGFwc2UodGFyZ2V0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjb2xsYXBzaWJsZSkgY29sbGFwc2libGUudG9nZ2xlKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdENvbGxhcHNlLmJvZHlEZWxlZ2F0ZSA9IGJvZHlEZWxlZ2F0ZTtcblx0fVxufVxuXG5Db2xsYXBzZS5jYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYWxsIGNvbGxhcHNpYmxlIGVsZW1lbnRzIG9uIHRoZSBwYWdlIG9yIHdpdGhpblxuICogdGhlIGVsZW1lbnQgcGFzc2VkIGluLlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR8c3RyaW5nfSBlbGVtZW50IERPTSBlbGVtZW50IG9yIHNlbGVjdG9yLlxuICogQHJldHVybiB7Q29sbGFwc2VbXX0gTGlzdCBvZiBDb2xsYXBzZSBpbnN0YW5jZXMgdGhhdFxuICogaGF2ZSBiZWVuIGluaXRpYWxpemVkLlxuICovXG5Db2xsYXBzZS5pbml0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0dmFyIGNvbGxhcHNlRWxzID0gc2VsZWN0QWxsKGVsZW1lbnQpO1xuXHR2YXIgY29sbGFwc2libGVzID0gW107XG5cblx0Zm9yICh2YXIgaSA9IDAsIGwgPSBjb2xsYXBzZUVscy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRjb2xsYXBzaWJsZXMucHVzaChuZXcgQ29sbGFwc2UoY29sbGFwc2VFbHNbaV0pKTtcblx0fVxuXG5cdHJldHVybiBjb2xsYXBzaWJsZXM7XG59O1xuXG4vKipcbiAqIERlc3Ryb3lzIGFsbCBjb2xsYXBzaWJsZSBlbGVtZW50cyBvbiB0aGUgcGFnZS5cbiAqL1xuQ29sbGFwc2UuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcblx0aWYgKENvbGxhcHNlLmJvZHlEZWxlZ2F0ZSkgQ29sbGFwc2UuYm9keURlbGVnYXRlLmRlc3Ryb3koKTtcbn07XG5cbi8qKlxuICogRXhwYW5kcyB0aGUgY29sbGFwc2libGUgZWxlbWVudCBpZiBpdCBpcyBub3QgYWxyZWFkeSBleHBhbmRlZC5cbiAqL1xuQ29sbGFwc2UucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblx0dmFyIHRyaWdnZXIgPSB0aGlzLnRyaWdnZXI7XG5cblx0aWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ28taGUtY29sbGFwc2UtLWV4cGFuZGVkJykpIHJldHVybjtcblxuXHR0YXJnZXQuY2xhc3NMaXN0LmFkZCgnby1oZS1jb2xsYXBzZS0tZXhwYW5kZWQnKTtcblx0dGFyZ2V0LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIHRydWUpO1xuXG5cdGZvckVhY2godHJpZ2dlciwgZnVuY3Rpb24gKGluZGV4LCB0cmlnZ2VyKSB7XG5cdFx0dHJpZ2dlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKTtcblx0fSk7XG59O1xuXG4vKipcbiAqIENvbGxhcHNlcyB0aGUgY29sbGFwc2libGUgZWxlbWVudCBpZiBpdCBpcyBub3QgYWxyZWFkeSBjb2xsYXBzZWQuXG4gKi9cbkNvbGxhcHNlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cdHZhciB0cmlnZ2VyID0gdGhpcy50cmlnZ2VyO1xuXG5cdGlmICghdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnby1oZS1jb2xsYXBzZS0tZXhwYW5kZWQnKSkgcmV0dXJuO1xuXG5cdHRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdvLWhlLWNvbGxhcHNlLS1leHBhbmRlZCcpO1xuXHR0YXJnZXQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuXG5cdGZvckVhY2godHJpZ2dlciwgZnVuY3Rpb24gKGluZGV4LCB0cmlnZ2VyKSB7XG5cdFx0dHJpZ2dlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBUb2dnbGVzIHRoZSBjb2xsYXBzaWJsZSBlbGVtZW50IGJhc2VkIG9uIGl0cyBjdXJyZW50IHN0YXRlLlxuICovXG5Db2xsYXBzZS5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuXHR0aGlzW3RoaXMudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnby1oZS1jb2xsYXBzZS0tZXhwYW5kZWQnKSA/ICdoaWRlJyA6ICdzaG93J10oKTtcbn07XG5cbmZ1bmN0aW9uIHNlbGVjdEFsbChlbGVtZW50KSB7XG5cdGlmICghZWxlbWVudCkge1xuXHRcdGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXHR9IGVsc2UgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuXHRcdGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpO1xuXHR9XG5cblx0cmV0dXJuIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtby1jb21wb25lbnQ9XCJvLWhlLWNvbGxhcHNlXCJdJyk7XG59XG5cbmZ1bmN0aW9uIGdldFRhcmdldEZyb21UcmlnZ2VyKGVsZW1lbnQpIHtcblx0dmFyIHRhcmdldCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRhcmdldCcpIHx8IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cdHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRhcmdldCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFwc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuZm9yRWFjaCA9IGZ1bmN0aW9uIChhcnJheSwgY2FsbGJhY2spIHtcblx0Zm9yICh2YXIgaSA9IDAsIGwgPSBhcnJheS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIGksIGFycmF5W2ldKTtcblx0fVxufTtcbiJdfQ==
