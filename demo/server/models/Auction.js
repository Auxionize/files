/**
 * Created by yordan on 4/22/16.
 */
'use strict';

module.exports = function(sequelize) {
	let DataTypes = sequelize.Sequelize;

	let Auction = sequelize.define('Auction', {
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});

	return Auction;
};