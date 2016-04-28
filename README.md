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

If you want to play around with the demo folder you should checkout the git repo.
Then you can 'npm install' it from the root folder and in order to obtain all required assets
@/demo/public 'bower install'. One last requirement is to have local postres server running 
also edit @/demo/config.demo.js with you local settings. Run /demo/server/server.js and you're ready to go.

### Usage

###### Requirements

- sequelize instance
- module configuration (if not present default values will be applied)

Example

```
var moduleConfig

var filesModule = require('files')(sequelize, moduleConfig);