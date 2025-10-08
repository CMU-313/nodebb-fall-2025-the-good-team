'use strict';

const url = require('url');

const nconf = require.main.require('nconf');
const validator = require('validator');

const plugins = require.main.require('./src/plugins');
const topics = require.main.require('./src/topics');
const categories = require.main.require('./src/categories');
const posts = require.main.require('./src/posts');
const user = require.main.require('./src/user');
const meta = require.main.require('./src/meta');
const privileges = require.main.require('./src/privileges');
const translator = require.main.require('./src/translator');
const utils = require.main.require('./src/utils');
const helpers = require.main.require('./src/controllers/helpers');
const SocketPlugins = require.main.require('./src/socket.io/plugins');
const socketMethods = require('./websockets');
// Added db 
const db = require.main.require('./src/database');

const plugin = module.exports;

plugin.socketMethods = socketMethods;

plugin.init = async function (data) {
	const { router } = data;
	const routeHelpers = require.main.require('./src/routes/helpers');
	const controllers = require('./controllers');
	SocketPlugins.composer = socketMethods;
	// Add endorsement API route
	router.put('/posts/:pid/endorse', async (req, res) => {
		try {
			if (!req.uid) {
				return res.status(401).json({ error: 'Not authenticated' });
			}
            
			const result = await plugin.toggleEndorsement(req.params.pid, req.uid);
			res.json(result);
		} catch (err) {
			console.error('Endorsement error:', err);
			res.status(500).json({ error: err.message });
		}
	});
	// Add endorsement API route



	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/composer-default', controllers.renderAdminPage);
};

plugin.appendConfig = async function (config) {
	config['composer-default'] = await meta.settings.get('composer-default');
	return config;
};

plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/composer-default',
		icon: 'fa-edit',
		name: 'Composer (Default)',
	});
	return header;
};

plugin.addPrefetchTags = async function (hookData) {
	const prefetch = [
		'/assets/src/modules/composer.js', '/assets/src/modules/composer/uploads.js', '/assets/src/modules/composer/drafts.js',
		'/assets/src/modules/composer/tags.js', '/assets/src/modules/composer/categoryList.js', '/assets/src/modules/composer/resize.js',
		'/assets/src/modules/composer/autocomplete.js', '/assets/templates/composer.tpl',
		`/assets/language/${meta.config.defaultLang || 'en-GB'}/topic.json`,
		`/assets/language/${meta.config.defaultLang || 'en-GB'}/modules.json`,
		`/assets/language/${meta.config.defaultLang || 'en-GB'}/tags.json`,
	];

	hookData.links = hookData.links.concat(prefetch.map(path => ({
		rel: 'prefetch',
		href: `${nconf.get('relative_path') + path}?${meta.config['cache-buster']}`,
	})));

	return hookData;
};
// Add endorsement data to posts
plugin.addEndorsementData = async function (hookData) {
	const { posts: postsData, uid } = hookData;
    
	if (!postsData) {
		return hookData;}
    
	const isInstructor = await plugin.isUserInstructor(uid);
    
	if (Array.isArray(postsData)) {
		await Promise.all(postsData.map(async (post) => {
			if (post && post.pid) {
				post.isEndorsed = await plugin.isPostEndorsed(post.pid);
				post.viewerIsInstructor = isInstructor;
			}
		}));
	} else if (postsData && postsData.pid) {
		postsData.isEndorsed = await plugin.isPostEndorsed(postsData.pid);
		postsData.viewerIsInstructor = isInstructor;
	}
    
	return hookData;
};

// Check if user is instructor (moderator or admin)
plugin.isUserInstructor = async function (uid) {
	if (!uid || parseInt(uid, 10) <= 0) {
		return false;
	}
    
	try {
		const [isAdmin, isGlobalMod] = await Promise.all([
			user.isAdministrator(uid),
			user.isGlobalModerator(uid),
		]);
		return isAdmin || isGlobalMod;
	} catch (err) {
		console.error('Error checking instructor status:', err);
		return false;
	}
};

// Check if post is endorsed
plugin.isPostEndorsed = async function (pid) {
	if (!pid) {
		return false;
	}
    
	try {
		const endorsed = await db.getObjectField(`post:${pid}`, 'endorsed');
		return endorsed === '1';
	} catch (err) {
		console.error('Error checking endorsement status:', err);
		return false;
	}
};


