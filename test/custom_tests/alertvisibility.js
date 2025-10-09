'use strict';

const assert = require('assert');

// --- SIMULATED ALERT MESSAGE GENERATION FUNCTION ---
// This function mimics the server or frontend logic that constructs the post-submission
// success message based on the chosen visibility key and the target username (if private).
function generateAlertMessage(visibilityKey, targetUsername) {
	switch (visibilityKey) {
		case 'everyone':
			return 'Posted publicly to everyone';
		case 'all_instructors':
			return 'Posted only to all instructors';
		default:
			// Handle private user posts (e.g., 'user:1001')
			if (visibilityKey.startsWith('user:')) {
				// For a unit test, we assume the username has been looked up.
				const username = targetUsername || 'the target user';
				return `Posted privately to only ${username}`;
			}
			// Fallback for an unknown key (assuming the base alert title is removed)
			return 'Post submitted successfully!';
	}
}

// --- UNIT TEST SUITE (Mocha Structure) ---
describe('Unit Test: Post Submission Alert Message Generation', () => {
	const TARGET_USER = 'TestStudent';
	const TARGET_UID_KEY = 'user:12345';

	it('1. Generates correct message for "everyone" (public) visibility', function () {
		const key = 'everyone';
		const expected = 'Posted publicly to everyone';
		const result = generateAlertMessage(key);
		assert.strictEqual(result, expected, `Expected message for "${key}" failed.`);
	});

	it('2. Generates correct message for "all_instructors" (restricted) visibility', function () {
		const key = 'all_instructors';
		const expected = 'Posted only to all instructors';
		const result = generateAlertMessage(key);
		assert.strictEqual(result, expected, `Expected message for "${key}" failed.`);
	});

	it('3. Generates correct message for private "user:<uid>" visibility, including username', function () {
		const key = TARGET_UID_KEY;
		const expected = `Posted privately to only ${TARGET_USER}`;
		// Pass the resolved username, mimicking the server having done the lookup
		const result = generateAlertMessage(key, TARGET_USER);
		assert.strictEqual(result, expected, `Expected message for private post failed.`);
	});

	it('4. Handles private "user:<uid>" visibility gracefully if username lookup fails', function () {
		const key = TARGET_UID_KEY;
		const expected = 'Posted privately to only the target user';
		// Pass undefined for username
		const result = generateAlertMessage(key, undefined);
		assert.strictEqual(result, expected, `Expected fallback message failed.`);
	});

	it('5. Returns default message for unknown visibility keys', function () {
		const key = 'unknown_key';
		const expected = 'Post submitted successfully!';
		const result = generateAlertMessage(key);
		assert.strictEqual(result, expected, `Expected fallback message for unknown key failed.`);
	});
});
