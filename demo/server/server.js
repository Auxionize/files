/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// dependencies =======================================================
let co = require('co');
let serverConfig = require('../../lib/demo/config.demo');
let moduleConfig = require('../../lib/config.def');
let logger = require('express-bunyan-logger');
let express = require('express');
let passport = require('passport');
let Strategy = require('passport-local').Strategy;
let cookieParser = require('cookie-parser');
let bodyParser = require('skipper');
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

// demo controller ====================================================
let DemoController = require('../../lib/demo/controllers/DemoController');

let ControllerArguments = [
	moduleConfig,
	serverConfig,
	BigFile,
	BigFileLink,
	Auction,
	Comment
];

DemoController.initWith.apply(null, ControllerArguments);

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

// Routes =============================================================
app.get('/currentUser', DemoController.getUser);

app.post('/login', passport.authenticate('local', {
	successRedirect: '/loginSuccess',
	failureRedirect: '/loginFailure'
}));

app.post('/logout', DemoController.logOut);

app.get('/loginFailure', DemoController.loginFailure);

app.get('/loginSuccess', DemoController.loginSuccess);

app.post('/bigdata/upload', DemoController.upload);

app.get('/bigdata/list', DemoController.list);

app.get('/bigdata/:uuid', DemoController.getFile);

app.delete('/bigdata/:id', DemoController.unlinkFile);

app.get('/allDemoData', DemoController.getDemoData);

app.post('/bigdata/auction/:id/contract', DemoController.uploadContract);

app.post('/bigdata/auction/:id/attachment', DemoController.uploadAttachment);

app.post('/saveComment', DemoController.saveComment);

app.get('/comments', DemoController.getComments);

app.post('/addType', DemoController.addType);

app.get('*', DemoController.serveIndex);

// server init ========================================================
co(function*() {
	yield BigFile.sync();
	yield BigFileLink.sync();
	yield User.sync();
	yield Auction.sync();
	yield Comment.sync();

	let hasUsers = yield User.findById(1);
	let hasAuctions = yield Auction.findById(1);
	let createRecords = hasUsers === null && hasAuctions === null;
	let i;

	if(createRecords) {
		for (i = 0; i < 4; i++) {
			let username = 'User-' + (i + 1) + (i === 0 ? ' (ADMIN)' : '');
			let type = i === 0 ? 'ADMIN' : 'USER';
			let name = 'Auction-' + (i + 1);

			yield User.create({username, type});
			yield Auction.create({name});
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


