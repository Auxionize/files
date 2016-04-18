/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
const Bluebird = require('bluebird');
const co = require('co');
const router = new require('express').Router();
const _ = require('lodash');

// module definition ==================================================
module.exports = function(BigFile, BigFileLink) {
	const LinkType = BigFileLink.LinkTypes;
	//const routerHelper = require('./utils/routerHelper')(BigFile, BigFileLink, LinkType);
	const upload = routerHelper.upload;

	router.post('/bigdata/login', function(req, res) {
		req.login({id: 1, fullName: 'Iordan Georgiev'}, function(err) {
			console.log("@err", err);
		});

		res.status(200)
			.set('Content-Type', 'application/json')
			.send({name: 'Iordan'});
	});

	router.post('/bigdata/test', function(req, res) {
		console.log("@req", req.body, req.user);

		res.status(200)
			.set('Content-Type', 'application/json')
			.send({hello: 'world'});
	});


	router.post('/bigdata/upload', function(req, res, next) {
		const date = new Date();

		co(function* () {
			console.log('Uploading to bucket');
			const skipperFile = Bluebird.promisifyAll(req.file('file'));

			const bigFiles = yield upload(skipperFile, date,
				[{
					type: LinkType.USER_BUCKET,
					referredBy: 1// hardcoded for testing req.user.id
				}]);

			let fields = ['uuid', 'id', 'name', 'mimeType', 'size', 'date'];
			let response = bigFiles.map(file => _.pick(file.toJSON(), fields));

			res.status(200)
				.set('Content-Type', 'application/json')
				.send(response);
		}).catch(next);
	});

	router.get('/bigdata/:uuid', function (req, res, next) {
		co(function* () {
			const uuid = req.params.uuid;
			console.log('download attachment with uuid %s', uuid);

			//if(!authUser(req,res)) return;
			const bigfile = yield BigFile.findByUUID(uuid);
			if (bigfile == null) {
				res.status(404).end();
			}
			else {
				try {
					bigfile.serveContents(res);
				}
				catch(e) {
					console.info("@e", e);
					res
						.status(404)
						.set('Content-type', 'text/html; charset=UTF-8')
						.removeHeader('Content-disposition');

					res.end();
				}
			}

		}).catch(next);
	});

	return router;
};
