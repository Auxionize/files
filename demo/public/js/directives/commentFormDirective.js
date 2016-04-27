/**
 * Created by yordan on 4/26/16.
 */

(function() {
	'use strict';


	angular.module('uploaderApp')
		.directive('commentForm', function() {
			return {
				scope: true,
				templateUrl: 'js/directives/commentFormDirective.html',
				controller: CommentFormCtrl,
				controllerAs: 'vm'
			};
		});

	var CommentFormCtrl = ['$scope', '$http', function($scope, $http) {
		var vm = this;

		vm.publishIsDisabled = false;
		vm.downloadUrl = '/bigdata/:id';
		vm.comments = [];
		vm.commentFormIsVisible = false;
		vm.commentUploadUrl = '/bigdata/upload';
		vm.commentAttachments = [];
		vm.downloadUrl = '/bigdata/:id';
		vm.deleteUrl = '/bigdata/:id';
		vm.maxFileSize = '5GB';
		vm.message = '';

		vm.resetForm = function() {
			vm.publishIsDisabled = false;
			vm.comments = [];
			vm.commentAttachments = [];
			vm.commentFormIsVisible = false;
			vm.message = '';
		};

		vm.fetchComments = function() {
			$http.get('/comments')
				.success(function(data) {
					vm.comments = data.comments;
				});
		};

		vm.toggleCommentForm = function() {
			vm.commentFormIsVisible = !vm.commentFormIsVisible;
		};


		vm.onFileUploaded = function(file) {
			vm.commentAttachments.push(file);
		};

		vm.onFileRemoved = function(file) {
			angular.forEach(vm.commentAttachments, function(attachment, index) {
				if(angular.equals(attachment, file)) {
					vm.commentAttachments.splice(index, 1);
				}
			});
		};

		vm.toggleDisableState = function() {
			vm.publishIsDisabled = !vm.publishIsDisabled;
		};

		vm.publishComment = function() {
			if(vm.message === '') {
				console.error("Please add comment message");
				return;
			}

			var messageData = {
				attachments: vm.commentAttachments,
				message: vm.message
			};

			$http.post('/saveComment', messageData)
				.success(function() {
					vm.resetForm();
					vm.fetchComments();
				});
		};

		vm.fetchComments();


	}];
})();