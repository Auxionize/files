/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// dependencies =======================================================
let co = require('co');
let coForeach = require('co-foreach');
let serverConfig = require('../../lib/demo/config.demo');
let moduleConfig = require('../../lib/config.def');
let logger = require('express-bunyan-logger');
let express = require('express');
let passport = require('passport');
let Strategy = require('passport-local').Strategy;
let cookieParser = require('cookie-parser');
let bodyParser = require('skipper');
let _ = require('lodash');
let app = express();
let Sequelize = require('sequelize');
let sequelize = new Sequelize(
	serverConfig.DB.NAME,
	serverConfig.DB.USER,
	serverConfig.DB.PASSWORD,
	{
		host: serverConfig.DB.HOST,
		dialect: serverConfig.DB.DIALECT
	}
);

// demo models ========================================================
let User = require('../../lib/demo/models/User')(sequelize);
let Auction = require('../../lib/demo/models/Auction')(sequelize);
let Comment = require('../../lib/demo/models/Comment')(sequelize);

// uploader module import =============================================
let uploaderModule = require('../../index')(sequelize, moduleConfig);
let BigFile = uploaderModule.BigFile;
let BigFileLink = uploaderModule.BigFileLink;
let LINK_TYPE = moduleConfig.LINK_TYPE;

// Passport config ====================================================
passport.use(new Strategy(
	function(username, password, done) {
		User.findOne({where: {username}})
			.then(function(user) {
				if(user === null) {
					return done(null, false);
				}
				else {
					return done(null, user);
				}
			});
	}
));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

