module.exports = function PinItNode(options) {

    var async = require('async');
    var r = require('request');
    var request;

    if (typeof options.requestDefaults === 'object') {
        request = r.defaults(options.requestDefaults);
    } else {
        request = r.defaults({});
    }

    var debug = options.debug || false;

    var username = options.username;
    var password = options.password;

    var boardId;
    var url;
    var description;
    var media;

    var csrfToken = '';
    var cookieJar = r.jar();

    function _log(obj) {
        if (debug) {
            console.log(obj);
        }
    }

    function _getLoginPageCSRF(cb) {
        _log('_getLoginPageCSRF');
        request({
            url: 'https://www.pinterest.com/login/',
            headers: {

            },
            jar: cookieJar
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                for (var i in response.headers['set-cookie']) {

	                if (csrfToken == '') {
		                var cookieHeader = response.headers['set-cookie'][i];
		                _log('COOKIE ' + i + ': ' + cookieHeader);
		                // Get csrf token
		                var matches = cookieHeader.match(/csrftoken=([a-zA-Z0-9]+);/);
		                if (matches && matches[1]) {
			                csrfToken = matches[1];
		                }
	                }
                }

                var cookies = cookieJar.getCookieString('https://www.pinterest.com');

                _log('CSRF Token: ' + csrfToken);
                _log('SUCCESS: _getLoginPageCSRF');
                cb(null);
                return;
            } else {
                _log('! ERROR: _getLoginPageCSRF');
                cb(new Error('Non 200 error code returned: ' + response.statusCode));
                return;
            }
        });
    }

    function _doLogin(cb) {
        _log('_doLogin');
        request({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/UserSessionResource/create/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/login/',
                'Accept-Encoding': 'gzip,deflate,sdch',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            form: {
                source_url: '/login/',
                data: '{"options":{"username_or_email":"' + username + '","password":"' + password + '"},"context":{}}',
                module_path: 'App()>LoginPage()>Login()>Button(class_name=primary, text=Log In, type=submit, size=large)'
            },
            jar: cookieJar
        }, function(error2, response2, body2) {
            if (!error2 && response2.statusCode == 200) {
                _log('SUCCESS: _doLogin');
                cb(null);
                return;
            } else {
                _log('! ERROR: _doLogin');
                _log(error2);
                _log('Status code: ' + response2.statusCode);
                _log(body2);
                cb(error2);
                return;
            }
        });
    }

    function _getNewCSRFForPinning(cb) {
        _log('_getNewCSRFForPinning');
        request({
            method: 'GET',
            url: 'http://www.pinterest.com/pin/create/button/?url=' + url + '&description=' + description + '&media=' + media,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://www.pinterest.com/login/',
                'Accept-Encoding': 'gzip,deflate,sdch',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _getNewCSRFForPinning');
            } else {
                _log('! ERROR: _getNewCSRFForPinning');
                _log(error3);
                _log(response3.statusCode);
                _log(body3);
                cb(new Error('Unable to get pinning CSRF Token'));
                return;
            }


            var cookies = cookieJar.getCookieString('https://www.pinterest.com');

            var matches = cookies.match(/csrftoken=([a-zA-Z0-9]+);/);
            if (matches && matches[1]) {
                csrfToken = matches[1];
            } else {
                // Error!
                _log('couldn\'t extract csrf token from cookies: _getNewCSRFForPinning');
                cb(new Error('Unable to get pinning CSRF Token'));
                return;
            }

            _log('NEW CSRF:' + csrfToken);
            cb(null);
            return;
        });
    }

    function _pinIt(cb) {
        _log('_pinIt');
        request({
            method: 'POST',
            url: 'http://www.pinterest.com/resource/PinResource/create/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/login/',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            gzip: true,
            form: {
                source_url: '/pin/create/button/?url=' + url + '&description=' + description + '&media=' + media,
                data: '{"options":{"board_id":"' + boardId + '","description":"' + description + '","link":"' + url + '","image_url":"' + media + '","method":"button","is_video":null},"context":{}}',
                module_path: 'App()>PinBookmarklet()>PinCreate()>PinForm(description=' + description + ', default_board_id="", show_cancel_button=true, cancel_text=Close, link=' + url + ', show_uploader=false, image_url=' + media + ', is_video=null, heading=Pick a board, pin_it_script_button=true)'
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _pinIt');
                cb(null, body3);
                return;
            } else {
                _log('! ERROR: _pinIt');
                _log(error3);
                _log(response3.statusCode);
                _log(body3);
                cb(new Error('Unknown error occurred while pinning'));
                return;
            }
        });
    }

    return {
        /**
         * Pins an item to a board
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *	boardId: '12345',
         *	url: 'http://www.kengoldfarb.com',
         *	description: 'an #awesome site',
         *	media: 'http://www.kengoldfarb.com/images/pin-it.png'
         * }
         *
         */
        pin: function pin(params, cb) {
            boardId = params.boardId;
            url = params.url;
            description = params.description;
            media = params.media;

            // Validate parameters
            // TODO

            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getNewCSRFForPinning,
                _pinIt
            ], function(err, results) {
                if (err) {
                    if (typeof cb === 'function') {
                        cb(err);
                    }
                    return;
                }

                if (typeof cb === 'function') {
                    // See if we have an object response
                    if(results && results[3]) {
                        cb(null, results[3]);
                    }else{
                        _log('Warning: No object result.  Something might have gone wrong');
                        cb(null);
                    }
                }
            });
        }
    };
};
