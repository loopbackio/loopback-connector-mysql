// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
var assert = require('assert');

var db;

function sortByOrder(a, b) {
  return a.order < b.order ? -1 : 1;
}

function createDefinition(dataType) {
  return {
    order: {
      type: Number,
    },
    pass: {
      type: Boolean,
      mysql: {
        dataType: dataType,
      },
    },
  };
}

describe('Boolean type', function() {
  var data = [
    {
      order: 0,
      pass: true,
    },
    {
      order: 1,
      pass: false,
    },
  ];

  function test(Model, done) {
    Model.create(data, function(err, result) {
      if (err) return done(err);
      assert.equal(result[0].pass, true);
      assert.equal(result[1].pass, false);

      Model.find(function(err, queryResults) {
        queryResults.sort(sortByOrder);
        assert.equal(queryResults[0].pass, true);
        assert.equal(queryResults[1].pass, false);
        done();
      });
    });
  }

  describe('Support TINYINT(1)', function() {
    var ModelDefinition = createDefinition('TINYINT(1)');
    var BooleanModel_tiny;
    before(function(done) {
      db = global.getSchema();
      BooleanModel_tiny = db.define('BooleanModel_tiny', ModelDefinition);
      db.automigrate(['BooleanModel_tiny'], done);
    });

    after(function(done) {
      BooleanModel_tiny.destroyAll(done);
    });

    it('Should work if mysql data type is TINYINT(1)', function(done) {
      test(BooleanModel_tiny, done);
    });
  });

  describe('Support CHAR(1)', function() {
    var ModelDefinition = createDefinition('CHAR(1)');
    var BooleanModel_char;
    before(function(done) {
      db = global.getSchema();
      BooleanModel_char = db.define('BooleanModel_char', ModelDefinition);
      db.automigrate(['BooleanModel_char'], done);
    });

    after(function(done) {
      BooleanModel_char.destroyAll(done);
    });

    it('Should work if mysql data type is CHAR(1)', function(done) {
      test(BooleanModel_char, done);
    });
  });

  describe('Support BIT(1)', function() {
    var ModelDefinition = createDefinition('BIT(1)');
    var BooleanModel_bit;

    before(function(done) {
      db = global.getSchema();
      BooleanModel_bit = db.define('BooleanModel_bit', ModelDefinition);
      db.automigrate(['BooleanModel_bit'], done);
    });

    after(function(done) {
      BooleanModel_bit.destroyAll(done);
    });

    it('Should work if mysql data type is BIT(1)', function(done) {
      test(BooleanModel_bit, done);
    });
  });
});
