/**
 * Created by yordan on 4/6/16.
 */
'use strict';

var app = angular.module('uploader', ['ui.router', 'ngFileUpload']);

app.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/comment");

	$stateProvider
		.state('comment', {
			url: '/comment',
			templateUrl: 'partials/commentUploader.html',
			controller: ['$scope', 'auxUpload', function($scope, auxUpload) {

				$scope.uploadedMap = {};
				$scope.upload = function (files) {
					console.info("@files", files, "@uploadedMap", $scope.uploadedMap);
					auxUpload('/bigdata/upload', files, $scope.uploadedMap);
				}
			}]
		})
		.state('contract', {
			url: '/contract',
			templateUrl: 'partials/contractUploader.html'
		})
		.state('attachment', {
			url: '/attachment',
			templateUrl: 'partials/attachmentUploader.html'
		});
});


app.factory('auxUpload', ['Upload', '$timeout', function(Upload, $timeout) {
	var uploader = function (url, files, uploadedMap, finishCallback){


		var tempDate = new Date().getTime();

		if (!files || !files.length) return;
		for (var i = 0; i < files.length; i++) {
			var fileDate = new Date(tempDate++);
			uploadedMap[files[i].name] = {
				data: {date: fileDate, name: files[i].name},
				progress: 0,
				done: false,
				show: true,
			}
			Upload.upload({	url: url, file: files[i]})
				.progress(function (evt) {
					var progressPct = parseInt(100.0 * evt.loaded / evt.total);
					uploadedMap[evt.config.file.name].progress = progressPct;
				})
				.success(function (data, status, headers, config) {

					delete uploadedMap[config.file.name];
					var bigFile = data[0];
					uploadedMap[bigFile.id] = {
						data: bigFile,
						done: true,
						progress: 100,
						show: true,
					}
					$timeout(function(){
						uploadedMap[bigFile.id].show = false;
					}, 1000)

					if(finishCallback)
						finishCallback.call();
				})
				.catch(console.error.bind(console, 'Error uploading file'));
		}
	}
	return uploader;
}]);