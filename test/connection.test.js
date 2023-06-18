// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
const assert = require('assert');
const should = require('should');
const DataSource = require('loopback-datasource-juggler').DataSource;
const mysqlConnector = require('../');
const url = require('url');

let db, DummyModel, odb, config;

describe('connections', function() {
  before(function() {
    require('./init.js');

    config = global.getConfig();

    odb = global.getDataSource({collation: 'utf8_general_ci',
      createDatabase: true});
    db = odb;
  });

  it('should pass with valid settings', function(done) {
    const db = new DataSource(mysqlConnector, config);
    db.ping(done);
  });

  it('ignores all other settings when url is present', function(done) {
    const formatedUrl = generateURL(config);
    const dbConfig = {
      url: formatedUrl,
      host: 'invalid-hostname',
      port: 80,
      database: 'invalid-database',
      username: 'invalid-username',
      password: 'invalid-password',
    };

    const db = new DataSource(mysqlConnector, dbConfig);
    db.ping(done);
  });

  it('should use utf8 charset', function(done) {
    const test_set = /utf8mb4/;
    const test_collo = /utf8mb4_0900_ai_ci/;
    const test_set_str = 'utf8mb4';
    const test_set_collo = 'utf8mb4_0900_ai_ci';
    charsetTest(test_set, test_collo, test_set_str, test_set_collo, done);
  });

  it('should disconnect first db', function(done) {
    db.disconnect(function() {
      odb = global.getDataSource();
      done();
    });
  });

  it('should disconnect then connect and ORM should work', function() {
    const ds = new DataSource(mysqlConnector, config);
    const Student = ds.define('Student', {
      name: {type: String, length: 255},
      age: {type: Number},
    }, {
      forceId: false,
    });

    return ds.connect()
      .then(function(err) {
        should.not.exist(err);
        return ds.automigrate(['Student']);
      })
      .then(function(err) {
        should.not.exist(err);
        should(ds.connected).be.True();
        return ds.disconnect();
      })
      .then(function(err) {
        should.not.exist(err);
        should(ds.connected).be.False();
        return ds.connect();
      })
      .then(function(err) {
        should.not.exist(err);
        should(ds.connected).be.True();
        return Student.count();
      })
      .then(function(count) {
        should(count).be.a.Number();
        return ds.disconnect();
      });
  });

  it('should use latin1 charset', function(done) {
    const test_set = /latin1/;
    const test_collo = /latin1_general_ci/;
    const test_set_str = 'latin1';
    const test_set_collo = 'latin1_general_ci';
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
      const dbConfig = {
        host: '127.0.0.1',
        port: 4,
        lazyConnect: true,
      };
      const ds = new DataSource(mysqlConnector, dbConfig);

      const errTimeout = setTimeout(function() {
        done();
      }, 2000);
      ds.on('error', function(err) {
        clearTimeout(errTimeout);
        done(err);
      });
    });

    it('should report connection error (lazyConnect = false)', function(done) {
      const dbConfig = {
        host: '127.0.0.1',
        port: 4,
        lazyConnect: false,
      };
      const ds = new DataSource(mysqlConnector, dbConfig);

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
      db = global.getDataSource({collation: test_set_collo,
        createDatabase: true});
      DummyModel = db.define('DummyModel', {string: String});
      db.automigrate(function() {
        const q = 'SELECT DEFAULT_COLLATION_NAME' +
          ' FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ' +
          db.driver.escape(db.settings.database) + ' LIMIT 1';
        db.connector.execute(q, function(err, r) {
          assert.ok(!err);
          should(r[0].DEFAULT_COLLATION_NAME).match(test_collo);
          db.connector.execute('SHOW VARIABLES LIKE "character_set%"', function(err, r) {
            assert.ok(!err);
            let hit_all = 0;
            for (const result in r) {
              hit_all += matchResult(r[result], 'character_set_connection', test_set);
              hit_all += matchResult(r[result], 'character_set_database', test_set);
              hit_all += matchResult(r[result], 'character_set_results', test_set);
              hit_all += matchResult(r[result], 'character_set_client', test_set);
            }
            assert.equal(hit_all, 4);
          });
          db.connector.execute('SHOW VARIABLES LIKE "collation%"', function(err, r) {
            assert.ok(!err);
            let hit_all = 0;
            for (const result in r) {
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

function query(sql, cb) {
  odb.connector.execute(sql, cb);
}

function generateURL(config) {
  const urlObj = {
    protocol: 'mysql',
    auth: config.username || '',
    hostname: config.host,
    pathname: config.database,
    slashes: true,
  };
  if (config.password) {
    urlObj.auth += ':' + config.password;
  }
  const formatedUrl = url.format(urlObj);
  return formatedUrl;
}
