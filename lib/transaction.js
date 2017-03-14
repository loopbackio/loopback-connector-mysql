// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var debug = require('debug')('loopback:connector:mysql:transaction');
module.exports = mixinTransaction;

/*!
 * @param {MySQL} MySQL connector class
 * @param {Object} mysql mysql driver
 */
function mixinTransaction(MySQL, mysql) {
  /**
   * Begin a new transaction
   * @param isolationLevel
   * @param cb
   */
  MySQL.prototype.beginTransaction = function(isolationLevel, cb) {
    debug('Begin a transaction with isolation level: %s', isolationLevel);
    this.client.getConnection(function(err, connection) {
      if (err) return cb(err);
      if (isolationLevel) {
        connection.query(
          'SET SESSION TRANSACTION ISOLATION LEVEL ' + isolationLevel,
          function(err) {
            if (err) return cb(err);
            connection.beginTransaction(function(err) {
              if (err) return cb(err);
              return cb(null, connection);
            });
          });
      } else {
        connection.beginTransaction(function(err) {
          if (err) return cb(err);
          return cb(null, connection);
        });
      }
    });
  };

  /**
   *
   * @param connection
   * @param cb
   */
  MySQL.prototype.commit = function(connection, cb) {
    debug('Commit a transaction');
    connection.commit(function(err) {
      connection.release();
      cb(err);
    });
  };

  /**
   *
   * @param connection
   * @param cb
   */
  MySQL.prototype.rollback = function(connection, cb) {
    debug('Rollback a transaction');
    connection.rollback(function(err) {
      connection.release();
      cb(err);
    });
  };
}
