/**
 * Created by yordan on 4/22/16.
 */
'use strict';

let path = require('path');
const BASE = path.join(__dirname, './../');
const FILE_PATH = path.join(BASE, 'var', 'bigfiles');
const TEMP_FILE_PATH = path.join(BASE, 'var', 'temp');

module.exports = {
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
	TEMP_FILE_LIFETIME: 2// Minutes
};