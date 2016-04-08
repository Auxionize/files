/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// dependencies =======================================================
let co = require('co');
let config = require('../../lib/demo/config');
let logger = require('express-bunyan-logger');
let express = require('express');
let cookieParser = require('cookie-parser');
let bodyParser = require('skipper');
let router = new express.Router();
let app = express();
let testRoutes = require('../../lib/demo/routes');
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

// uploader module import =============================================
let uploaderModule = require('../../index')(sequelize, config.FILE_PATH);
let Routes = uploaderModule.Routes;
let BigFile = uploaderModule.BigFile;
let BigFileLink = uploaderModule.BigFileLink;

// server config ======================================================
app.enable('trust proxy');
app.disable('x-powered-by');
app.use(logger(config.LOG.SERVER_CONFIG));
app.use(express.static(config.PUBLIC_PATH));
router.use(cookieParser());
router.use(bodyParser());
router.use(Routes);
router.use(testRoutes);
app.use(router);

// server init ========================================================
co(function*() {
	yield BigFile.sync();
	yield BigFileLink.sync();

	let server = app.listen(config.PORT, function() {
		let host = server.address().address;
		let port = server.address().port;
		let logString = 'Uploader app running on http://%s:%s';

		host = host === '::' ? 'localhost' : host;
		console.log(logString, host, port);
	});
});


