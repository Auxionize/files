/**
 * Created by yordan on 4/6/16.
 */
'use strict';

const Bluebird = require('bluebird');
const co = require('co');
const router = new require('express').Router();

module.exports = router;

// routes definitions
router.post('/bigdata/upload', function(req, res, next) {
	co(function*() {
		let skipperFile = Bluebird.promisifyAll(req.file('file'));
		let addedFiles = [];
		let uploadFiles = yield skipperFile.uploadAsync({
			saveAs: function (__newFileStream, cb) {
				db.BigFile.create({
						Links: [{
							type: LinkType.USER_BUCKET,
							referredBy: req.user.id
						}]
					}, {
						include: [{
							model: db.BigFileLink,
							as: 'Links'
						}]
					})
					.then(function (bigfile) {
						addedFiles.push(bigfile);
						return co(bigfile.getStorePath.bind(bigfile));
					})
					.then(function (path) {
						cb(null, path);
					}, cb);
			},
			maxBytes: 2 * Math.pow(1024, 3)
		});


	})
	.catch(next);
});