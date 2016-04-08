/**
 * Created by yordan on 4/6/16.
 */

(function() {
	'use strict';

	angular.module('uploaderApp', [
		'ui.router',
		'ngFileUpload',
		'ui.bootstrap'
	])
	.config(['$stateProvider', '$urlRouterProvider',function( $stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise("/landing");

		$stateProvider
			.state('landing', {
				url: '/landing',
				templateUrl: 'partials/landingPage.html',
				controller: 'LandingCtrl',
				controllerAs: 'vm'
			});
	}])
	.filter('bytes', function() {
		return function(bytes, precision) {
			if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
			if (typeof precision === 'undefined') precision = 1;
			var units = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'],
				number = Math.floor(Math.log(bytes) / Math.log(1024));
			return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
		}
	});
})();