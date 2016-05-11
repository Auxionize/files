/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
const _ = require('lodash');

// module definition ==================================================
module.exports = function(sequelize, config) {

	if(_.isUndefined(config)) {
		throw new Error('No configuration provided @module Files');
	}

	let cronJob = require('./lib/utils/cronJob')(config);
	let BigFileLink = require('./lib/models/BigFileLink')(sequelize, config);
	let BigFile = require('./lib/models/BigFile')(sequelize, BigFileLink, config);

	// associations ===================================================
	BigFile.associateInternal(BigFileLink);
	BigFileLink.associateInternal(BigFile);

	// run cron job ===================================================
	cronJob.run();

	// return result object ===========================================
	return {BigFile, BigFileLink};
};