// Toggle post endorsement
plugin.toggleEndorsement = async function (pid, uid) {
	if (!pid || !uid) {
		throw new Error('Invalid post ID or user ID');
	}
    
	const isInstructor = await plugin.isUserInstructor(uid);
	if (!isInstructor) {
		throw new Error('Only instructors can endorse posts');
	}
    
	const currentlyEndorsed = await plugin.isPostEndorsed(pid);
	const newEndorsedState = !currentlyEndorsed;
    
	await db.setObjectField(`post:${pid}`, 'endorsed', newEndorsedState ? '1' : '0');
    
	// Emit real-time update
	const socketio = require.main.require('./src/socket.io');
	const postData = await posts.getPostData(pid);
	if (postData && postData.tid) {
		socketio.in(`topic_${postData.tid}`).emit('event:post_endorsed', {
			pid: parseInt(pid, 10),
			endorsed: newEndorsedState,
		});
	}
    
	return {
		pid: parseInt(pid, 10),
		endorsed: newEndorsedState,
	};
};



plugin.getFormattingOptions = async function () {
	const defaultVisibility = {
		mobile: true,
		desktop: true,

		// op or reply
		main: true,
		reply: true,
	};
	let payload = {
		defaultVisibility,
		options: [
			{
				name: 'tags',
				title: '[[global:tags.tags]]',
				className: 'fa fa-tags',
				visibility: {
					...defaultVisibility,
					desktop: false,
				},
			},
			{
				name: 'zen',
				title: '[[modules:composer.zen-mode]]',
				className: 'fa fa-arrows-alt',
				visibility: defaultVisibility,
			},
		],
	};
	if (parseInt(meta.config.allowTopicsThumbnail, 10) === 1) {
		payload.options.push({
			name: 'thumbs',
			title: '[[topic:composer.thumb-title]]',
			className: 'fa fa-address-card-o',
			badge: true,
			visibility: {
				...defaultVisibility,
				reply: false,
			},
		});
	}

	payload = await plugins.hooks.fire('filter:composer.formatting', payload);

	payload.options.forEach((option) => {
		option.visibility = {
			...defaultVisibility,
			...option.visibility || {},
		};
	});

	return payload ? payload.options : null;
};

plugin.filterComposerBuild = async function (hookData) {
	const { req } = hookData;
	const { res } = hookData;

	if (req.query.p) {
		try {
			const a = url.parse(req.query.p, true, true);
			return helpers.redirect(res, `/${(a.path || '').replace(/^\/*/, '')}`);
		} catch (e) {
			return helpers.redirect(res, '/');
		}
	} else if (!req.query.pid && !req.query.tid && !req.query.cid) {
		return helpers.redirect(res, '/');
	}

	await checkPrivileges(req, res);

	const [
		isMainPost,
		postData,
		topicData,
		categoryData,
		isAdmin,
		isMod,
		formatting,
		tagWhitelist,
		globalPrivileges,
		canTagTopics,
		canScheduleTopics,
	] = await Promise.all([
		posts.isMain(req.query.pid),
		getPostData(req),
		getTopicData(req),
		categories.getCategoryFields(req.query.cid, [
			'name', 'icon', 'color', 'bgColor', 'backgroundImage', 'imageClass', 'minTags', 'maxTags',
		]),
		user.isAdministrator(req.uid),
		isModerator(req),
		plugin.getFormattingOptions(),
		getTagWhitelist(req.query, req.uid),
		privileges.global.get(req.uid),
		canTag(req),
		canSchedule(req),
	]);

	const isEditing = !!req.query.pid;
	const isGuestPost = postData && parseInt(postData.uid, 10) === 0;
	const save_id = utils.generateSaveId(req.uid);
	const discardRoute = generateDiscardRoute(req, topicData);
	const body = await generateBody(req, postData);

	let action = 'topics.post';
	let isMain = isMainPost;
	if (req.query.tid) {
		action = 'posts.reply';
	} else if (req.query.pid) {
		action = 'posts.edit';
	} else {
		isMain = true;
	}
	globalPrivileges['topics:tag'] = canTagTopics;
	const cid = parseInt(req.query.cid, 10);
	const topicTitle = topicData && topicData.title ? topicData.title.replace(/%/g, '&#37;').replace(/,/g, '&#44;') : validator.escape(String(req.query.title || ''));
	return {
		req: req,
		res: res,
		templateData: {
			disabled: !req.query.pid && !req.query.tid && !req.query.cid,
			pid: parseInt(req.query.pid, 10),
			tid: parseInt(req.query.tid, 10),
			cid: cid || (topicData ? topicData.cid : null),
			action: action,
			toPid: parseInt(req.query.toPid, 10),
			discardRoute: discardRoute,

			resizable: false,
			allowTopicsThumbnail: parseInt(meta.config.allowTopicsThumbnail, 10) === 1 && isMain,

			// can't use title property as that is used for page title
			topicTitle: topicTitle,
			titleLength: topicTitle ? topicTitle.length : 0,
			topic: topicData,
			thumb: topicData ? topicData.thumb : '',
			body: body,

			isMain: isMain,
			isTopicOrMain: !!req.query.cid || isMain,
			maximumTitleLength: meta.config.maximumTitleLength,
			maximumPostLength: meta.config.maximumPostLength,
			minimumTagLength: meta.config.minimumTagLength || 3,
			maximumTagLength: meta.config.maximumTagLength || 15,
			tagWhitelist: tagWhitelist,
			selectedCategory: cid ? categoryData : null,
			minTags: categoryData.minTags,
			maxTags: categoryData.maxTags,

			isTopic: !!req.query.cid,
			isEditing: isEditing,
			canSchedule: canScheduleTopics,
			showHandleInput: meta.config.allowGuestHandles === 1 &&
				(req.uid === 0 || (isEditing && isGuestPost && (isAdmin || isMod))),
			handle: postData ? postData.handle || '' : undefined,
			formatting: formatting,
			isAdminOrMod: isAdmin || isMod,
			save_id: save_id,
			privileges: globalPrivileges,
			'composer:showHelpTab': meta.config['composer:showHelpTab'] === 1,
		},
	};
};

