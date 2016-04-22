/**
 * Created by yordan on 4/14/16.
 */
'use strict';

module.exports = function(sequelize) {
	let DataTypes = sequelize.Sequelize;

	let User = sequelize.define('User', {
		username: {
			type: DataTypes.STRING,
			allowNull: false
		},
		type: {
			type: DataTypes.ENUM({values: ['ADMIN', 'USER']}),
			allowNull: false
		}
	});

	return User;
};