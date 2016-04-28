/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// Module dependencies ================================================
const _ = require('lodash');
const co = require('co');
const Bluebird = require('bluebird');
const FileStorage = require('../utils/FileStorage');

// Helper =============================================================
Number.prototype.toKB = function() {
	return this.valueOf() * Math.pow(1024, 3);
};

// Module definition ==================================================
module.exports = function(sequelize, BigFileLink, config) {

	// Locals =========================================================
	const LINK_TYPE = config.LINK_TYPE;
	const fileStorage = new FileStorage(config.FILE_PATH);
	const tempFileStorage = new FileStorage(config.TEMP_FILE_PATH);
	const DataTypes = sequelize.Sequelize;

	// Model fields ===================================================
	let modelFields = {
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
	};

	// Model class methods ============================================
	let classMethods = {
		getUser: function(req) {
			return req && req.user && req.user.id > 0
				? {id: req.user.id, isAdmin: req.user.type === 'ADMIN'}
				: false;

		},

		getQuota: function*(referredBy, type) {
			let usedQuota = 0;
			let userFiles = yield this.findAll({
				include: [{
					association: this.associations.Links,
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

			return usedQuota <= config.USER_QUOTA.toKB();

		},

		upload: function*(req, res, linkType) {
			let self = this;
			let currentUser = this.getUser(req);

			if(currentUser === false) {
				res.setTimeout(500, function() {
					res.status(403).end('Authenticated users only');
				});

				return;
			}

			if(linkType === LINK_TYPE.USER_BUCKET) {
				let hasQuota = yield this.hasQuota(req, LINK_TYPE.USER_BUCKET);

				if(!hasQuota) {
					res.setTimeout(500, function() {
						res.status(403).end('User disk quota exceeded');
					});

					return;

				}
			}

			let skipperFile = Bluebird.promisifyAll(req.file('file'));

			yield skipperFile.uploadAsync({saveAs: function (__newFileStream, cb) {
				co(function*() {
					let tempPath = yield tempFileStorage.generateTempFile(currentUser.id);

					cb(null, tempPath);

					__newFileStream.on('end', function() {
						co(function*() {
							let fields = ['uuid', 'id', 'name', 'mimeType', 'size', 'date'];
							let file = self.build({
								name: __newFileStream.filename,
								mimeType: __newFileStream.headers['content-type'],
								size: __newFileStream.byteCount,
								date: new Date()
							});

							yield file.save();

							let newPath = yield file.getStorePath();
							// TODO link with referral id
							let link = yield file.linkWith(linkType, req.params.id || currentUser.id);

							fileStorage.finalizeUpload(tempPath, newPath, function() {
								let response = _.extend({}, _.pick(file.toJSON(), fields), {linkId: link.id});

								res.json(response);
							});


						});
					});
				});
			},
				maxBytes: config.MAX_FILE_SIZE.toKB()
			});

		},

		list: function*(req, res, linkType) {
			let currentUser = this.getUser(req);

			if(currentUser === false) {
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

				if(!currentUser.isAdmin) {
					includeObject.where = {referredBy: req.user.id};

					if(!_.isUndefined(linkType)) {
						includeObject.where.type = linkType;
					}
				}

				let list = yield this.findAll({attributes, include: [includeObject]});

				res.json(list).end();
			}
		},

		serveFileWithUUID: function*(req, res) {
			if(this.getUser(req) === false) {
				res.status(403).end('Authenticated users only');
			}
			else {
				let file = yield this.findByUUID(req.params.uuid);

				if (file === null) {
					res.status(404).end();
				}
				else {
					file.serveContents(res);
				}
			}

		},

		associateInternal: function (BigFileLink) {
			this.Links = this.hasMany(BigFileLink, {as: 'Links'});
		},

		findByUUID: function(uuid) {
			return this.findOne({where: {uuid}});
		},

		link: function (uuid, type, referredBy) {
			return co(function* () {
				const file = yield this.findByUUID(uuid);

				return yield BigFileLink.create({
					BigFileId: file.id,
					type,
					referredBy
				});
			});
		},

		unlink: function*(req, res) {
			if(this.getUser(req) === false) {
				res.status(403).end('Authenticated users only');
			}
			else {
				let link = yield BigFileLink.findById(req.params.id);

				if(link === null) {
					res.status(404).end('No such linked file present');
				}
				else {
					yield link.destroy();

					res.status(200).send('File link deleted with success').end();
				}

			}
		}
	};

	// Model instance methods =========================================
	let instanceMethods = {
		linkWith: function*(type, referredBy) {
			return yield BigFileLink.create({
				type,
				referredBy,
				BigFileId: this.id
			});

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
	};

	// Model definition ===============================================
	let BigFile = sequelize.define('BigFile',
		modelFields, {
		classMethods,
		instanceMethods,
		hooks: {
			afterDestroy: function (file) {
				return co(function* () {
					yield fileStorage.deleteContents(file);

				});

			}
		}
	});

	return BigFile;

};