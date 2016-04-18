/**
 * Created by yordan on 4/6/16.
 */
'use strict';

const _ = require('lodash');
const log  = require('../utils/exceptions');
const co = require('co');
const Bluebird = require('bluebird');
const FileStorage = require('../utils/FileStorage');
const GB = Math.pow(1024, 3);
const USER_QUOTA = 5*GB;
const MAX_FILE_SIZE = 2*GB;

module.exports = function(sequelize, BigFileLink, filePath) {
	let LinkType = BigFileLink.LinkTypes;
	let fileStorage = new FileStorage(filePath);
	let DataTypes = sequelize.Sequelize;
	let BigFile = sequelize.define('BigFile', {
		name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		uuid: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			unique: true,
			allowNull: false
		},
		mimeType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		size: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		date: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		classMethods: {
				isLoggedIn: function(req) {
					return req && req.user && req.user.id > 0;
				},

				isAdmin: function(req) {
					// TODO
				},

				getQuota: function*(referredBy, type) {
					let usedQuota = 0;
					const userFiles = yield BigFile.findAll({
						include: [{
							association: BigFile.associations.Links,
							where: {type, referredBy},
							attributes: ['type', 'referredBy']
						}],
						attributes: ['size']
					});

					for(let file of userFiles) usedQuota += file.size;

					return usedQuota;
				},

				hasQuota: function*(req, type) {
					let usedQuota = yield this.getQuota(req.user.id, type);
					console.log('USED SPACE BY USER ', req.user.id, ' IS ', usedQuota);

					return usedQuota <= USER_QUOTA;
				},

				upload: function*(req, res, linkType) {
					if(!BigFile.isLoggedIn(req)) {
						res.setTimeout(500, function() {
							res.status(403).end('Authenticated users only');
						});

						return;
					}

					let hasQuota = yield this.hasQuota(req, LinkType.USER_BUCKET);

					if(!hasQuota) {
						res.setTimeout(500, function() {
							res.status(403).end('User disk quota exceeded');
						});

						return;
					}

					let date = new Date();
					let skipperFile = Bluebird.promisifyAll(req.file('file'));
					let fields = ['uuid', 'id', 'name', 'mimeType', 'size', 'date'];
					let links = [{
						type: linkType,
						referredBy: req.user.id
					}];

					let newFile = {};

					yield skipperFile.uploadAsync({
						saveAs: function (__newFileStream, cb) {
							BigFile.create({links},
								{
									include: [{
										model: BigFileLink,
										as: 'Links'
									}]
								})
								.then(function (bigfile) {
									console.log("@then");
									bigfile.name = __newFileStream.filename;
									bigfile.mimeType = __newFileStream.headers['content-type'];
									bigfile.size = __newFileStream.byteCount;
									bigfile.date = date;

									co(bigfile.save());
									newFile = bigfile;
									co(bigfile.linkWith(bigfile.uuid, linkType, req.user.id));

									return co(bigfile.getStorePath.bind(bigfile));
								})
								.then(function (path) {
									cb(null, path);
								}, cb);
						},

						maxBytes: MAX_FILE_SIZE
					});

					// TODO listen for close/interrupted request in order to remove unnecessary files


					let response = _.pick(newFile.toJSON(), fields);

					res.status(200)
						.set('Content-Type', 'application/json')
						.send(response);

				},

				list: function*(req, res, linkType) {
					let isAdminList = _.isUndefined(linkType);

					if(!this.isLoggedIn(req) && !isAdminList) {
						res.status(403).end('Authenticated users only');
					}
					else {
						let attributes = ['uuid', 'id', 'name', 'mimeType', 'size'];
						let innerAttributes = ['referredBy', 'type'];
						let includeObject = {
							model: BigFileLink,
							as: 'Links',
							attributes: innerAttributes,
							order: ['id', 'ASC']
						};

						if(!isAdminList) {
							includeObject.where = {
								type: linkType,
								referredBy: req.user.id
							};
						}

						let list = yield BigFile.findAll({attributes, include: [includeObject]});

						res.status(200).json(list).end();
					}
				},

				serveFileWithUUID: function*(req, res) {
					if(!this.isLoggedIn(req)) {
						console.log("@not logged in");
						res.status(403).end('Authenticated users only');
					}
					else {
						console.log("@logged in");
						let file = yield this.findByUUID(req.params.uuid);

						if (file === null) {
							res.status(404).end();
						}
						else {
							file.serveContents(res);
						}
					}

				},

				associate: function (BigFileLink) {
					BigFile.Links = BigFile.hasMany(BigFileLink, {
						as: 'Links'
					});
				},

				findByUUID: function(uuid) {
					return BigFile.findOne({where: {uuid}});
				},

				unlink: function*(req, res, linkType) {
					if(!this.isLoggedIn(req)) {
						res.status(403).end('Authenticated users only');
					}
					else {
						let link = yield BigFileLink.findOne({
							where: {
								type: linkType,
								referredBy: req.user.id
							},
							include: [{
								model: BigFile,
								where: {uuid: req.params.uuid}
							}]
						});

						if(link === null) {
							res.status(404).end('No such file present');
						}
						else {
							yield link.destroy();

							res.status(200).send('successfully deleted').end();
						}

					}
				},

				link: function (uuid, type, referredBy) {
					const BigFileLink = sequelize.models.BigFileLink;
					return co(function* () {
						const file = yield BigFile.findByUUID(uuid);
						return yield BigFileLink.create({
							BigFileId: file.id,
							type,
							referredBy
						});
					});
				}
			},
		instanceMethods: {
				linkWith: function*(uuid, type, referredBy) {
					let link = yield BigFileLink.create({
						type,
						referredBy,
						BigFileId: this.id
					});

					return link;
				},

				getContents: function () {
					return fileStorage.createReadStream(this);
				},

				serveContents: function (res) {
					try {
						let utf8name = encodeURIComponent(this.name);
						res
							.status(200)
							.set('Content-Type', this.mimeType)
							.set('Content-disposition', `attachment; filename*=UTF-8''${utf8name}`);
						fileStorage.createReadStream(this).pipe(res);
					}
					catch(e) {
						res
							.status(404)
							.set('Content-type', 'text/html; charset=UTF-8')
							.removeHeader('Content-disposition');

						res.end();
					}
				},
				deleteContents: function () {
					fileStorage.deleteContents(this);
				},

				getStorePath: function* () {
					yield fileStorage.prepareDirectory(this);
					return fileStorage.getPath(this);
				}
			},
		hooks: {
				afterDestroy: function (file) {
					console.log('Deleting: ', file.id);
					return co(function* () {
						yield fileStorage.deleteContents(file);
					});
				}
			}
	});

	return BigFile;
};