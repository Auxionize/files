/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
let config = require('./config');
const router = new require('express').Router();

// module definition ==================================================
module.exports = function() {

	// routes =========================================================
	router.get('*', function(req, res) {
		res.sendFile('index.html', {root: config.PUBLIC_PATH});
	});

	return router;
};
