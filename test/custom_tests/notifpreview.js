'use strict';

const assert = require('assert');

// --- SIMULATED SNIPPET GENERATION FUNCTION ---
// This function mimics the server-side logic responsible for creating a concise
// notification preview snippet from the full post content.
function generateNotificationSnippet(rawContent) {
	// 1. Strip HTML tags (simulate server-side sanitization)
	const strippedContent = rawContent.replace(/<[^>]*>/g, '').trim();

	// 2. Split into words based on whitespace
	const words = strippedContent.split(/\s+/).filter((word) => word.length > 0);

	const MAX_WORDS = 4;
	let snippet = words.slice(0, MAX_WORDS).join(' ');

	// 3. Add ellipsis if the original content had more than MAX_WORDS
	if (words.length > MAX_WORDS) {
		snippet += '...';
	} else if (words.length > 0) {
		// Ensure the full stop or punctuation is retained if it was a short message
		snippet = strippedContent;
	}

	return snippet;
}

// --- UNIT TEST SUITE (Mocha Structure) ---
describe('Unit Test: Notification Snippet Generation Logic', () => {
	const USERNAME = '@testuser';

	it('1. Long content (>4 words) is truncated and includes ellipsis', function () {
		const longContent = `${USERNAME} this post is definitely longer than four words.`;
		const expectedSnippet = `${USERNAME} this post is...`;

		const result = generateNotificationSnippet(longContent);
		assert.strictEqual(
			result,
			expectedSnippet,
			'Should truncate to 4 words and add "..."',
		);
	});

	it('2. Content with exactly 4 words is used fully without ellipsis', function () {
		// FIX: Reduced to exactly 4 words to match test description and expected output.
		const shortContent = `${USERNAME} short content test.`;
		const expectedSnippet = shortContent;

		const result = generateNotificationSnippet(shortContent);
		assert.strictEqual(
			result,
			expectedSnippet,
			'Should use all 4 words with no "..."',
		);
	});

	it('3. HTML tags are stripped before truncation and ellipsis is added', function () {
		// Raw content contains HTML tags (<b>, <a>)
		const htmlContent = `<b>${USERNAME}</b> <a href="link">important</a> message check here. This is five words.`;
		// Plain text is: "@testuser important message check here. This is five words."
		// Expected snippet: "@testuser important message check..." (first 4 words)
		const expectedSnippet = `${USERNAME} important message check...`;

		const result = generateNotificationSnippet(htmlContent);
		assert.strictEqual(
			result,
			expectedSnippet,
			'Should strip HTML and then truncate with "..."',
		);
	});

	it('4. Content with less than 4 words is used fully without ellipsis', function () {
		const veryShortContent = `Hey ${USERNAME}!`;
		const expectedSnippet = veryShortContent;

		const result = generateNotificationSnippet(veryShortContent);
		assert.strictEqual(
			result,
			expectedSnippet,
			'Should keep content intact if under 4 words',
		);
	});

	it('5. Empty content returns an empty string', function () {
		const result = generateNotificationSnippet('');
		assert.strictEqual(
			result,
			'',
			'Should return empty string for empty input',
		);
	});
});
