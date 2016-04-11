/**
 * Created by yordan on 4/7/16.
 */
(function() {
	'use strict';

	angular.module('uploaderApp')
		.controller('LandingCtrl', ['$scope', function($scope) {
			var vm = this;

			vm.isMultipleUpload = 'true';
			vm.uploadUrl = '/bigdata/upload';
			vm.downloadUrl = '/bigdata/:id';
			$scope.maxFileSize =  '2';
			$scope.units = 'GB';
			vm.computedMaxFileSize = vm.maxFileSize + vm.units;

			$scope.$watchGroup(['maxFileSize', 'units'], function(newValues) {
				vm.computedMaxFileSize = newValues[0] + newValues[1];
			});
		}]);
})();

