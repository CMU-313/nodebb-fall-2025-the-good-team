'use strict';

const assert = require('assert');
const benchpress = require('benchpressjs');

// Paste your exact snippet from the topic list template:
const tpl = `
{{{ if ./isInstructorOnly }}}
<span class="badge border border-gray-300 text-body align-middle ms-2" title="Visible to instructors only">
  <i class="fa fa-user-shield"></i> Instructor-only
</span>
{{{ end }}}

{{{ if ./isPrivateToInstructor }}}
<span class="badge border border-gray-300 text-body align-middle ms-2" title="Visible to a specific instructor">
  <i class="fa fa-user"></i> Private to instructor
</span>
{{{ end }}}
`;

async function render(context) {
	const html = await benchpress.compileRender(tpl, context);
	return String(html).trim();
}

describe('Topic visibility badges (template)', function () {
	it('renders Instructor-only badge when isInstructorOnly=true', async function () {
		const html = await render({
			isInstructorOnly: true,
			isPrivateToInstructor: false,
		});
		assert.ok(html.includes('Instructor-only'), 'Instructor-only text missing');
		assert.ok(
			!html.includes('Private to instructor'),
			'Private badge should not render',
		);
	});

	it('renders Private-to-instructor badge when isPrivateToInstructor=true', async function () {
		const html = await render({
			isInstructorOnly: false,
			isPrivateToInstructor: true,
		});
		assert.ok(
			!html.includes('Instructor-only'),
			'Instructor badge should not render',
		);
		assert.ok(
			html.includes('Private to instructor'),
			'Private-to-instructor text missing',
		);
	});

	it('renders nothing when both flags are false (public)', async function () {
		const html = await render({
			isInstructorOnly: false,
			isPrivateToInstructor: false,
		});
		// only whitespace is acceptable
		assert.strictEqual(html, '', 'Expected no badge markup for public posts');
	});
});
