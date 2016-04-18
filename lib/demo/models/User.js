/**
 * Created by yordan on 4/14/16.
 */
'use strict';

const co = require('co');
const _ = require('lodash');

module.exports = function(sequelize) {
	let DataTypes = sequelize.Sequelize;

	let User = sequelize.define('User', {
		username: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});

	return User;
};