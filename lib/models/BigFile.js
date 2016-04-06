/**
 * Created by yordan on 4/6/16.
 */
'use strict';

module.exports = function(sequelize, filePath) {
	let co = require('co');
	let FileStorage = require('../utils/FileStorage');
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
				associate: function (BigFileLink) {
					BigFile.Links = BigFile.hasMany(BigFileLink, {
						as: 'Links'
					});
				},

				findByUUID: function (uuid) {
					return BigFile.findOne({where: {uuid}});
				},

				unlink: function (uuid, type, referredBy) {
					const Link = sequelize.models.BigFileLink;
					return co(function* () {
						const link = yield Link.findOne({
							where: {
								type,
								referredBy
							},
							include: [{
								model: BigFile,
								where: {
									uuid
								}
							}]
						});

						if (link == null) {
							return;
						}
						yield link.destroy();
						return link;
					});
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
				getContents: function () {
					return fileStorage.createReadStream(this);
				},
				serveContents: function (httpRes) {
					let utf8name = encodeURIComponent(this.name);
					httpRes
						.status(200)
						.set('Content-Type', this.mimeType)
						.set('Content-disposition', `attachment; filename*=UTF-8''${utf8name}`);
					fileStorage.createReadStream(this).pipe(httpRes);
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
				afterDestroy: function (file, options) {
					console.log('Deleting: ', file.id);
					return co(function* () {
						yield fileStorage.deleteContents(file);
					});
				}
			}
	});

	return BigFile;
};