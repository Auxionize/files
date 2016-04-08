/**
 * Created by yordan on 4/8/16.
 */
(function() {
	'use strict';

	// Directive definition =============================================
	angular.module('uploaderApp')
		.directive('uploaderDirective', function() {
			return {
				scope: {
					uploadUrl: '@',
					downloadUrl: '@',
					multiple: '=?'
				},
				templateUrl: 'js/directives/uploader-directive/uploaderDirective.html',
				controller: UploaderCtrl,
				controllerAs: 'vm'
			};
		});


	// Controller definition ============================================
	var UploaderCtrl = ['$scope', '$timeout', 'Upload', function($scope, $timeout, Upload) {
		var vm = this;

		vm.abortMap = [];
		vm.fileMap = {};
		vm.multiple = $scope.multiple === 'true';
		vm.downloadUrl = $scope.downloadUrl;
		vm.downloadUrl = vm.downloadUrl.substr(vm.downloadUrl.length - 1) === '/'
							? vm.downloadUrl
							: vm.downloadUrl + '/';

		var checkForDuplicateCandidate = function(files) {
			var uploadedMapContent = Object.keys(vm.fileMap);

			if(uploadedMapContent.length === 0) {
				return null;
			}

			var compareResult = files.map(function(currentFile) {
				return uploadedMapContent.indexOf(currentFile.name) > -1;
			});

			return compareResult.indexOf(true) > -1;
		};

		vm.load = function($files) {
			if($files.length === 0) {
				return;
			}

			var hasDuplicate = checkForDuplicateCandidate($files);

			if(hasDuplicate === true) {
				// todo do something useful
				return;
			}

			var tempDate = new Date().getTime();

			for (var i = 0; i < $files.length; i++) {
				var file = $files[i];
				var fileName = file.name;
				var fileDate = new Date(tempDate++);

				vm.fileMap[fileName] = {
					data: {
						date: fileDate,
						name: file.name,
						size: file.size
					},
					progress: 0,
					done: false,
					isVisible: true,
					animated: false
				};

				var upload = Upload.upload({
					url: $scope.uploadUrl,
					method: 'POST',
					file: file
				}).progress(function(evt) {
					var fileName = evt.config.file.name;

					vm.fileMap[fileName].progress = parseInt(100.0 * evt.loaded / evt.total, 10);
				}).success(function(response, status, headers, config) {
					var responseFileName = config.file.name;
					var fileMapObject = vm.fileMap[responseFileName];

					fileMapObject.data = response[0];
					fileMapObject.done = true;
					fileMapObject.progress = 100;
				}).error(function(response, status, headers, config) {
					// TODO something useful
				});

				vm.abortMap.push(upload.abort);
			}
		};

		vm.unload = function($index, fileName, abortUpload) {
			abortUpload = abortUpload || false;

			if(abortUpload) {
				vm.abortMap[$index]();
			}

			vm.abortMap.splice($index, 1);
			vm.fileMap[fileName].animated = true;

			$timeout(function() {
				vm.fileMap[fileName].isVisible = false;
				delete vm.fileMap[fileName];
			}, 600);
		};
	}];
})();