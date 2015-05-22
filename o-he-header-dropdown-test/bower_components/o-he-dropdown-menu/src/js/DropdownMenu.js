'use strict';

var DomDelegate = require('dom-delegate');
var dispatchEvent = require('./utils').dispatchEvent;

function DropdownMenu(element) {
	if (!(this instanceof DropdownMenu)) throw new TypeError('Constructor DropdownMenu requires \'new\'');
	if (!element) throw new TypeError('missing required argument: element');

	var dropdownMenu = this;
	this.element = element;

	var toggleElement = this.toggleElement = element.querySelector('[data-toggle="dropdown-menu"]');
	if (!toggleElement) throw new Error('unable to locate a child element with selector: [data-toggle="dropdown-menu"]');

	function handleClick(e) {
		e.preventDefault();
		dropdownMenu.toggle();
	}

	function handleKeydown(e) {
		// Handle up arrow, down arrow, escape, and space keys for elements that
		// are not inputs and textareas
		if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;

		e.preventDefault();
		e.stopPropagation();

		var element = getRootElement(e.target);
		var toggleElement = element.querySelector('[data-toggle="dropdown-menu"]');

		var isExpanded = element.classList.contains('o-he-dropdown-menu--expanded');

		// Toggle the menu: if not expanded, keys other than esc will expand it;
		// if expanded, esc will collapse it.
		if ((!isExpanded && e.which !== 27) || (isExpanded && e.which === 27)) {
			if (e.which === 27) dispatchEvent(toggleElement, 'focus');
			return dispatchEvent(toggleElement, 'click');
		}

		// Focus menu item
		var itemEls = element.querySelectorAll('.o-he-dropdown-menu__menu-item:not(.o-he-dropdown-menu__menu-item--disabled) a');

		if (!itemEls.length) return;

		var index = indexOfElement(itemEls, e.target);

		if (e.which === 38 && index > 0) index--;
		if (e.which === 40 && index < itemEls.length - 1) index++;
		if (!~index) index = 0;

		itemEls[index].focus();
	}

	if (!DropdownMenu.bodyDelegate) {
		var bodyDelegate = new DomDelegate(document.body);

		bodyDelegate.on('click', function (e) {
			if (!e.defaultPrevented) collapseAll();
		});

		DropdownMenu.bodyDelegate = bodyDelegate;
	}

	var elementDelegate = new DomDelegate(element);

	elementDelegate.on('keydown', '[data-toggle="dropdown-menu"]', handleKeydown);
	elementDelegate.on('keydown', '[role="menu"]', handleKeydown);
	elementDelegate.on('click', handleClick);

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

	var isDisabled =
		toggleElement.classList.contains('o-he-dropdown-menu__toggle--disabled') ||
		toggleElement.disabled;

	var isExpanded = element.classList.contains('o-he-dropdown-menu--expanded');

	collapseAll();

	if (isDisabled) return;

	if (!isExpanded) {
		element.classList.add('o-he-dropdown-menu--expanded');
		toggleElement.setAttribute('aria-expanded', 'true');
	}

	return this;
};

function getRootElement(element) {
	while (element !== null) {
		if (element.getAttribute('data-o-component') === 'o-he-dropdown-menu') return element;
		element = element.parentElement;
	}
}

function indexOfElement(elements, element) {
	for (var i = 0, l = elements.length; i < l; i++) {
		if (elements[i] === element) return i;
	}

	return -1;
}

function selectAll(element) {
	if (!element) {
		element = document.body;
	} else if (!(element instanceof HTMLElement)) {
		element = document.querySelectorAll('[data-o-component="o-he-dropdown-menu"]');
	}

	return element.querySelectorAll('[data-o-component="o-he-dropdown-menu"]');
}

function collapseAll() {
	var dropdownMenuEls = selectAll();

	for (var i = 0, l = dropdownMenuEls.length; i < l; i++) {
		var element = dropdownMenuEls[i];
		var toggleElement = element.querySelector('[data-toggle="dropdown-menu"]');

		if (!element.classList.contains('o-he-dropdown-menu--expanded')) continue;

		element.classList.remove('o-he-dropdown-menu--expanded');
		toggleElement.removeAttribute('aria-expanded');
	}
}

module.exports = DropdownMenu;
