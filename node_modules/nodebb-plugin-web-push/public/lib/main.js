// this file here as placeholder in case needed. Add back to plugin.json to use

'use strict';

(async () => {
	const [hooks] = await app.require(['hooks']);

	hooks.on('action:app.load', async () => {
		// ...
	});
})();
