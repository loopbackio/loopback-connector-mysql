// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
var assert = require('assert');
var should = require('should');
var DataSource = require('loopback-datasource-juggler').DataSource;
var mysqlConnector = require('../');
var url = require('url');

var db, DummyModel, odb, config;

describe('connections', function() {
  before(function() {
    require('./init.js');

    config = global.getConfig();

    odb = getDataSource({collation: 'utf8_general_ci', createDatabase: true});
    db = odb;
  });

  it('should pass with valid settings', function(done) {
    var db = new DataSource(mysqlConnector, config);
    db.ping(done);
  });

  it('ignores all other settings when url is present', function(done) {
    var formatedUrl = generateURL(config);
    var dbConfig = {
      url: formatedUrl,
      host: 'invalid-hostname',
      port: 80,
      database: 'invalid-database',
      username: 'invalid-username',
      password: 'invalid-password',
    };

    var db = new DataSource(mysqlConnector, dbConfig);
    db.ping(done);
  });

  it('should use utf8 charset', function(done) {
    var test_set = /utf8/;
    var test_collo = /utf8_general_ci/;
    var test_set_str = 'utf8';
    var test_set_collo = 'utf8_general_ci';
    charsetTest(test_set, test_collo, test_set_str, test_set_collo, done);
  });

  it('should disconnect first db', function(done) {
    db.disconnect(function() {
      odb = getDataSource();
      done();
    });
  });

  it('should use latin1 charset', function(done) {
    var test_set = /latin1/;
    var test_collo = /latin1_general_ci/;
    var test_set_str = 'latin1';
    var test_set_collo = 'latin1_general_ci';
    charsetTest(test_set, test_collo, test_set_str, test_set_collo, done);
  });

  it('should drop db and disconnect all', function(done) {
    db.connector.execute('DROP DATABASE IF EXISTS ' + db.settings.database, function(err) {
      db.disconnect(function() {
        done();
      });
    });
  });

  describe('lazyConnect', function() {
    it('should skip connect phase (lazyConnect = true)', function(done) {
      var dbConfig = {
        host: '127.0.0.1',
        port: 4,
        lazyConnect: true,
      };
      var ds = new DataSource(mysqlConnector, dbConfig);

      var errTimeout = setTimeout(function() {
        done();
      }, 2000);
      ds.on('error', function(err) {
        clearTimeout(errTimeout);
        done(err);
      });
    });

    it('should report connection error (lazyConnect = false)', function(done) {
      var dbConfig = {
        host: '127.0.0.1',
        port: 4,
        lazyConnect: false,
      };
      var ds = new DataSource(mysqlConnector, dbConfig);

      ds.on('error', function(err) {
        err.message.should.containEql('ECONNREFUSED');
        done();
      });
    });
  });
});

function charsetTest(test_set, test_collo, test_set_str, test_set_collo, done) {
  query('DROP DATABASE IF EXISTS ' + odb.settings.database, function(err) {
    assert.ok(!err);
    odb.disconnect(function() {
      db = getDataSource({collation: test_set_collo, createDatabase: true});
      DummyModel = db.define('DummyModel', {string: String});
      db.automigrate(function() {
        var q = 'SELECT DEFAULT_COLLATION_NAME' +
          ' FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ' +
          db.driver.escape(db.settings.database) + ' LIMIT 1';
        db.connector.execute(q, function(err, r) {
          assert.ok(!err);
          should(r[0].DEFAULT_COLLATION_NAME).match(test_collo);
          db.connector.execute('SHOW VARIABLES LIKE "character_set%"', function(err, r) {
            assert.ok(!err);
            var hit_all = 0;
            for (var result in r) {
              hit_all += matchResult(r[result], 'character_set_connection', test_set);
              hit_all += matchResult(r[result], 'character_set_database', test_set);
              hit_all += matchResult(r[result], 'character_set_results', test_set);
              hit_all += matchResult(r[result], 'character_set_client', test_set);
            }
            assert.equal(hit_all, 4);
          });
          db.connector.execute('SHOW VARIABLES LIKE "collation%"', function(err, r) {
            assert.ok(!err);
            var hit_all = 0;
            for (var result in r) {
              hit_all += matchResult(r[result], 'collation_connection', test_set);
              hit_all += matchResult(r[result], 'collation_database', test_set);
            }
            assert.equal(hit_all, 2);
            done();
          });
        });
      });
    });
  });
}

function matchResult(result, variable_name, match) {
  if (result.Variable_name === variable_name) {
    assert.ok(result.Value.match(match));
    return 1;
  }
  return 0;
}

var query = function(sql, cb) {
  odb.connector.execute(sql, cb);
};

function generateURL(config) {
  var urlObj = {
    protocol: 'mysql',
    auth: config.username || '',
    hostname: config.host,
    pathname: config.database,
    slashes: true,
  };
  if (config.password) {
    urlObj.auth += ':' + config.password;
  }
  var formatedUrl = url.format(urlObj);
  return formatedUrl;
}
