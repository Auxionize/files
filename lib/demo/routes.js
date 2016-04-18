/**
 * Created by yordan on 4/6/16.
 */
'use strict';

// module dependencies ================================================
let config = require('./config');
const router = new require('express').Router();

// routes =========================================================
router.post('/login',
	function(req, res, next) {
		console.log("@login", req.params);
		req.login({id: 1, fullName: 'Iordan Georgiev'}, function(err) {
			if(err) return next(err);
			return next();
		});
	},
	function(req, res) {
		console.info("@req.user", req.user);
		res.jsonp({msg: 'Ok with res'});
		//res.redirect('/');
	});

router.get('*', function(req, res) {
	console.log("@user", req.user);
	res.sendFile('index.html', {root: config.PUBLIC_PATH});
});

module.exports = router;

