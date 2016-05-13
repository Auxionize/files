/**
 * Created by yordan on 5/11/16.
 */
'use strict';

let path = require('path');
const BASE = path.join(__dirname, '../../../');
const PUBLIC_PATH = path.join(BASE, 'demo', 'public');
const FILE_PATH = path.join(BASE, 'demo', 'server', 'var', 'bigfiles');
const TEMP_FILE_PATH = path.join(BASE, 'demo', 'server', 'var', 'temp');

module.exports = {
	// module related
	FILE_PATH: FILE_PATH,
	TEMP_FILE_PATH: TEMP_FILE_PATH,
	USER_QUOTA: 5,// GB
	MAX_FILE_SIZE: 2,// GB
	LINK_TYPE: {
		USER_BUCKET: 'USER_BUCKET',
		AUCTION_ATTACHMENT: 'AUCTION_ATTACHMENT',
		AUCTION_CONTRACT: 'AUCTION_CONTRACT',
		COMM_ATTACHMENT: 'COMM_ATTACHMENT'
	},
	TEMP_FILE_LIFETIME: 60,// Minutes
	// server related
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