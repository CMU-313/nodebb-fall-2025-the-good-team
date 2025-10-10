'use strict';

const assert = require('assert');
const { JSDOM } = require('jsdom');

describe('UI Test: Visibility Button Integration (socket + UI)', function () {
	let window, document, $, socketEmitMock, alertsAlertMock, alertsErrorMock, emitCallArgs;

	beforeEach(() => {
		// Setup jsdom + jQuery
		const dom = new JSDOM(`
			<div id="post-container">
				<a href="#"
					class="toggle-visibility"
					data-pid="123"
					data-is-everyone="true">
					Make Private
				</a>
			</div>
		`);
		window = dom.window;
		document = dom.window.document;
		$ = require('jquery')(window);

		// Manual mocks for socket and alerts
		socketEmitMock = (...args) => {
			emitCallArgs = args;
		};

		alertsAlertMock = (arg) => {
			alertsAlertMock.called = true;
			alertsAlertMock.lastCall = arg;
		};
		alertsErrorMock = (arg) => {
			alertsErrorMock.called = true;
			alertsErrorMock.lastCall = arg;
		};

		global.socket = { emit: socketEmitMock };
		global.alerts = { alert: alertsAlertMock, error: alertsErrorMock };

		// Inline handler logic
		$('#post-container').on('click', '.toggle-visibility', function (e) {
			e.preventDefault();
			const btn = $(this);
			if (btn.hasClass('disabled')) return false;

			const pid = btn.attr('data-pid');
			socket.emit('posts.toggleVisibility', { pid: pid }, function (err, result) {
				if (err) return alerts.error(err);
				if (result && result.visibility) {
					const isEveryone = result.visibility === 'everyone';
					btn.attr('data-is-everyone', isEveryone);
					btn.text(isEveryone ? 'Make Private' : 'Make Public');
				}
				const message =
					result.visibility === 'everyone'
						? 'Post is now visible to everyone'
						: 'Post is now only visible to instructors';
				alerts.alert({
					type: 'success',
					timeout: 5000,
					title: 'Post visibility updated!',
					message,
				});
			});
			return false;
		});
	});

	it('1. Emits socket event when button clicked', function () {
		const btn = $('.toggle-visibility');
		btn.trigger('click');

		assert.ok(emitCallArgs, 'Socket emit should be called');
		const [eventName, payload] = emitCallArgs;
		assert.strictEqual(eventName, 'posts.toggleVisibility');
		assert.deepStrictEqual(payload, { pid: '123' });
	});

	it('2. Updates button text and calls alerts', function () {
		const btn = $('.toggle-visibility');
		btn.trigger('click');

		// Simulate socket callback manually
		const cb = emitCallArgs[2];
		cb(null, { visibility: 'all_instructors' });

		assert.strictEqual(btn.text(), 'Make Public', 'Button text should update to "Make Public"');
		assert.strictEqual(btn.attr('data-is-everyone'), 'false');

		assert.ok(alertsAlertMock.called, 'Alert should be called');
		const alertCall = alertsAlertMock.lastCall;
		assert.strictEqual(alertCall.title, 'Post visibility updated!');
		assert.strictEqual(alertCall.message, 'Post is now only visible to instructors');
	});

	it('3. Shows correct message when toggled back to everyone', function () {
		const btn = $('.toggle-visibility');
		btn.trigger('click');

		const cb = emitCallArgs[2];
		cb(null, { visibility: 'everyone' });

		assert.strictEqual(btn.text(), 'Make Private');
		const alertCall = alertsAlertMock.lastCall;
		assert.strictEqual(alertCall.message, 'Post is now visible to everyone');
	});

	it('4. Handles error gracefully', function () {
		const btn = $('.toggle-visibility');
		btn.trigger('click');

		const cb = emitCallArgs[2];
		cb('Permission denied');

		assert.ok(alertsErrorMock.called, 'Should call alerts.error on failure');
		assert.strictEqual(alertsErrorMock.lastCall, 'Permission denied');
	});
});
