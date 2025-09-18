'use strict';

/*
	This file is located in the "modules" block of plugin.json
	It is only loaded when the user navigates to /admin/plugins/web-push page
	It is not bundled into the min file that is served on the first load of the page.
*/

import { save, load } from 'settings';

export function init() {
	handleSettingsForm();
};

function handleSettingsForm() {
	load('web-push', $('.web-push-settings'));

	$('#save').on('click', () => {
		save('web-push', $('.web-push-settings')); // pass in a function in the 3rd parameter to override the default success/failure handler
	});
}
