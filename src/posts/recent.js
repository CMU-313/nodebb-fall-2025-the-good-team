'use strict';

const _ = require('lodash');

const db = require('../database');
const privileges = require('../privileges');
const groups = require('../groups');

module.exports = function (Posts) {
	const terms = {
		day: 86400000,
		week: 604800000,
		month: 2592000000,
	};

	Posts.getRecentPosts = async function (uid, start, stop, term) {
		let min = 0;
		if (terms[term]) {
			min = Date.now() - terms[term];
		}

		const count = parseInt(stop, 10) === -1 ? stop : stop - start + 1;
		const pids = await db.getSortedSetRevRangeByScore('posts:pid', start, count, '+inf', min);

		// grab post data 
		const postData = await Posts.getPostsFields(pids, ['uid', 'visibility']);

		// is current user an instructor? 
		const isInstructor = await groups.isMember(uid, 'instructors');
		// Filter the post IDs based on the visibility rules
		const filteredPids = postData
			.filter((post) => { 
				// Check for valid post and visibility data
				if (!post || !post.visibility) {
					return false;
				}

				console.log('Checking post ID:', post.pid, 'Visibility:', post.visibility, 'Is current user an instructor?', isInstructor); 

				// A user can see a post if...
				// 1. It's visible to everyone
				if (post.visibility === 'everyone') {
					return true;
				}

				// 2. It's specifically for them
				if (post.visibility === `user:${uid}`) {
					return true;
				}

				// allow post owner to see their own post
				if (post.uid && String(post.uid) === String(uid)) {
					return true;
				}

				// 3. It's for all instructors and the current user is an instructor
				if (post.visibility === 'all_instructors' && isInstructor) {
					return true;
				}

				// Otherwise, the post is not visible
				return false;
			})
			.map(post => post.pid);

		// priveleges check
		const finalPids = await privileges.posts.filter('topics:read', filteredPids, uid);

		return await Posts.getPostSummaryByPids(finalPids, uid, { stripTags: true });
	};

	Posts.getRecentPosterUids = async function (start, stop) {
		const pids = await db.getSortedSetRevRange('posts:pid', start, stop);
		const postData = await Posts.getPostsFields(pids, ['uid']);
		return _.uniq(postData.map(p => p && p.uid).filter(uid => parseInt(uid, 10)));
	};
};
