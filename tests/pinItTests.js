var fs = require('fs');
var _ = require('lodash');
// var expect = require('chai').expect;
var assert = require('chai').assert;
var PinIt = require('pin-it-node');

var pinIt = new PinIt({
	// Replace username, password, and boardId below with your actual credentials
    username: 'myUser@name.com',
    password: 'mySuperSecretPassword',
    userurl: 'kentester24',
    debug: false
    // ,
    // requestDefaults: {
    //     proxy:'http://127.0.0.1:8888',
    //     strictSSL: false
    // }
});

var testData = {};
var boardId;
var boardUrl;

describe('pin it', function () {
	this.timeout(15000);

	it('should be able to pin with valid username, password, and boardId', function(done) {
		pinIt.createPin({
		    boardId: '294704438055170924', // The boardId for http://www.pinterest.com/kentester24/test-board/
		    url: 'http://kengoldfarb.com', // The click back link from pinterest
		    description: 'Ken Goldfarb',
		    media: 'http://www.gravatar.com/avatar/58f58b2ed19f28b30f8deca0e9a1c3b9' // The actual image that will be pinned
		}, function(err, pinObj) {
			assert.isNull(err);
			assert.isObject(pinObj);

		    if(err) {
		        // Uh-oh...handle the error
				console.log('Error occurred while pinning');
		        console.log(err);
				done();
		    }else{
				console.log('Success!  New pin has been added to the board.');
				// console.log(pinObj);
				testData.pinId = pinObj.resource_response.data.id;
				done();
			}
		})
	});


	it('should be able to create a board', function(done) {
		pinIt.createBoard({
		    boardName: 'Ken\'s Awesome Board 4',
		    description: 'an #awesome board of epic proportions',
		    boardCategory:  'geek',  //Limited options, check README for list
		    boardPrivacy:  'public'     //refer to privacy section if you plan to make a board secret.

		}, function(err, pinObj) {
			assert.isNull(err);

		    assert.isObject(pinObj);
		    boardId = pinObj.resource_response.data.id;
		    boardUrl = pinObj.resource_response.data.id;
		    assert.isString(boardId);
		    console.log('Success!  The board has been created.');
		    done();
		});
	});

	it('should be able to delete a board', function(done) {
		pinIt.deleteBoard({
			boardId: boardId
		}, function(err, pinObj) {
			if(err) {
				// Uh-oh...handle the error
				console.log(err);
				return;
			}
			assert.isNull(err);
			assert.isObject(pinObj);
			console.log('Success!  The board has been deleted.');
			// console.log(pinObj);
			done();
		})
	});

	it('should be able to delete a pin', function(done) {
		pinIt.deletePin({
		    pinId: testData.pinId 

		}, function(err, pinObj) {
		    assert.isNull(err);
			assert.isObject(pinObj);

		    if(err) {
		        // Uh-oh...handle the error
				console.log('Error occurred while deleting a pin');
		        console.log(err);
				done();
		    }else{
				console.log('Success!  Pin deleted');
				// console.log(pinObj);
				done();
			}
		})
	});

	// Use board url instead of boardId
	// it('should be able to pin with valid username, password, and board-url', function(done) {
	// 	pinIt.createPin({
	// 	    // boardId: '294704438055170924', // The boardId for http://www.pinterest.com/kentester24/test-board/
	// 	    boardurl: 'test-board',
	// 	    url: 'http://kengoldfarb.com', // The click back link from pinterest
	// 	    description: 'Ken Goldfarb',
	// 	    media: 'http://www.gravatar.com/avatar/58f58b2ed19f28b30f8deca0e9a1c3b9' // The actual image that will be pinned
	// 	}, function(err, pinObj) {
	// 		assert.isNull(err);
	// 		assert.isObject(pinObj);

	// 	    if(err) {
	// 	        // Uh-oh...handle the error
	// 			console.log('Error occurred while pinning');
	// 	        console.log(err);
	// 			done();
	// 	    }else{
	// 			console.log('Success!  New pin has been added to the board.');
	// 			// console.log(pinObj);
	// 			testData.pinId = pinObj.resource_response.data.id;
	// 			done();
	// 		}
	// 	})
	// });
});
