/**
 * Created by yordan on 4/7/16.
 */
(function() {
	'use strict';

	angular.module('uploaderApp')
		.controller('LandingCtrl', ['$scope', '$http', function($scope, $http) {
			var vm = this;

			vm.isMultipleUpload = 'true';
			vm.uploadUrl = '/bigdata/upload';
			vm.downloadUrl = '/bigdata/:id';
			vm.deleteUrl = '/bigdata/:id';
			$scope.maxFileSize =  '2';
			$scope.units = 'GB';
			vm.computedMaxFileSize = vm.maxFileSize + vm.units;
			vm.username = 'User-1 (ADMIN)';
			vm.user = $scope.user = {};
			vm.isLoggedIn = false;
			vm.adminTotalUploaded = 0;
			vm.totalUploaded = 0;
			vm.adminFilesList = [];
			vm.filesList = [];
			vm.adminHasFiles = false;
			vm.userHasFiles = false;


			$scope.$on('file:uploaded', function() {
				vm.getList();
			});

			$scope.$watch('user', function(newValue) {
				vm.isLoggedIn = Object.keys(newValue).length > 0;

				if(vm.isLoggedIn) {
					vm.getList();
				}
			});

			$http.get('/currentUser')
				.success(function(data) {
					$scope.user = data.user;
				});

			vm.getList = function() {
				$http.get('/bigdata/list')
					.success(function(list) {
						vm.totalUploaded = 0;
						vm.userHasFiles = list.length > 0;

						if(vm.userHasFiles) {
							angular.forEach(list, function(file) {
								vm.totalUploaded += file.size;
							});

							vm.filesList = list;
						}


					});
			};

			$scope.$watchGroup(['maxFileSize', 'units'], function(newValues) {
				vm.computedMaxFileSize = newValues[0] + newValues[1];
			});


			vm.login = function() {
				$http.post('/login', {username: vm.username, password: 'fake'})
					.success(function(data) {
						$scope.user = data.user;
					});
			};

			vm.logout = function() {
				$http.post('/logout', {username: vm.username, password: 'fake'})
					.success(function() {
						$scope.user = {};
					});
			};
		}]);
})();

