/**
 * Created by yordan on 4/6/16.
 */
'use strict';

let _ = require('lodash');
let co = require('co');
let localConfig = require('./lib/config');
let log = require('./lib/exceptions');
let localApp;


let listenApp = function() {
	let server = localApp.listen(localConfig.PORT || 3000, function() {
		let host = server.address().address;
		let port = server.address().port;

		console.log('Uploader app running on http://%s:%s', host === '::' ? 'localhost' : host, port);
	});
};
let initTestApp = co.wrap(function* (sequelize, data) {
	yield data.BigFile.sync();
	yield data.BigFileLink.sync();

	let express = require('express');
	let router = new express.Router();
	let app = express();
	let cookieParser = require('cookie-parser');
	let bodyParser = require('skipper');
	let testRoutes = require('./lib/routes-test');

	app.enable('trust proxy');
	app.disable('x-powered-by');
	app.use(express.static(__dirname + '/demo'));
	router.use(cookieParser());
	router.use(bodyParser());
	router.use(data.mainRoutes);
	router.use(testRoutes);
	app.use(router);

	return app;
});

module.exports = {
	init: function(sequelize, config) {
		let useLocalConfig = _.isUndefined(config) || _.isEmpty(config);

		config = localConfig = useLocalConfig ? localConfig : config;
		let isTestEnv = config.ENV && config.ENV === 'test';

		if(!config.FILE_PATH) {
			throw new log.InstanceException('Config attribute `FILE_PATH` is required.');
		}

		if(isTestEnv) {
			let Sequelize = require('sequelize');
			sequelize = new Sequelize(
				config.DB.NAME,
				config.DB.USER,
				config.DB.PASSWORD,
				{
					host: 'localhost',
					dialect: 'postgres'
				}
			);
		}

		let BigFile = require('./lib/models/BigFile')(sequelize, config.FILE_PATH);
		let BigFileLink = require('./lib/models/BigFileLink')(sequelize);

		// apply associations
		BigFile.associate(BigFileLink);
		BigFileLink.associate(BigFile);

		// the routes uses models
		let mainRoutes = require('./lib/routes')(BigFile, BigFileLink);

		if(isTestEnv) {
			let data = {
				mainRoutes: mainRoutes,
				BigFile: BigFile,
				BigFileLink: BigFileLink
			};

			initTestApp(sequelize, data).then(function(app) {
				localApp = app;
				listenApp();
			});

		}
		else {// in production use
			return mainRoutes;
		}

	}
};