async function checkPrivileges(req, res) {
	const notAllowed = (
		(req.query.cid && !await privileges.categories.can('topics:create', req.query.cid, req.uid)) ||
		(req.query.tid && !await privileges.topics.can('topics:reply', req.query.tid, req.uid)) ||
		(req.query.pid && !await privileges.posts.can('posts:edit', req.query.pid, req.uid))
	);

	if (notAllowed) {
		await helpers.notAllowed(req, res);
	}
}

function generateDiscardRoute(req, topicData) {
	if (req.query.cid) {
		return `${nconf.get('relative_path')}/category/${validator.escape(String(req.query.cid))}`;
	} else if ((req.query.tid || req.query.pid)) {
		if (topicData) {
			return `${nconf.get('relative_path')}/topic/${topicData.slug}`;
		}
		return `${nconf.get('relative_path')}/`;
	}
}

async function generateBody(req, postData) {
	let body = '';
	// Quoted reply
	if (req.query.toPid && parseInt(req.query.quoted, 10) === 1 && postData) {
		const username = await user.getUserField(postData.uid, 'username');
		const translated = await translator.translate(`[[modules:composer.user-said, ${username}]]`);
		body = `${translated}\n` +
			`> ${postData ? `${postData.content.replace(/\n/g, '\n> ')}\n\n` : ''}`;
	} else if (req.query.body || req.query.content) {
		body = validator.escape(String(req.query.body || req.query.content));
	}
	body = postData ? postData.content : '';
	return translator.escape(body);
}

async function getPostData(req) {
	if (!req.query.pid && !req.query.toPid) {
		return null;
	}

	return await posts.getPostData(req.query.pid || req.query.toPid);
}

async function getTopicData(req) {
	if (req.query.tid) {
		return await topics.getTopicData(req.query.tid);
	} else if (req.query.pid) {
		return await topics.getTopicDataByPid(req.query.pid);
	}
	return null;
}

async function isModerator(req) {
	if (!req.loggedIn) {
		return false;
	}
	const cid = cidFromQuery(req.query);
	return await user.isModerator(req.uid, cid);
}

async function canTag(req) {
	if (parseInt(req.query.cid, 10)) {
		return await privileges.categories.can('topics:tag', req.query.cid, req.uid);
	}
	return true;
}

async function canSchedule(req) {
	if (parseInt(req.query.cid, 10)) {
		return await privileges.categories.can('topics:schedule', req.query.cid, req.uid);
	}
	return false;
}

