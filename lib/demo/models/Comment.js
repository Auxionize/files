/**
 * Created by yordan on 4/22/16.
 */
'use strict';

module.exports = function(sequelize) {
	let DataTypes = sequelize.Sequelize;

	let Comment = sequelize.define('Comment', {
		message: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});

	return Comment;
};