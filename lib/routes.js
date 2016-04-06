/**
 * Created by yordan on 4/6/16.
 */
'use strict';

const Bluebird = require('bluebird');
const co = require('co');
const router = new require('express').Router();
const _ = require('lodash');

module.exports = function(BigFile, BigFileLink) {
	let LinkType = BigFileLink.LinkTypes;

	function* upload(skipperFile, date, Links){
		const bigFiles = [];
		let metaDatas = yield skipperFile.uploadAsync({
			saveAs: function (__newFileStream, cb) {
				BigFile.create({
						Links
					}, {
						include: [{
							model: BigFileLink,
							as: 'Links'
						}]
					})
					.then(function (bigfile) {
						bigFiles.push(bigfile);
						return co(bigfile.getStorePath.bind(bigfile));
					})
					.then(function (path) {
							cb(null, path);
					}, cb);
			},
			maxBytes: 2 * 1024 * 1024 * 1024
		});

		for (var i = 0; i < metaDatas.length; i++) {
			let bigfile = bigFiles[i];
			let metadata = metaDatas[i];
			bigfile.name = metadata.filename;
			bigfile.mimeType = metadata.type;
			bigfile.size = metadata.size;
			bigfile.date = date;
			yield bigfile.save();
		}
		return bigFiles;
	}

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

			let fields = ['uuid', 'id', 'name', 'mimeType', 'size', 'date']
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
				return;
			}
			bigfile.serveContents(res);
		}).catch(next);
	});

	return router;
};
