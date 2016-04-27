/**
 * Created by yordan on 4/22/16.
 */
'use strict';

// module dependencies ================================================
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
let task = null;

// helper =============================================================
Number.prototype.minutesToMilliseconds = function() {
	return this.valueOf() * 60000;
};

// module definition ==================================================
module.exports = function(config) {
	let run = function() {
		if(task !== null) {
			return false;
		}

		// 00:20h each day
		task = schedule.scheduleJob('20 0 * * *', function() {
			fs.stat(config.TEMP_FILE_PATH, function(err) {
				if(err) return;

				fs.readdir(config.TEMP_FILE_PATH, function(err, files) {
					if(err) return;

					_.forEach(files, function(file) {
						let fileNameSegments = file.split('_');

						if(!_.isUndefined(fileNameSegments[1]) && !isNaN(fileNameSegments[1])) {
							let fileCreated = parseInt(fileNameSegments[1], 10);
							let diff = Date.now() - fileCreated;

							if(diff >= config.TEMP_FILE_LIFETIME.minutesToMilliseconds()) {
								fs.unlink(path.join(config.TEMP_FILE_PATH, file), function(err) {
									if(err) return;
								});
							}
						}
					});
				});
			});
		});

		return true;
	};

	let destroy = function() {
		if(task === null) {
			return false;
		}
		else {
			task.cancel();
			task = null;

			return true;
		}
	};

	return {run, destroy};
};