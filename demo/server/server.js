/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// dependencies =======================================================
let co = require('co');
let config = require('../../lib/demo/config');
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
	config.DB.NAME,
	config.DB.USER,
	config.DB.PASSWORD,
	{
		host: config.DB.HOST,
		dialect: config.DB.DIALECT
	}
);
let User = require('../../lib/demo/models/User')(sequelize);

// uploader module import =============================================
let uploaderModule = require('../../index')(sequelize, config.FILE_PATH);
let BigFile = uploaderModule.BigFile;
let BigFileLink = uploaderModule.BigFileLink;
let LinkType = BigFileLink.LinkTypes;

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
app.use(logger(config.LOG.SERVER_CONFIG));
app.use(express.static(config.PUBLIC_PATH));
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
		yield BigFile.upload(req, res, LinkType.USER_BUCKET);
	}).catch(next);
});

app.get('/bigdata/list', function (req, res, next) {
	co(function* () {
		yield BigFile.list(req, res, LinkType.USER_BUCKET);
	}).catch(next);
});

app.get('/bigdata/adminlist', function (req, res, next) {
	co(function* () {
		yield BigFile.list(req, res);
	}).catch(next);
});

app.get('/bigdata/:uuid', function (req, res, next) {
	co(function* () {
		yield BigFile.serveFileWithUUID(req, res);
	}).catch(next);
});

app.delete('/bigdata/:uuid', function (req, res, next) {
	co(function* () {
		yield BigFile.unlink(req, res, LinkType.USER_BUCKET);
	}).catch(next);
});

app.get('*', function(req, res) {
	res.sendFile('index.html', {root: config.PUBLIC_PATH});
});


// server init ========================================================
co(function*() {
	yield BigFile.sync();
	yield BigFileLink.sync();
	yield User.sync();

	let userNames = [
		'User-1',
		'User-2',
		'User-3',
		'User-4'
	];

	let usersExist = yield User.findAll({
		where: {
			username: {$in: userNames}
		}
	});

	if(usersExist.length === 0) {
		yield User.create({username: userNames[0]});
		yield User.create({username: userNames[1]});
		yield User.create({username: userNames[2]});
		yield User.create({username: userNames[3]});
	}

	let server = app.listen(config.PORT, function() {
		let host = server.address().address;
		let port = server.address().port;
		let logString = 'Uploader app running on http://%s:%s';

		host = host === '::' ? 'localhost' : host;
		console.log(logString, host, port);
	});
});


