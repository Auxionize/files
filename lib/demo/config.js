/**
 * Created by yordan on 4/6/16.
 */
'use strict';
let path = require('path');
let BASE = path.join(__dirname, './../..');
let FILE_PATH = path.join(BASE, 'var', 'bigfiles');
let PUBLIC_PATH = path.join(BASE, 'demo', 'public');

module.exports = {
	PORT: 3000,
	FILE_PATH: FILE_PATH,
	PUBLIC_PATH: PUBLIC_PATH,
	DB: {
		HOST: 'localhost',
		NAME: 'files-test',
		USER: 'postgres',
		PASSWORD: '24262426',
		DIALECT: 'postgres'
	},
	LOG: {
		SERVER_CONFIG: {
			name: 'logger'
		}
	}
};