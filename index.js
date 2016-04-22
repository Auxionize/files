/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
const _ = require('lodash');
let defaultConfig = require('./lib/config.def');

// module definition ==================================================
module.exports = function(sequelize, config) {

	// Locals =========================================================
	config = _.extend({}, defaultConfig, config || {});

	let cronConfig = {
		TEMP_FILE_PATH: config.TEMP_FILE_PATH,
		TEMP_FILE_LIFETIME: config.TEMP_FILE_LIFETIME
	};
	let bigFileLinkConfig = {LINK_TYPE: config.LINK_TYPE};
	let cronJob = require('./lib/utils/cronJob')(cronConfig);
	let BigFileLink = require('./lib/models/BigFileLink')(sequelize, bigFileLinkConfig);
	let BigFile = require('./lib/models/BigFile')(sequelize, BigFileLink, config);

	// associations ===================================================
	BigFile.associate(BigFileLink);
	BigFileLink.associate(BigFile);

	// run cron job ===================================================
	cronJob.run();

	// return result object ===========================================
	return {BigFile, BigFileLink};
};