async function getTagWhitelist(query, uid) {
	const cid = await cidFromQuery(query);
	const [tagWhitelist, isAdminOrMod] = await Promise.all([
		categories.getTagWhitelist([cid]),
		privileges.categories.isAdminOrMod(cid, uid),
	]);
	return categories.filterTagWhitelist(tagWhitelist[0], isAdminOrMod);
}

async function cidFromQuery(query) {
	if (query.cid) {
		return query.cid;
	} else if (query.tid) {
		return await topics.getTopicField(query.tid, 'cid');
	} else if (query.pid) {
		return await posts.getCidByPid(query.pid);
	}
	return null;
}

// Register socket handlers for endorsement feature
SocketPlugins.endorsement = {};
    
SocketPlugins.endorsement.checkTopic = async function (socket, data) {
    if (!data || !data.tid) {
        throw new Error('[[error:invalid-data]]');
    }
        
    try {
        // Get post IDs for the topic
        const pids = await db.getSortedSetRange('tid:' + data.tid + ':posts', 0, -1);
            
        if (!pids || pids.length === 0) {
            return {
                tid: data.tid,
                hasEndorsement: false
            };
        }
            
        // Get posts data
        const postsData = await posts.getPostsData(pids);
        const hasEndorsement = postsData && postsData.some(post => post && post.upvotes > 0);
            
        return {
            tid: data.tid,
            hasEndorsement: hasEndorsement
        };
    } catch (err) {
        console.error('Error checking topic endorsement:', err);
        return {
            tid: data.tid,
            hasEndorsement: false
        };
    }
};

plugin.addEndorsementTags = async function (hookData) {
    const { posts } = hookData;
    
    if (!posts || !Array.isArray(posts)) {
        return hookData;
    }

    // Add endorsement flag to posts with upvotes > 0
    posts.forEach(post => {
        if (post && typeof post.upvotes === 'number' && post.upvotes > 0) {
            post.hasEndorsement = true;
            post.endorsementLevel = getEndorsementLevel(post.upvotes);
        } else {
            post.hasEndorsement = false;
        }
    });

    return hookData;
};

function getEndorsementLevel(upvotes) {
    if (upvotes >= 10) {
        return 'high';
    } else if (upvotes >= 5) {
        return 'medium';
    } else if (upvotes > 0) {
        return 'low';
    }
    return 'none';
}

// Add other existing plugin methods here...

plugin.onPostUpvote = async function (hookData) {
    const { post, uid } = hookData;
    
    if (!post || !post.pid) {
        return;
    }
    
    try {
        // Get updated post data with vote counts
        const postData = await posts.getPostData(post.pid);
        
        // Emit real-time update for endorsement status
        const socketio = require.main.require('./src/socket.io');
        if (postData && postData.tid) {
            const hasEndorsement = postData.upvotes > 0;
            const endorsementLevel = hasEndorsement ? getEndorsementLevel(postData.upvotes) : 'none';
            
            socketio.in(`topic_${postData.tid}`).emit('event:endorsement_updated', {
                pid: parseInt(post.pid, 10),
                hasEndorsement: hasEndorsement,
                endorsementLevel: endorsementLevel,
                upvotes: postData.upvotes
            });
        }
    } catch (err) {
        console.error('Error handling post upvote for endorsement:', err);
    }
};

plugin.onPostUnvote = async function (hookData) {
    const { post, uid } = hookData;
    
    if (!post || !post.pid) {
        return;
    }
    
    try {
        // Get updated post data with vote counts
        const postData = await posts.getPostData(post.pid);
        
        // Emit real-time update for endorsement status
        const socketio = require.main.require('./src/socket.io');
        if (postData && postData.tid) {
            const hasEndorsement = postData.upvotes > 0;
            const endorsementLevel = hasEndorsement ? getEndorsementLevel(postData.upvotes) : 'none';
            
            socketio.in(`topic_${postData.tid}`).emit('event:endorsement_updated', {
                pid: parseInt(post.pid, 10),
                hasEndorsement: hasEndorsement,
                endorsementLevel: endorsementLevel,
                upvotes: postData.upvotes
            });
        }
    } catch (err) {
        console.error('Error handling post unvote for endorsement:', err);
    }
};
