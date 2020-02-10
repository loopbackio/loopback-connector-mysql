// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var setHttpCode = require('../lib/set-http-code');
var should = require('./init.js');

describe('setHttpCode', function() {
  describe('should set statusCode', function() {
    testErrorCode('404 on db not found', 'ER_DB_DROP_EXISTS: Nope', 404);
    testErrorCode('404 on table not found', 'ER_BAD_TABLE_ERROR: Nope', 404);

    testErrorCode('422 on duplicates', 'ER_DUP_ENTRY: Duplicate entry', 422);
    testErrorCode('422 on cannot create db', 'ER_CANT_CREATE_DB: Oops', 422);
    testErrorCode('422 on db already exists', 'ER_DB_CREATE_EXISTS: Oops', 422);
    testErrorCode('422 on db not found', 'ER_TABLE_EXISTS_ERROR: Nope', 422);

    testErrorCode('500 on unknown errors', 'FATAL: Sadness happened', 500);

    function testErrorCode(name, msg, expected) {
      it(name, function() {
        var err = new Error(msg);
        err = setHttpCode(err);
        should.exist(err.statusCode);
        should.equal(err.statusCode, expected);
      });
    }
  });
  it('should do nothing without error', function() {
    should.doesNotThrow(setHttpCode);
  });

  it('should convert strings to errors', function() {
    var err = 'REALLY_BAD: Something truly awful occurred.';
    err = setHttpCode(err);
    should.exist(err.statusCode);
    should(err instanceof Error);
    should.equal(err.statusCode, 500);
  });
});
