/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
const _ = require('lodash');
const log = require('./lib/utils/exceptions');

// module definition ==================================================
module.exports = function(sequelize, filePath) {
	if(_.isUndefined(filePath)) {
		throw new log.InstanceException('Argument `filePath` is required.');
	}

	let BigFileLink = require('./lib/models/BigFileLink')(sequelize);
	let BigFile = require('./lib/models/BigFile')(sequelize, BigFileLink, filePath);

	// associations ===================================================
	BigFile.associate(BigFileLink);
	BigFileLink.associate(BigFile);

	// routes =========================================================
	//let Routes = require('./lib/routes')(BigFile, BigFileLink);

	// return result object ===========================================
	return {
		//Routes: Routes,
		BigFile: BigFile,
		BigFileLink: BigFileLink
	};
};




