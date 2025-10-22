'use strict';

/* Client-side hook for populating visibility dropdown */
require(['hooks', 'api'], function (hooks, api) {
	hooks.on('action:composer.enhanced', async function ({ postContainer }) {
		const $sel = postContainer.find('[component="composer/visibility"]');
		if (!$sel.length || $sel.data('inited')) return;
		$sel.data('inited', 1);

		// Label cleanup
		const labels = {
			everyone: 'Everyone',
			all_instructors: 'All Instructors',
			specific_instructors: 'Specific Instructors…',
		};
		$sel.find('option').each(function () {
			if (labels[this.value]) this.textContent = labels[this.value];
		});

		try {
			const { users = [] } = await api.get('/groups/instructors/members');
			if (users.length) {
				const $group = $('<optgroup label="Instructors"></optgroup>');
				users.forEach((u) => {
					$group.append(
						$('<option>', { value: `user:${u.uid}`, text: u.username }),
					);
				});
				$sel.append($group);
			}
		} catch (err) {
			console.warn('[visibility] failed to fetch instructors', err);
		}
	});

	// Add selected value to composerData

	hooks.on('action:composer.submit', function (payload) {
		const uuid = payload.composerData?.uuid;
		if (!uuid) return;
		const $root = $('.composer[data-uuid="' + uuid + '"]');
		const val = $root.find('[component="composer/visibility"]').val();

		// Check if the visibility value is valid before setting it
		if (val) {
			payload.composerData.visibility = val;
		} else {
			// Log an error if the value is missing
			console.error('Visibility value is missing from the composer payload.');
			// You might also want to prevent the submission here if a value is required.
		}
	});

	hooks.on('action:composer.submit', function (payload) {
		const uuid = payload.composerData?.uuid;
		if (!uuid) return;
		const $root = $('.composer[data-uuid="' + uuid + '"]');
		const val = $root.find('[component="composer/visibility"]').val();
		if (val) payload.composerData.visibility = val;
	});
});
