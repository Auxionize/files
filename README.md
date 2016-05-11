# Files module

#### Independent uploader module with BigFile and BigFileLink models in order to store files and links after the upload is completed with authorization check etc.
 
### Install

```
npm i --save Auxionize/files#release-version
```

or add it in your package.json as follows

```
"dependencies": {
    "files": "Auxionize/files#release-version"
}
```

and then npm install from your project appropriate folder.

If you want to play around with the demo folder you should checkout the git repo you can 'npm install' it from the root folder and in order to obtain all required assets
@/demo/public 'bower install'. One last requirement is to have local Postres server running and to configure your server instances as follows. Finally run /demo/server/server.js and you're ready to go.

### Usage

###### Requirements

- sequelize instance
- node-config instance with the following structure

Note that all config files in config directory will be ignored from git by default.
In order to overwrite the default configuration you need to create 'development.js' config file with the following structure. If some attributes are missing the default values will be in use(when in production you have to provide node-config instance with the required data provided).

```
// example configuration module
'use strict';

let path = require('path');
const BASE = path.join(__dirname, './../');
const PUBLIC_PATH = path.join(BASE, 'demo', 'public');
const FILE_PATH = path.join(BASE, 'var', 'bigfiles');
const TEMP_FILE_PATH = path.join(BASE, 'var', 'temp');

module.exports = {
	// module related =================================================
	FILE_PATH: FILE_PATH,// absolute path where files will be stored
	TEMP_FILE_PATH: TEMP_FILE_PATH,// absolute path where temporary files will be stored
	USER_QUOTA: 5,// GB - max file size upload when files has linkType 'USER_BUCKET'
	MAX_FILE_SIZE: 2,// GB - max file size the server will handle per request
	LINK_TYPE: {
	// default link types that you can extend here
	// also you need to add the enum value with the BigFileLink.addType('MY_TYPE') method
		USER_BUCKET: 'USER_BUCKET',
		AUCTION_ATTACHMENT: 'AUCTION_ATTACHMENT',
		AUCTION_CONTRACT: 'AUCTION_CONTRACT',
		COMM_ATTACHMENT: 'COMM_ATTACHMENT'
	},
	// We have cron job runnung each day @00:20h
	// TEMP_FILE_LIFETIME is the time in minutes to be preserved in temp folder
	// when the time exceeds all older files will be automatically deleted
	TEMP_FILE_LIFETIME: 60,
	// server related =================================================
	PORT: 3000,
	PUBLIC_PATH: PUBLIC_PATH,// the public path containing all assets
	DB: {// database configuration
		HOST: 'localhost',
		NAME: 'files-test',
		USER: 'postgres',
		PASSWORD: 'pass',
		DIALECT: 'postgres'
	},
	LOG: {// server log options see https://github.com/villadora/express-bunyan-logger for further reference
		SERVER_CONFIG: {
			name: 'logger'
		}
	}
};


```

###### Simple initialization

```

var filesModule = require('files')(sequelize, moduleConfig);

```

###### Module Api

```


```
