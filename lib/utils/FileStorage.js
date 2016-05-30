/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// Module dependencies ================================================
const $p = require('bluebird');
const fs = $p.promisifyAll(require('fs'));
const log = require('./exceptions');
const path = require('path');
const mkdirp = $p.promisify(require('mkdirp'));

// Helper =============================================================
function a100Files(number, base) {
	const parentsRemoved = (number % (base * 100));
	return '' + Math.floor(parentsRemoved / base);
}

// Class definition ===================================================
class FileStorage {
	constructor(base) {
		this._base = base;
	}

	*generateTempFile(userId) {
		let now = Date.now();
		let dirName = this._base;
		let fileName = userId + '_' + now.toString();

		yield mkdirp(dirName);

		return path.join(dirName, fileName);
	}

	finalizeUpload(from, to, cb) {
		fs.rename(from, to, cb);
	}

	getDirName (id) {
		return path.join(this._base,
			a100Files(id, 1000000),
			a100Files(id, 10000),
			a100Files(id, 100)
		);
	}

	getFileName(file) {
		return a100Files(file.id, 1) + '_' + file.uuid;
	}

	getOldPath(file) {
		return path.join(this.getDirName(file.id), a100Files(file.id, 1));
	}

	getPath(file) {
		return path.join(this.getDirName(file.id), this.getFileName(file));
	}

	*prepareDirectory(file) {
		return yield mkdirp(this.getDirName(file.id));
	}

	*storeContents (file, contents) {
		yield this.prepareDirectory(file);
		yield fs.writeFileAsync(this.getPath(file), contents);
	}

	*deleteContents (file) {
		yield fs.unlinkAsync(this.getPath(file));
	}

	*getContents (file) {
		return yield fs.readFileAsync(this.getPath(file));
	}

	createReadStream(file) {
		const path = this.getPath(file);
		const oldPath = this.getOldPath(file);
		const newPathExists = fs.existsSync(path);
		const oldPathExists = fs.existsSync(oldPath);

		if(newPathExists) {
			return fs.createReadStream(path);
		}
		else if(oldPathExists) {
			return fs.createReadStream(oldPath);
		}
		else {
			throw new log.FileException('No such file or directory: @' + oldPath + ' or @' + path);
		}

	}
}

module.exports = FileStorage;