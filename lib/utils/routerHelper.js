/**
 * Created by yordan on 4/14/16.
 */
'use strict';

// module dependencies ================================================
const co = require('co');
const GB = Math.pow(1024, 3);
const USER_QUOTA = 5*GB;
const MAX_FILE_SIZE = 2*GB;

// module definition ==================================================
module.exports = function(BigFile, BigFileLink, LinkType) {
	let getQuota = function*(userId) {
		let usedQuota = 0;
		const userFiles = yield db.BigFile.findAll( {
			include: [{
				association: db.BigFile.associations.Links,
				where: {
					type: LinkType.USER_BUCKET,
					referredBy: userId
				},
				attributes: ['type', 'referredBy']
			}],
			attributes: ['size']
		});


		for(let file of userFiles) usedQuota += file.size;

		return usedQuota;
	};

	let checkQuota = function*(req, res) {
		let usedQuota = yield getQuota(req.user.id);
		console.log('USED SPACE BY USER ', req.user.id, ' IS ', usedQuota);

		if (usedQuota > USER_QUOTA) {
			res.status(412).end('User disk quota exceeded');
			return false;
		} else {
			return true;
		}
	};

	let authUser = function*(req, res) {
		if (!(req.user) || !(req.user.id) || req.user.id <= 0) {
			res.status(403).end('Authenticated users only');
			return false;
		} else {
			return true;
		}
	};

	//let upload = function*(skipperFile, date, Links) {
	//	const bigFiles = [];
	//	let metaData = yield skipperFile.uploadAsync({
	//		saveAs: function (__newFileStream, cb) {
	//			BigFile.create({Links},
	//				{
	//					include: [{
	//						model: BigFileLink,
	//						as: 'Links'
	//					}]
	//				})
	//				.then(function (bigfile) {
	//					bigFiles.push(bigfile);
	//					return co(bigfile.getStorePath.bind(bigfile));
	//				})
	//				.then(function (path) {
	//						cb(null, path);
	//				}, cb);
	//		},
	//
	//		maxBytes: MAX_FILE_SIZE
	//	});
	//
	//	for (var i = 0; i < metaData.length; i++) {
	//		let bigfile = bigFiles[i];
	//		let currentData = metaData[i];
	//
	//		bigfile.name = currentData.filename;
	//		bigfile.mimeType = currentData.type;
	//		bigfile.size = currentData.size;
	//		bigfile.date = date;
	//
	//		yield bigfile.save();
	//	}
	//
	//	return bigFiles;
	//};


	return {getQuota, checkQuota, authUser, upload};

};