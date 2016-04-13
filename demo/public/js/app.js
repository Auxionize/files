/**
 * Created by yordan on 4/6/16.
 */

(function() {
	'use strict';

	angular.module('uploaderApp', [
		'ui.router',
		'ui.angular-uploader'
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
	}]);

})();