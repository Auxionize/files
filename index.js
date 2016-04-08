/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
let _ = require('lodash');
let log = require('./lib/utils/exceptions');

// module definition ==================================================
module.exports = function(sequelize, filePath) {
	if(_.isUndefined(filePath)) {
		throw new log.InstanceException('Argument `filePath` is required.');
	}

	let BigFile = require('./lib/models/BigFile')(sequelize, filePath);
	let BigFileLink = require('./lib/models/BigFileLink')(sequelize);

	// associations ===================================================
	BigFile.associate(BigFileLink);
	BigFileLink.associate(BigFile);

	// routes =========================================================
	let Routes = require('./lib/routes')(BigFile, BigFileLink);

	// return result object ===========================================
	return {
		Routes: Routes,
		BigFile: BigFile,
		BigFileLink: BigFileLink
	};
};




