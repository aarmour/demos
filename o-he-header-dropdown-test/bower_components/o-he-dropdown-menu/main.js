/*global require, module*/
'use strict';

var DropdownMenu = require('./src/js/DropdownMenu');

var constructAll = function () {
	DropdownMenu.init();
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};

document.addEventListener('o.DOMContentLoaded', constructAll);

module.exports = DropdownMenu;
