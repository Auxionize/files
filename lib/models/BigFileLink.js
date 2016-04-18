/**
 * Created by yordan on 4/6/16.
 */
'use strict';

let co = require('co');
let processEnumObject = require('../utils/enum').processEnumObject;
let LinkType = {
	USER_BUCKET: '',
	AUCTION_ATTACHMENT: '',
	AUCTION_CONTRACT: '',
	COMM_ATTACHMENT: ''
};

processEnumObject(LinkType);

module.exports = function(sequelize) {
	let DataTypes = sequelize.Sequelize;
	let BigFileLink = sequelize.define('BigFileLink', {
		type : {
			type: DataTypes.ENUM({values: Object.keys(LinkType)}),
			nullAllowed: false
		},
		referredBy: {
			type: DataTypes.INTEGER
		},
		note :{
			type:DataTypes.TEXT
		}
	}, {
		classMethods: {
				associate: function (BigFile) {
					BigFileLink.File = BigFile;
					BigFileLink.belongsTo(BigFile);
				},
				getAuctionAttachments: function*(auctionId){
					return yield this.getAttachments(auctionId, LinkType.AUCTION_ATTACHMENT);
				},

				getCommentAttachments: function*(auctionId){
					return yield this.getAttachments(auctionId, LinkType.COMM_ATTACHMENT);
				},

				getAttachments: function*(auctionId, type){
					return yield this.findAll({
						where: {
							type: type,
							referredBy: auctionId
						},
						include: [
							{association: this.associations.BigFile}
						]
					});
				},

				getAuctionContract: function*(auctionId){
					return yield this.getAttachments(auctionId, LinkType.AUCTION_CONTRACT);
				}

			},
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

	BigFileLink.LinkTypes = LinkType;

	return BigFileLink;
};