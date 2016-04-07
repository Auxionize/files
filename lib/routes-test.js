/**
 * Created by yordan on 4/6/16.
 */
'use strict';

const router = new require('express').Router();
let path = require('path');

module.exports = router;

// routes definitions
router.get('*', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname, './../demo')});
});