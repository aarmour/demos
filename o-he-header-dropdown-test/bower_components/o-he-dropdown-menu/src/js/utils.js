// Helper function to dispatch events
function dispatchEvent(element, name, data) {
	'use strict';
	if (document.createEvent && element.dispatchEvent) {
		var event = document.createEvent('Event');
		event.initEvent(name, true, true);

		if (data) {
			event.detail = data;
		}

		element.dispatchEvent(event);
	}
}

exports.dispatchEvent = dispatchEvent;
