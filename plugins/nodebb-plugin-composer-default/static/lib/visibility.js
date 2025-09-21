'use strict';

/* Client-side hook for instructor visibility */
require(['hooks', 'api'], function (hooks, api) {

	// 1️⃣ Populate dropdown when composer is enhanced
	hooks.on('action:composer.enhanced', async function ({ postContainer }) {
		// Prevent double-initialization
		const $sel = postContainer.find('[component="composer/visibility"]');
		if (!$sel.length || $sel.data('inited')) return;
		$sel.data('inited', 1);

		// Clean up labels
		const labels = {
			everyone: 'Everyone',
			all_instructors: 'All Instructors',
		};
		$sel.find('option').each(function () {
			if (labels[this.value]) this.textContent = labels[this.value];
		});

		// Fetch instructors from group API
		try {
			const { users = [] } = await api.get('/groups/instructors/members');
			if (users.length) {
				const $group = $('<optgroup label="Instructors"></optgroup>');
				users.forEach(u => {
					$group.append($('<option>', { value: u.uid, text: u.username }));
				});
				$sel.append($group);
			}
		} catch (err) {
			console.warn('[visibility] failed to fetch instructors', err);
		}
	});

	// 2️⃣ On post submit, attach selected visibility
	hooks.on('action:composer.submit', function (payload) {
		const uuid = payload.composerData?.uuid;
		if (!uuid) return;

		const $root = $('.composer[data-uuid="' + uuid + '"]');
		const val = $root.find('[component="composer/visibility"]').val();

		if (!val || val === 'everyone') return; // public post, no need to store

		// Send selected instructor UID to server
		payload.composerData.visibility = val;

		// Also add hidden input to form so NodeBB sees it in request body
		let input = $root.closest('form').find('input[name="visibility"]');
		if (!input.length) {
			input = $('<input type="hidden" name="visibility" />');
			$root.closest('form').append(input);
		}
		input.val(val);
	});

});
