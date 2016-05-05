/**
 * Created by yordan on 4/6/16.
 */
'use strict';
let path = require('path');
const BASE = path.join(__dirname, './../..');
const PUBLIC_PATH = path.join(BASE, 'demo', 'public');

module.exports = {
	PORT: 3000,
	PUBLIC_PATH: PUBLIC_PATH,
	DB: {
		HOST: 'localhost',
		NAME: 'files-test',
		USER: 'postgres',
		PASSWORD: 'pass',
		DIALECT: 'postgres'
	},
	LOG: {
		SERVER_CONFIG: {
			name: 'logger'
		}
	}
};