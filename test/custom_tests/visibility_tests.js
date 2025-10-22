'use strict';

const assert = require('assert');

function canViewPost(postVisibilityKey, userRole, userUID) {
	// 1. Check for specific UID enforcement (e.g., 'user:2000')
	if (postVisibilityKey.startsWith('user:')) {
		const targetUID = postVisibilityKey.split(':')[1];
		return userUID === targetUID;
	}

	// 2. Check for Role-based enforcement
	if (postVisibilityKey === 'all_instructors') {
		return userRole === 'instructor';
	}

	// 3. Check for general visibility
	if (postVisibilityKey === 'everyone') {
		return true;
	}

	return false;
}

// --- SIMULATED USER DATA ---
const INSTRUCTOR_UID = '1000';
const STUDENT_UID = '2000';
const POST_KEY_EVERYONE = 'everyone';
const POST_KEY_INSTRUCTOR = 'all_instructors';
const POST_KEY_RESTRICTED_TO_STUDENT = `user:${STUDENT_UID}`;
const POST_KEY_RESTRICTED_TO_INSTRUCTOR = `user:${INSTRUCTOR_UID}`;

// --- UNIT TEST SUITE (Mocha Structure) ---
describe('Unit Test: Post Visibility Enforcement Logic', () => {
	describe('UID Enforcement (user:<uid>)', () => {
		it('1.1 Target user (Student) can view post restricted to their UID', function () {
			const canView = canViewPost(
				POST_KEY_RESTRICTED_TO_STUDENT,
				'student',
				STUDENT_UID,
			);
			assert.strictEqual(
				canView,
				true,
				'Student should be granted access to post restricted to their UID.',
			);
		});

		it('1.2 Non-target user (Instructor) is denied access to post restricted to Student', function () {
			const canView = canViewPost(
				POST_KEY_RESTRICTED_TO_STUDENT,
				'instructor',
				INSTRUCTOR_UID,
			);
			assert.strictEqual(
				canView,
				false,
				'Instructor should be denied access to student-restricted post.',
			);
		});

		it('1.3 Non-target user (Student) is denied access to post restricted to Instructor', function () {
			const canView = canViewPost(
				POST_KEY_RESTRICTED_TO_INSTRUCTOR,
				'student',
				STUDENT_UID,
			);
			assert.strictEqual(
				canView,
				false,
				'Student should be denied access to instructor-restricted post.',
			);
		});
	});

	describe('Role-Based Enforcement (all_instructors)', () => {
		it('2.1 Instructor can view post set to "all_instructors"', function () {
			const canView = canViewPost(
				POST_KEY_INSTRUCTOR,
				'instructor',
				INSTRUCTOR_UID,
			);
			assert.strictEqual(
				canView,
				true,
				'Instructor should be able to view instructor-only post.',
			);
		});

		it('2.2 Student is denied access to post set to "all_instructors"', function () {
			const canView = canViewPost(POST_KEY_INSTRUCTOR, 'student', STUDENT_UID);
			assert.strictEqual(
				canView,
				false,
				'Student should be denied view of instructor-only post.',
			);
		});
	});

	describe('General Visibility (everyone)', () => {
		it('3.1 Both Instructor and Student can view post set to "everyone"', function () {
			const instructorView = canViewPost(
				POST_KEY_EVERYONE,
				'instructor',
				INSTRUCTOR_UID,
			);
			const studentView = canViewPost(
				POST_KEY_EVERYONE,
				'student',
				STUDENT_UID,
			);

			assert.strictEqual(
				instructorView,
				true,
				'Instructor should view "everyone" post.',
			);
			assert.strictEqual(
				studentView,
				true,
				'Student should view "everyone" post.',
			);
		});
	});
});
