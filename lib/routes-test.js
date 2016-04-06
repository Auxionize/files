/**
 * Created by yordan on 4/6/16.
 */
const router = new require('express').Router();

module.exports = router;

// routes definitions
router.get('*', function(req, res) {
	res.sendFile('index.html');
});