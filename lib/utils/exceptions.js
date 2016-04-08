/**
 * Created by yordan on 4/6/16.
 */
module.exports = {
	InstanceException: function(err) {
		this.name = 'InstanceException';
		this.message = err;
	},
	FileException: function(err) {
		this.name = 'FileException';
		this.message = err;
	}
};