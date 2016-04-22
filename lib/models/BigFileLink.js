/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// Module dependencies ================================================
const co = require('co');

// Module definition ==================================================
module.exports = function(sequelize, config) {

	// Locals =========================================================
	let LINK_TYPE = config.LINK_TYPE;
	const DataTypes = sequelize.Sequelize;

	// Model fields ===================================================
	let modelFields = {
		type : {
			type: DataTypes.ENUM({values: Object.keys(LINK_TYPE)}),
			allowNull: false
		},
		referredBy: {
			type: DataTypes.INTEGER
		},
		note :{
			type:DataTypes.TEXT
		}
	};

	// Model class methods ============================================
	let classMethods = {
		associate: function (BigFile) {
			this.File = BigFile;
			this.belongsTo(BigFile);

		},

		addType: function*(newType) {
			yield sequelize.query(
				'ALTER TYPE public."enum_BigFileLinks_type" ADD VALUE IF NOT EXISTS \'' + newType + '\';'
			);
		},
		// TODO remove after core refactor is made!
		getAuctionAttachments: function*(auctionId){
			return yield this.getAttachments(auctionId, LINK_TYPE.AUCTION_ATTACHMENT);

		},

		getCommentAttachments: function*(auctionId){
			return yield this.getAttachments(auctionId, LINK_TYPE.COMM_ATTACHMENT);

		},

		getAttachments: function*(referredBy, type){
			return yield this.findAll({
				where: {type, referredBy},
				include: [{association: this.associations.BigFile}]
			});

		},

		getAuctionContract: function*(auctionId){
			return yield this.getAttachments(auctionId, LINK_TYPE.AUCTION_CONTRACT);

		}
	};

	// Model definition ===============================================
	let BigFileLink = sequelize.define('BigFileLink',
		modelFields, {
		classMethods,
		hooks: {
			afterDestroy: function (link) {
				return co(function* () {
					const bigfile = yield BigFileLink.File.findById(link.BigFileId, {
						include: [{
							model: BigFileLink,
							as: 'Links'
						}]
					});

					if (bigfile != null && bigfile.Links.length === 0) {
						yield bigfile.destroy();
					}
				});
			}
		}
	});

	// todo remove ASAP
	BigFileLink.LinkTypes = LINK_TYPE;

	return BigFileLink;

};