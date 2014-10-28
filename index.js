module.exports = function PinItNode(options) {

    var async = require('async'),
        r = require('request'),
        request;

    if (typeof options.requestDefaults === 'object') {request = r.defaults(options.requestDefaults);} 
    else {request = r.defaults({});}

    var debug = options.debug || false,
        username = options.username,
        userurl = options.userurl,
        password = options.password,

        boardId,
        boardurl,
        boardCategory,
        boardPrivacy,
        boardIdList = [],
        boardNameList = [],

        pinId,
        url,
        description,
        media,

        csrfToken = '',
        cookieJar = r.jar();

    function _log(obj) {
        if (debug) {
            console.log(obj);
        }
    }//_log

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
                    var cookieHeader = response.headers['set-cookie'][i];
                    _log('COOKIE ' + i + ': ' + cookieHeader);

                    // Get csrf token
                    var matches = cookieHeader.match(/csrftoken=([a-zA-Z0-9]+);/);
                    if (matches && matches[1]) {
                        csrfToken = matches[1];
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
    }//_getLoginPageCSRF

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
    }//_doLogin

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
    }//_getNewCSRFForPinning

    function _getBoardId(cb) {

        if(boardId){
            cb(null);
            return
        };

        _log('_getBoard');
        request({
            method: 'GET',
            url: 'http://www.pinterest.com/' + userurl,
            headers: {
                'Host': 'www.pinterest.com',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            },
            gzip: true,
            jar: cookieJar
        }, function(error3, response3, body3) {

            if(boardId){
                return;
            }

            if (!error3 && response3.statusCode == 200) {
                    _log('SUCCESS: _getBoardId');
            } else {
                _log('! ERROR: _getBoardId');
                _log(error3);
                _log(response3.statusCode);
                _log(body3);
                cb(new Error('Unable to get Board Id'));
                return;
            }

            var idLocation = _getIndicesOf("board_id", body3.toString(), false);
            var nameLocation = _getIndicesOf('<a href="', body3.toString(), false);

            for(var i=1; i<(idLocation.length/3); i++){
                boardIdList[i-1] = body3.toString().substring(idLocation[i*3]+12, idLocation[i*3]+30);
                if(boardIdList[i-1] === boardIdList[i-2]){
                    boardIdList.splice(i-1, 1);
                }
            }

            boardIdList = boardIdList.filter(function(n){ return n != undefined });

            for(var j=7; j<(nameLocation.length-3); j++){
                boardNameList[j-7] = body3.toString().substring((nameLocation[j]+11+userurl.length), (nameLocation[j]+50)).split('/')[0];
                if(boardNameList[j-7] == boardurl){
                    boardId = boardIdList[j-7];
                }
            }

            cb(null);
            return;


            function _getIndicesOf(searchStr, str, caseSensitive) {
                var startIndex = 0, searchStrLen = searchStr.length;
                var index, indices = [];
                if (!caseSensitive) {
                    str = str.toLowerCase();
                    searchStr = searchStr.toLowerCase();
                }
                while ((index = str.indexOf(searchStr, startIndex)) > -1) {
                    indices.push(index);
                    startIndex = index + searchStrLen;
                }
                return indices;
            }//_getIndicesOf
        });//function
    }//_getBoardId

    function _createPin(cb) {
        _log('_createPin');
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
                _log('SUCCESS: _createPin');
                cb(null, body3);
                return;
            } else if(!boardId){
                _log('! ERROR: _createPin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('board Id undefined.  Please check that your boardurl is correct and that your board is public.'));
                return;
            } else {
                _log('! ERROR: _createPin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('Unknown error occurred while pinning'));
                return;
            }
        });
    }


    function _deletePin(cb) {
        _log('_deletePin');
        request({
            method: 'POST',
            url: 'http://www.pinterest.com/resource/PinResource/delete/',
            headers: {
                'Host': "www.pinterest.com",
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-length': '220',
                'Referer': 'http://www.pinterest.com/' + userurl + '/' + boardurl + '/',
                'Connection': 'keep-alive',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            gzip: true,
            form: {
                source_url: '/' + userurl + '/' + boardurl + '/',
                data: '{"options":{"id":"' + pinId +'"},"context":{}}',
                module_path: 'Modal()>ConfirmDialog(ga_category=pin_delete,+template=delete_pin)' 
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _deletePin');
                cb(null, body3);
                return;
            } else if(!boardId){
                _log('! ERROR: _createPin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('board Id undefined.  Please check that your boardurl is correct and that your board is public.'));
                return;
            } else {
                _log('! ERROR: _deletePin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('Unknown error occurred while deleting pin'));
                return;
            }
        });
    }//_deletePin

    function _updatePin(cb) {
        _log('_updatePin');
        request({
            method: 'POST',
            url: 'http://www.pinterest.com/resource/PinResource/update/',
            headers: {
                'Host': "www.pinterest.com",
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                //'Content-length': '220',
                'Referer': 'http://www.pinterest.com/' + userurl + '/' + boardurl + '/',
                'Connection': 'keep-alive',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            gzip: true,
            form: {
                source_url: '/'+ userurl + '/' + boardurl + '/',
                data: '{"options":{"board_id":"' + boardId + '","description":"' + description + '","link":"' + url + '","id":"' + pinId + '"},"context":{}}',
                module_path: 'App()>BoardPage(resource=BoardResource(username=' + userurl + ',+slug=' + boardurl +'))>Grid(resource=BoardFeedResource(board_id=' + boardId + ',+board_url=/' + userurl + '/' + boardurl +'/' + ',+page_size=null,+prepend=true,+access=write,delete,+board_layout=default))>GridItems(resource=BoardFeedResource(board_id=' + boardId + ',+board_url=/' + userurl + '/'+ boardurl + '/,+page_size=null,+prepend=true,+access=write,delete,+board_layout=default))>Pin(resource=PinResource(id='+ pinId +'))>ShowModalButton(module=PinEdit)#Modal(module=PinEdit(resource=PinResource(id=' + pinId + ')))' 
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _updatePin');
                cb(null, body3);
                return;
            } else if(!boardId){
                _log('! ERROR: _createPin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('board Id undefined.  Please check that your boardurl is correct and that your board is public.'));
                return;
            } else {
                _log('! ERROR: _updatePin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('Unknown error occurred while updating pin'));
                return;
            }
        });
    }//_updatePin

    function _createBoard(cb) {
        _log('_createBoard');
        request({
            method: 'POST',
            url: 'http://www.pinterest.com/resource/BoardResource/create/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/' + userurl + '/',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            gzip: true,
            form: {
                source_url: '/' + userurl +'/',
                data: '{"options":{"name":"' + boardName + '","category":"'+ boardCategory +'","description":"' + description + '","privacy":"' + boardPrivacy + '","layout":"default"},"context":{}}',
                module_path: 'App()>UserProfilePage(resource=UserResource(username=' + userurl + ', invite_code=null))>UserProfileContent(resource=UserResource(username=' + userurl + ', invite_code=null))>UserBoards()>Grid(resource=ProfileBoardsResource(username=' + userurl + '))>GridItems(resource=ProfileBoardsResource(username=' + userurl + '))>BoardCreateRep(submodule=[object Object], ga_category=board_create)#Modal(module=BoardCreate()'
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _createBoard');
                cb(null, body3);
                return;
            } else {
                _log('! ERROR: _createBoard');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('Unknown error occurred while creating board'));
                return;
            }
        });
    }//_createBoard

    function _deleteBoard(cb) {
        _log('_deleteBoard');
        request({
            method: 'POST',
            url: 'http://www.pinterest.com/resource/BoardResource/delete/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/' + userurl + '/' + boardurl + '/',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            gzip: true,
            form: {
                source_url: '/' + userurl +'/' + boardurl + '/',
                data: '{"options":{"board_id":"' + boardId + '"},"context":{}}',
                module_path: 'Modal()>ConfirmDialog(template=delete_board)'
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _deleteBoard');
                cb(null, body3);
                return;
            } else if(!boardId){
                _log('! ERROR: _createPin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('board Id undefined.  Please check that your boardurl is correct and that your board is public.'));
                return;
            } else {
                _log('! ERROR: _deleteBoard');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('Unknown error occurred while deleting board'));
                return;
            }
        });
    }//_deleteBoard

    function _updateBoard(cb) {
        _log('_updateBoard');
        request({
            method: 'POST',
            url: 'http://www.pinterest.com/resource/BoardResource/update/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken,
                'X-NEW-APP': '1',
                'X-APP-VERSION': '6757f6e',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/userurl/',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            gzip: true,
            form: {
                source_url: '/' + userurl +'/' + boardurl + '/',
                data: '{"options":{"name":"'+ boardName +'","category":"'+ boardCategory + '","description":"'+ description +'","layout":"default","board_id":"' + boardId + '"},"context":{}}',
                module_path: 'App()>BoardPage(resource=BoardResource(username='+ userurl + ',+slug=' + boardurl + '))>BoardHeader(resource=BoardResource(board_id=' + boardId + '))>BoardInfoBar(resource=BoardResource(board_id=' + boardId + '))>ShowModalButton(module=BoardEdit)#Modal(module=BoardEdit(resource=BoardResource(board_id=' + boardId + ')))'
            },
            jar: cookieJar
        }, function(error3, response3, body3) {
            if (!error3 && response3.statusCode == 200) {
                _log('SUCCESS: _updateBoard');
                cb(null, body3);
                return;
            } else if(!boardId){
                _log('! ERROR: _createPin');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('board Id undefined.  Please check that your boardurl is correct and that your board is public.'));
                return;
            } else {
                _log('! ERROR: _updateBoard');
                _log(error3);
                _log(response3.statusCode);
                // _log(body3);
                cb(new Error('Unknown error occurred while updating board'));
                return;
            }
        });
    }//_updateBoard

    return {
        /**
         * Pins an item to a board
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *  boardurl: 'kens-board'
         *	boardId: '12345',
         *	url: 'http://www.kengoldfarb.com',
         *	description: 'an #awesome site',
         *	media: 'http://www.kengoldfarb.com/images/pin-it.png'
         * }
         *
         */
        createPin: function createPin(params, cb) {

            boardurl = params.boardurl;
            boardId = params.boardId;

            url = params.url;
            description = params.description;
            media = params.media;

            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getNewCSRFForPinning,
                _getBoardId,
                _createPin
                ], function(err, results) {
                    if (err) {
                        if (typeof cb === 'function') {
                        cb(err);
                        }
                        return;
                    }
                    if (typeof cb === 'function') {
                        // See if we have an object response
                        if(results && results[4]) {
                            cb(null, results[4]);
                    }else{
                        _log('Warning: No object result. Something might have gone wrong');
                        cb(null);
                    }
                }
            });
        },

        /**
         * unpins an item from a board
         * example board url: "http://www.pinterest.com/kentester24/test-board/
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *	pinId: '12345',
         *
         *	boardurl: 'test-board'
         *  boardId: '123'
         * }
         *
         */
        deletePin: function deletePin(params, cb) {
            pinId = params.pinId;

            boardurl = params.boardurl;
            boardId = params.boardId;

            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getBoardId,
                _getNewCSRFForPinning,
                _deletePin
            ], function(err, results) {
                if (err) {
                    if (typeof cb === 'function') {
                        cb(err);
                    }
                    return;
                }

                if (typeof cb === 'function') {
                    // See if we have an object response
                    if(results && results[4]) {
                        cb(null, results[4]);
                    }else{
                        _log('Warning: No object result.  Something might have gone wrong');
                        cb(null);
                    }
                }
            });
        },//deletePin

        /**
         * Updates a pin on a board
         * example board url: "http://www.pinterest.com/kentester24/test-board/
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *	boardId: '12345',
         *  boardurl: 'test-board',            //the location of the board on pinterest
         *
         *  pinId: '134564',
         *	url: 'http://www.kengoldfarb.com',  //url the pin links to
         *	description: 'an #awesome site',
         * }
         *
         */
        updatePin: function updatePin(params, cb) {
        	boardId = params.boardId; //optional
            boardurl = params.boardurl;

            pinId = params.pinId;
            url = params.url;
            description = params.description;

            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getNewCSRFForPinning,
                _getBoardId,
                _updatePin
            ], function(err, results) {
                if (err) {
                    if (typeof cb === 'function') {
                        cb(err);
                    }
                    return;
                }

                if (typeof cb === 'function') {
                    // See if we have an object response
                    if(results && results[4]) {
                        cb(null, results[4]);
                    }else{
                        _log('Warning: No object result.  Something might have gone wrong');
                        cb(null);
                    }
                }
            });
        },//updatePin

        /**
         * Creates a Board
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *  boardName: 'Test Board',
         *  description: 'an #awesome board of epic proportions',
         *  boardCategory:  'Animals',  //Limited options, check README for list
         *  boardPrivacy:  'Public'     //or 'Private'
         * }
         *
         */
       createBoard: function createBoard(params, cb) {
            boardName = params.boardName;
            description = params.description;
            boardCategory = params.boardCategory;
            boardPrivacy = params.boardPrivacy;

            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getNewCSRFForPinning,
                _createBoard
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
       },//createBoard
        
        /**
         * Deletes a Board
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *  boardurl: 'TestBoard',
         *  boardId: '12345',
         * }
         *
         */
       deleteBoard: function deleteBoard(params, cb) {
            boardurl = params.boardurl;
            boardId = params.boardId;


            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getNewCSRFForPinning,
                _getBoardId,
                _deleteBoard
            ], function(err, results) {
                if (err) {
                    if (typeof cb === 'function') {
                        cb(err);
                    }
                    return;
                }

                if (typeof cb === 'function') {
                    // See if we have an object response
                    if(results && results[4]) {
                        cb(null, results[4]);
                    }else{
                        _log('Warning: No object result.  Something might have gone wrong');
                        cb(null);
                    }
                }
            });
       },//deleteBoard

        /**
         * Updates a Board
         *
         * Request parameters:
         * 'params' - an object containing the parameters for pinning:
         * {
         *  boardurl: 'TestBoard',
         *  boardId: '12345',
         *  description: 'an #awesome board of epic proportions',
         *  boardCategory:  'Animals',  //Limited options, check README for list
         *  boardPrivacy:  'Public' //or 'Private'
         * }
         *
         */
       updateBoard: function updateBoard(params, cb) {
            boardurl = params.boardurl;
            boardId = params.boardId;

            boardName = params.boardName;
            description = params.description;
            boardCategory = params.boardCategory;
            boardPrivacy = params.boardPrivacy;

            // Do it!
            async.series([
                _getLoginPageCSRF,
                _doLogin,
                _getNewCSRFForPinning,
                _getBoardId,
                _updateBoard
            ], function(err, results) {
                if (err) {
                    if (typeof cb === 'function') {
                        cb(err);
                    }
                    return;
                }

                if (typeof cb === 'function') {
                    // See if we have an object response
                    if(results && results[4]) {
                        cb(null, results[4]);
                    }else{
                        _log('Warning: No object result.  Something might have gone wrong');
                        cb(null);
                    }
                }
            });
       },//updateBoard
    }; //return
}; //module



