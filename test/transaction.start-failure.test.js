// Copyright IBM Corp. 2026. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
const should = require('should');
const sinon = require('sinon');

describe('transaction start failure', function() {
  let db;

  // A fresh pool per test, so a leak in one test cannot fail the next one.
  beforeEach(function(done) {
    db = global.getDataSource({connectionLimit: 1});
    db.once('connected', function() {
      done();
    });
  });

  afterEach(function() {
    sinon.restore();
    // Not awaited: before the fix a leaked connection keeps pool.end() open.
    db.disconnect(function() {});
  });

  it('returns the connection when SET TRANSACTION ISOLATION LEVEL fails',
    function(done) {
      this.timeout(10000);
      // More failed starts than the pool has connections: without the release,
      // the last one and the query after it wait for ever.
      let pending = 3;
      for (let i = 0; i < 3; i++) {
        db.connector.beginTransaction('NOT A LEVEL', function(err, connection) {
          should.exist(err);
          should.not.exist(connection);
          if (--pending === 0) {
            db.connector.execute('SELECT 1 AS ok', [], function(err, rows) {
              if (err) return done(err);
              rows[0].ok.should.equal(1);
              done();
            });
          }
        });
      }
    });

  function failBegin(isolationLevel, done) {
    const pool = db.connector.client;
    const getConnection = pool.getConnection.bind(pool);
    // BEGIN cannot be made to fail on a healthy server, so the next pooled
    // connection's beginTransaction is replaced for this one call.
    const stub = sinon.stub(pool, 'getConnection').callsFake(function(cb) {
      stub.restore();
      getConnection(function(err, connection) {
        if (err) return cb(err);
        sinon.stub(connection, 'beginTransaction').callsFake(function(next) {
          next(new Error('BEGIN refused'));
        });
        cb(null, connection);
      });
    });
    db.connector.beginTransaction(isolationLevel, function(err, connection) {
      should.exist(err);
      err.message.should.equal('BEGIN refused');
      should.not.exist(connection);
      // One connection in the pool: this query only runs if the failed start
      // gave it back.
      db.connector.execute('SELECT 1 AS ok', [], function(err, rows) {
        if (err) return done(err);
        rows[0].ok.should.equal(1);
        done();
      });
    });
  }

  it('returns the connection when BEGIN fails after SET', function(done) {
    this.timeout(10000);
    failBegin('READ COMMITTED', done);
  });

  it('returns the connection when BEGIN fails without an isolation level',
    function(done) {
      this.timeout(10000);
      failBegin(undefined, done);
    });
});
