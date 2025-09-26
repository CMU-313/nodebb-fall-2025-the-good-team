'use strict';

const nconf = require('nconf');
const _ = require('lodash');


const categories = require('../categories');
const meta = require('../meta');
const pagination = require('../pagination');
const helpers = require('./helpers');
const privileges = require('../privileges');
const user = require('../user');

const categoriesController = module.exports;

categoriesController.list = async function (req, res) {
	res.locals.metaTags = [{
		name: 'title',
		content: String(meta.config.title || 'NodeBB'),
	}, {
		property: 'og:type',
		content: 'website',
	}];

	const allRootCids = await categories.getAllCidsFromSet('cid:0:children');
	const rootCids = await privileges.categories.filterCids('find', allRootCids, req.uid);
	const pageCount = Math.max(1, Math.ceil(rootCids.length / meta.config.categoriesPerPage));
	const page = Math.min(parseInt(req.query.page, 10) || 1, pageCount);
	const start = Math.max(0, (page - 1) * meta.config.categoriesPerPage);
	const stop = start + meta.config.categoriesPerPage - 1;
	const pageCids = rootCids.slice(start, stop + 1);

	const allChildCids = _.flatten(await Promise.all(pageCids.map(categories.getChildrenCids)));
	const childCids = await privileges.categories.filterCids('find', allChildCids, req.uid);
	const categoryData = await categories.getCategories(pageCids.concat(childCids), req.uid);
	const tree = categories.getTree(categoryData, 0);



	const promises = [
		categories.getRecentTopicReplies(categoryData, req.uid, req.query),
	];
    
	await Promise.all(promises);

	const data = {
		title: meta.config.homePageTitle || '[[pages:home]]',
		selectCategoryLabel: '[[pages:categories]]',
		categories: tree,
		pagination: pagination.create(page, pageCount, req.query),
	};

	data.categories.forEach((category) => {
		if (category) {
			helpers.trimChildren(category);
			helpers.setCategoryTeaser(category);
		}
	});

	if (req.originalUrl.startsWith(`${nconf.get('relative_path')}/api/categories`) || req.originalUrl.startsWith(`${nconf.get('relative_path')}/categories`)) {
		data.title = '[[pages:categories]]';
		data.breadcrumbs = helpers.buildBreadcrumbs([{ text: data.title }]);
		res.locals.metaTags.push({
			property: 'og:title',
			content: '[[pages:categories]]',
		});
	}

	if (res.locals.isAPI) {
		if (data.hasOwnProperty('unread')) {
			delete data.unread;
		}

		const payload = {
			categories: data.categories,
			pagination: data.pagination,
			title: data.title,
			selectCategoryLabel: data.selectCategoryLabel,
			breadcrumbs: data.breadcrumbs,
		};
		
		if (page > 1) {
			const isLastPage = page >= pageCount;
			data.nextStart = isLastPage ? -1 : stop + 1;
		}

		payload.loggedIn = req.loggedIn;
		payload.loggedInUser = req.loggedIn ? await user.getUserData(req.uid) : null;
		payload.relative_path = nconf.get('relative_path');
		payload.template = { name: 'categories' };
		payload.url = nconf.get('url');
		payload.bodyClass = 'page-categories';
		payload._header = { tags: { meta: [], link: [] } };
		payload.widgets = {};

		return res.json(payload);
	}
	await categories.setUnread(tree, pageCids.concat(childCids), req.uid);

	data.config = meta.config;
	data.csrf_token = req.csrfToken ? req.csrfToken() : '';
	res.render('categories', data);
};
