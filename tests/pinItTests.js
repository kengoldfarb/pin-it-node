var fs = require('fs');
var _ = require('lodash');
// var expect = require('chai').expect;
var assert = require('chai').assert;
var PinIt = require('pin-it-node');

describe('pin it', function () {
	this.timeout(15000);
	it('should be able to pin with valid username, password, and boardId', function(done) {
		var pinIt = new PinIt({
		    username: 'myUser@name.com',
		    password: 'mySuperSecretPassword' // Replace username, password, and boardId below with your actual credentials
		});

		pinIt.pin({
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
				console.log(pinObj);
				done();
			}
		})
	});
});
