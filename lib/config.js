/**
 * Created by yordan on 4/6/16.
 */
'use strict';
let path = require('path');
let BASE = path.join(__dirname, './..');

module.exports = {
	PORT: 3000,
	ENV: 'test',
	FILE_PATH: path.join(BASE, 'var', 'bigfiles'),
	DB: {
		NAME: 'files-test',
		USER: 'postgres',
		PASSWORD: 'yourpass'
	}
};