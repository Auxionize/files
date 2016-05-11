/**
 * Created by yordan on 4/27/16.
 */
'use strict';

// dependencies =======================================================
let _ = require('lodash');
let co = require('co');
let coForeach = require('co-foreach');
let config, BigFile, BigFileLink, Auction, Comment;

module.exports = {
	initWith: function() {
		let args = arguments;

		config = args[0];
		BigFile = args[1];
		BigFileLink = args[2];
		Auction = args[3];
		Comment = args[4];

	},

	getUser: function(req, res) {
		res.jsonp({user: req.user || {}});
	},

	logOut: function(req, res) {
		req.logout();
		res.jsonp({msg: 'Logged out'});
	},

	loginFailure: function(req, res) {
		res.jsonp({user: {}});
	},

	loginSuccess: function(req, res) {
		res.jsonp({user: req.user});
	},

	upload: function(req, res, next) {
		co(function* () {
			yield BigFile.upload(req, res, config.get('LINK_TYPE.USER_BUCKET'));
		}).catch(next);
	},

	list: function(req, res, next) {
		co(function* () {
			yield BigFile.list(req, res);
		}).catch(next);
	},

	getFile: function(req, res, next) {
		co(function* () {
			yield BigFile.serveFileWithUUID(req, res);
		}).catch(next);
	},

	unlinkFile: function(req, res, next) {
		co(function* () {
			yield BigFile.unlink(req, res);
		}).catch(next);
	},

	getDemoData: function(req, res) {
		co(function*() {
			let auctions = yield Auction.findAll();
			let typesData = yield BigFileLink.getTypes();
			let linkTypes = _.isUndefined(typesData[0]) ? [] : typesData[0];

			coForeach(auctions, function*(auction, index) {
				auctions[index].dataValues.contract = yield BigFileLink.getAuctionContract(auction.id);
				auctions[index].dataValues.attachments = yield BigFileLink.getAuctionAttachments(auction.id);
			})
			.then(function() {
				res.jsonp({auctions, linkTypes});
			});

		});

	},

	uploadContract: function(req, res, next) {
		co(function* () {
			yield BigFile.upload(req, res, config.get('LINK_TYPE.AUCTION_CONTRACT'));
		}).catch(next);
	},

	uploadAttachment: function(req, res, next) {
		co(function* () {
			yield BigFile.upload(req, res, config.get('LINK_TYPE.AUCTION_ATTACHMENT'));
		}).catch(next);
	},

	saveComment: function(req, res) {
		co(function*() {
			let message = req.body.message || false;
			let attachments = req.body.attachments || [];

			let comment = yield Comment.create({message});

			comment.dataValues.attachments = [];

			coForeach(attachments, function*(attachment) {
				yield BigFileLink.update({
						type: config.get('LINK_TYPE.COMM_ATTACHMENT'),
						referredBy: comment.id
					},
					{where: {id: attachment.linkId}});

			})
			.then(function() {
				co(function*() {
					comment.dataValues.attachments = yield BigFileLink.getCommentAttachments(comment.id);
					res.jsonp({comment});
				});

			});
		});
	},

	getComments: function(req, res) {
		co(function*() {
			let comments = yield Comment.findAll({order: 'id DESC'});

			coForeach(comments, function*(comment, index) {
				comments[index].dataValues.attachments = yield BigFileLink.getCommentAttachments(comment.id);
			})
			.then(function() {
				res.jsonp({comments});
			});

		});
	},

	addType: function(req, res) {
		co(function*() {
			let type = req.body.type || false;

			if(type === false || type === '' || type.length < 3) {
				req.jsonp({error: 'No type supplied'});
			}

			yield BigFileLink.addType(type);

			let typesData = yield BigFileLink.getTypes();
			let linkTypes = _.isUndefined(typesData[0]) ? [] : typesData[0];

			res.jsonp({linkTypes});
		});
	},

	serveIndex: function(req, res) {
		res.sendFile('index.html', {root: config.get('PUBLIC_PATH')});
	}
};