// server config ======================================================
app.enable('trust proxy');
app.disable('x-powered-by');
app.use(logger(serverConfig.LOG.SERVER_CONFIG));
app.use(express.static(serverConfig.PUBLIC_PATH));
app.use(cookieParser());
app.use(bodyParser());
app.use(require('express-session')({ secret: 'mega secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/currentUser', function(req, res) {
	res.jsonp({user: req.user || {}});
});

app.post('/login', passport.authenticate('local', {
	successRedirect: '/loginSuccess',
	failureRedirect: '/loginFailure'
}));

app.post('/logout', function(req, res) {
	req.logout();
	res.jsonp({msg: 'Logged out'});
});

app.get('/loginFailure', function(req, res) {
	res.jsonp({user: {}});
});

app.get('/loginSuccess', function(req, res) {
	res.jsonp({user: req.user});
});

app.post('/bigdata/upload', function(req, res, next) {
	co(function* () {
		yield BigFile.upload(req, res, LINK_TYPE.USER_BUCKET);
	}).catch(next);
});

app.get('/bigdata/list', function (req, res, next) {
	co(function* () {
		yield BigFile.list(req, res);
	}).catch(next);
});


app.get('/bigdata/:uuid', function (req, res, next) {
	co(function* () {
		yield BigFile.serveFileWithUUID(req, res);
	}).catch(next);
});

app.delete('/bigdata/:id', function (req, res, next) {
	co(function* () {
		yield BigFile.unlink(req, res);
	}).catch(next);
});

app.get('/allDemoData', function(req, res) {
	co(function*() {
		let auctions = yield Auction.findAll();
		let comments = yield Auction.findAll();

		coForeach(auctions, function*(auction, index) {
			let contract = [];
			let attachments = [];

			let contractLink = yield BigFileLink.findOne({
				where: {type: LINK_TYPE.AUCTION_CONTRACT, referredBy: auction.id},
				include: [
					{model: BigFile, required: false}
				]
			});

			let attachmentLinks = yield BigFileLink.findAll({
				where: {type: LINK_TYPE.AUCTION_ATTACHMENT, referredBy: auction.id},
				include: [
					{model: BigFile, required: false}
				]
			});

			if(contractLink !== null && contractLink.BigFile !== null) {
				contract.push(contractLink.BigFile.toJSON());
				contract[0].linkId = contractLink.id;
			}

			if(attachmentLinks.length > 0) {
				_.forEach(attachmentLinks, function(attachmentLink) {
					if(attachmentLink.BigFile !== null) {
						var currentAttachment = attachmentLink.BigFile.toJSON();

						currentAttachment.linkId = attachmentLink.id;

						attachments.push(currentAttachment);
					}
				});
			}

			auctions[index].dataValues.contract = contract;
			auctions[index].dataValues.attachments = attachments;


		})
		.then(function() {
			res.jsonp({auctions, comments});
		});



	});

});

app.post('/bigdata/auction/:id/contract', function (req, res, next) {
	co(function* () {
		yield BigFile.upload(req, res, LINK_TYPE.AUCTION_CONTRACT);
	}).catch(next);
});

app.post('/bigdata/auction/:id/attachment', function (req, res, next) {
	co(function* () {
		yield BigFile.upload(req, res, LINK_TYPE.AUCTION_ATTACHMENT);
	}).catch(next);
});

app.post('/saveComment', function(req, res) {
	co(function*() {
		let message = req.body.message || false;
		let attachments = req.body.attachments || [];

		let comment = yield Comment.create({message});

		comment.dataValues.attachments = [];

		coForeach(attachments, function*(attachment) {
			yield BigFileLink.update({
				type: LINK_TYPE.COMM_ATTACHMENT,
				referredBy: comment.id
			},
			{where: {id: attachment.linkId}});

		})
		.then(function() {
			co(function*() {
				let attachmentLinks = yield BigFileLink.findAll({
					where: {type: LINK_TYPE.COMM_ATTACHMENT, referredBy: comment.id},
					include: [
						{model: BigFile, required: false}
					]
				});

				if(attachmentLinks.length > 0) {
					_.forEach(attachmentLinks, function(attachmentLink) {
						if(attachmentLink.BigFile !== null) {
							var currentAttachment = attachmentLink.BigFile.toJSON();

							currentAttachment.linkId = attachmentLink.id;
							comment.dataValues.attachments.push(currentAttachment);
						}
					});
				}

				res.jsonp({comment});
			});

		});
	});
});

app.get('/comments', function(req, res) {
	co(function*() {
		let comments = yield Comment.findAll({order: 'id DESC'});

		coForeach(comments, function*(comment, index) {
			comments[index].dataValues.attachments = [];

			let attachmentLinks = yield BigFileLink.findAll({
				where: {type: LINK_TYPE.COMM_ATTACHMENT, referredBy: comment.id},
				include: [
					{model: BigFile, required: false}
				]
			});

			if(attachmentLinks.length > 0) {
				_.forEach(attachmentLinks, function(attachmentLink) {
					if(attachmentLink.BigFile !== null) {
						var currentAttachment = attachmentLink.BigFile.toJSON();

						currentAttachment.linkId = attachmentLink.id;
						comments[index].dataValues.attachments.push(currentAttachment);
					}
				});
			}


		})
		.then(function() {
			res.jsonp({comments});
		});

	});
});


app.get('*', function(req, res) {
	res.sendFile('index.html', {root: serverConfig.PUBLIC_PATH});
});


// server init ========================================================
co(function*() {
	yield BigFile.sync();
	yield BigFileLink.sync();
	yield User.sync();
	yield Auction.sync();
	yield Comment.sync();

	let hasUsers = yield User.findById(1);
	let hasAuctions = yield Auction.findById(1);
	let hasComments = yield Comment.findById(1);
	let createRecords = hasUsers === null && hasAuctions === null && hasComments === null;
	let i;

	if(createRecords) {
		for (i = 0; i < 4; i++) {
			yield User.create({username: 'User-' + (i + 1) + (i === 0 ? ' (ADMIN)' : ''), type: i === 0 ? 'ADMIN' : 'USER'});
			yield Auction.create({name: 'Auction-' + (i + 1)});
		}
	}

	let server = app.listen(serverConfig.PORT, function() {
		let host = server.address().address;
		let port = server.address().port;
		let logString = 'Uploader app running on http://%s:%s';

		host = host === '::' ? 'localhost' : host;
		console.log(logString, host, port);
	});
});


