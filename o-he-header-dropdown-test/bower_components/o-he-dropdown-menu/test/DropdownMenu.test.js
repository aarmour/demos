/*global describe, it*/
'use strict';

var expect = require('expect.js');

var DropdownMenu = require('./../src/js/DropdownMenu');
var dispatchEvent = require('./../src/js/utils').dispatchEvent;
var initKeyboardEvent = require('./init-keyboard-event');

describe('DropdownMenu', function () {

	it('should initialize', function () {
		expect(new DropdownMenu(createDropdownMenuEl())).to.not.be(undefined);
	});

	it('should destroy', function () {
		var element = createDropdownMenuEl();
		var dropdownMenu = new DropdownMenu(element);

		dropdownMenu.destroy();
	});

	it('should collapse the menu when click event occurs outside of the dropdown element', function () {
		var element = createDropdownMenuEl();

		document.body.appendChild(element);

		var menu = new DropdownMenu(element);

		menu.toggle();

		expect(isExpanded(element)).to.be(true);

		dispatchEvent(document.body, 'click');

		expect(isExpanded(element)).to.be(false);
	});

	describe('toggle()', function () {

		it('should toggle the dropdown', function () {
			var element = createDropdownMenuEl();
			var dropdownMenu = new DropdownMenu(element);

			dropdownMenu.toggle();

			expect(isExpanded(element)).to.be(true);
			expect(isAriaExpanded(element)).to.be(true);
		});

		it('should not toggle the dropdown when trigger is a button and is disabled', function () {
			var element = createDropdownMenuEl();
			var toggleElement = element.querySelector('[data-toggle="dropdown-menu"]');

			toggleElement.disabled = true;
			var dropdownMenu = new DropdownMenu(element);

			dropdownMenu.toggle();

			expect(isExpanded(element)).to.be(false);
		});

		it('should not toggle the dropdown when trigger is not a button and is disabled', function () {
			var element = createDropdownMenuEl(document.createElement('a'));
			var toggleElement = element.querySelector('[data-toggle="dropdown-menu"]');

			toggleElement.classList.add('o-he-dropdown-menu__toggle--disabled');
			var dropdownMenu = new DropdownMenu(element);

			dropdownMenu.toggle();

			expect(isExpanded(element)).to.be(false);
		});

		it('should collapse other expanded menus', function () {
			var elements = [createDropdownMenuEl(), createDropdownMenuEl()];

			document.body.appendChild(elements[0]);
			document.body.appendChild(elements[1]);

			var menus = [new DropdownMenu(elements[0]), new DropdownMenu(elements[1])];

			menus[0].toggle();

			expect(isExpanded(elements[0])).to.be(true);

			menus[1].toggle();

			expect(isExpanded(elements[1])).to.be(true);
			expect(isExpanded(elements[0])).to.be(false);
		});

	});

	describe('keyboard navigation', function () {

		function testKeyCode_expands(keyCode) {
			var element = createDropdownMenuEl();

			document.body.appendChild(element);

			var menu = new DropdownMenu(element);
			var event = initKeyboardEvent('keydown', { keyCode: keyCode, bubbles: true, cancelable: true });

			menu.toggleElement.dispatchEvent(event);

			expect(isExpanded(element)).to.be(true);
		}

		it('should expand when the space key is pressed', function () {
			testKeyCode_expands(32);
		});

		it('should expand when the down arrow key is pressed', function () {
			testKeyCode_expands(40);
		});

		it('should expand when the up arrow key is pressed', function () {
			testKeyCode_expands(38);
		});

		it('should collapse when the esc key is pressed', function () {
			var element = createDropdownMenuEl();

			document.body.appendChild(element);

			var menu = new DropdownMenu(element);
			var event = initKeyboardEvent('keydown', { keyCode: 27, bubbles: true, cancelable: true });

			menu.toggle();
			expect(isExpanded(element)).to.be(true);

			menu.toggleElement.dispatchEvent(event);

			expect(isExpanded(element)).to.be(false);
		});

	});

});

function createDropdownMenuEl(triggerEl) {
	var element = document.createElement('div');
	element.classList.add('o-he-dropdown-menu');
	element.setAttribute('data-o-component', 'o-he-dropdown-menu');

	triggerEl = triggerEl || document.createElement('button');
	triggerEl.setAttribute('data-toggle', 'dropdown-menu');
	element.appendChild(triggerEl);

	var menuItemsEl = document.createElement('ul');
	element.appendChild(menuItemsEl);

	return element;
}

function isExpanded(element) {
	return element.classList.contains('o-he-dropdown-menu--expanded');
}

function isAriaExpanded(element) {
	var toggleElement = element.querySelector('[data-toggle="dropdown-menu"]');
	if (!toggleElement) return false;
	return !!toggleElement.getAttribute('aria-expanded');
}
