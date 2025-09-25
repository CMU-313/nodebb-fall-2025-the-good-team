'use strict';
console.log('compose.js module loaded'); 

define('forum/compose', ['hooks'], function (hooks) {
	console.log('inside compose.js define function'); 
	const Compose = {};

	Compose.init = function () {
		const container = $('.composer');
		console.log('inside compose init function');

		if (container.length) {
			hooks.fire('action:composer.enhance', {
				container: container,
			});

			// Inject visibility dropdown for students
			if (window.currentUser && window.currentUser.role === 'student') {
				const imageUploadSection = container.find('.composer-footer .formatting-bar, .composer .formatting-bar').first();
				if (imageUploadSection.length) {
					const dropdownContainer = $('<div id="post-visibility-dropdown" style="margin-top:10px;"></div>');
					imageUploadSection.after(dropdownContainer);

					const instructors = window.instructorsList || [
						{ id: '1', firstName: 'Alice', lastName: 'Smith' },
						{ id: '2', firstName: 'Bob', lastName: 'Jones' },
					];
					const specialOptions = [
						{ id: 'everyone', label: 'Everyone' },
						{ id: 'all', label: 'All Instructors' },
					];

					let selected = ['everyone'];

					function getDisplayText() {
						if (selected.includes('everyone')) return 'Everyone';
						if (selected.includes('all')) return 'All Instructors';
						return instructors
							.filter(i => selected.includes(i.id))
							.map(i => `${i.firstName} ${i.lastName}`)
							.join(', ') || 'Select instructor(s)...';
					}

					function handleSelect(id) {
						if (id === 'everyone' || id === 'all') {
							selected = [id];
						} else {
							selected = selected.filter(s => s !== 'everyone' && s !== 'all');
							if (selected.includes(id)) {
								selected = selected.filter(s => s !== id);
							} else {
								selected.push(id);
							}
						}
						render();
					}

					function render() {
						dropdownContainer.html(`
							<div class="dropdown-multiselect" style="width:300px;">
								<div class="dropdown-btn" style="padding:10px; border:1px solid #aaa; border-radius:4px; background:#f5f5f5; cursor:pointer;">${getDisplayText()}</div>
								<div class="dropdown-content" style="display:none; position:absolute; background:#fff; border:1px solid #aaa; border-radius:4px; width:100%; z-index:10; max-height:200px; overflow-y:auto; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
									${specialOptions.map(opt => `
										<div class="dropdown-item${selected.includes(opt.id) ? ' selected' : ''}" data-id="${opt.id}" style="padding:8px 12px; cursor:pointer; display:flex; align-items:center;">
											<input type="checkbox" class="dropdown-checkbox" ${selected.includes(opt.id) ? 'checked' : ''} style="margin-right:8px;" />
											${opt.label}
										</div>
									`).join('')}
									${instructors.map(inst => `
										<div class="dropdown-item${selected.includes(inst.id) ? ' selected' : ''}" data-id="${inst.id}" style="padding:8px 12px; cursor:pointer; display:flex; align-items:center;">
											<input type="checkbox" class="dropdown-checkbox" ${selected.includes(inst.id) ? 'checked' : ''} style="margin-right:8px;" />
											${inst.firstName} ${inst.lastName}
										</div>
									`).join('')}
								</div>
							</div>
						`);

						const btn = dropdownContainer.find('.dropdown-btn');
						const content = dropdownContainer.find('.dropdown-content');
						btn.off('click').on('click', function () {
							content.toggle();
						});

						dropdownContainer.find('.dropdown-item').off('click').on('click', function (e) {
							e.stopPropagation();
							const id = $(this).data('id');
							handleSelect(id);
						});
					}

					render();

					// On composer submit, add selected visibility to post data
					container.closest('form').on('submit', function () {
						let input = $(this).find('input[name="visibility"]');
						if (!input.length) {
							input = $('<input type="hidden" name="visibility" />');
							$(this).append(input);
						}
						input.val(JSON.stringify(selected));
					});
				}
			}
		}
	};

	return Compose;
});
