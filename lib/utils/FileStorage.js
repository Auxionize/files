/**
 * Created by yordan on 4/6/16.
 */
'use strict';

const $p = require('bluebird');
const path = require('path');
const mkdirp = $p.promisify(require('mkdirp'));
const fs = $p.promisifyAll(require('fs'));

function a100Files(number, base) {
	const parentsRemoved = (number % (base * 100));
	return '' + Math.floor(parentsRemoved / base);
}

class FileStorage {
	constructor(base) {
		this._base = base;
	}

	getDirName (file) {
		const id = file.id;
		return path.join(this._base,
			a100Files(id, 1000000),
			a100Files(id, 10000),
			a100Files(id, 100)
		);
	}

	getFileName(file) {
		return a100Files(file.id, 1);
	}

	getPath(file) {
		return path.join(this.getDirName(file), this.getFileName(file));
	}

	*prepareDirectory(file) {
		return yield mkdirp(this.getDirName(file));
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
		return fs.createReadStream(path);
	}
}

module.exports = FileStorage;