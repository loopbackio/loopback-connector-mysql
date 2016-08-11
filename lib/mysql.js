// Copyright IBM Corp. 2012,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var g = require('strong-globalize')();

/*!
 * Module dependencies
 */
var mysql = require('mysql');

var SqlConnector = require('loopback-connector').SqlConnector;
var ParameterizedSQL = SqlConnector.ParameterizedSQL;
var EnumFactory = require('./enumFactory').EnumFactory;

var debug = require('debug')('loopback:connector:mysql');

/**
 * @module loopback-connector-mysql
 *
 * Initialize the MySQL connector against the given data source
 *
 * @param {DataSource} dataSource The loopback-datasource-juggler dataSource
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  dataSource.driver = mysql; // Provide access to the native driver
  dataSource.connector = new MySQL(dataSource.settings);
  dataSource.connector.dataSource = dataSource;

  defineMySQLTypes(dataSource);

  dataSource.EnumFactory = EnumFactory; // factory for Enums. Note that currently Enums can not be registered.

  if (callback) {
    if (dataSource.settings.lazyConnect) {
      process.nextTick(function() {
        callback();
      });
    } else {
      dataSource.connector.connect(callback);
    }
  }
};

exports.MySQL = MySQL;

function defineMySQLTypes(dataSource) {
  var modelBuilder = dataSource.modelBuilder;
  var defineType = modelBuilder.defineValueType ?
    // loopback-datasource-juggler 2.x
    modelBuilder.defineValueType.bind(modelBuilder) :
    // loopback-datasource-juggler 1.x
    modelBuilder.constructor.registerType.bind(modelBuilder.constructor);

  // The Point type is inherited from jugglingdb mysql adapter.
  // LoopBack uses GeoPoint instead.
  // The Point type can be removed at some point in the future.
  defineType(function Point() {
  });
}

/**
 * @constructor
 * Constructor for MySQL connector
 * @param {Object} client The node-mysql client object
 */
function MySQL(settings) {
  SqlConnector.call(this, 'mysql', settings);
}

require('util').inherits(MySQL, SqlConnector);

MySQL.prototype.connect = function(callback) {
  var self = this;
  var options = generateOptions(this.settings);
  var s = self.settings || {};

  if (this.client) {
    if (callback) {
      process.nextTick(function() {
        callback(null, self.client);
      });
    }
  } else {
    this.client = mysql.createPool(options);
    this.client.getConnection(function(err, connection) {
      var conn = connection;
      if (!err) {
        if (self.debug) {
          debug('MySQL connection is established: ' + self.settings || {});
        }
        connection.release();
      } else {
        if (self.debug || !callback) {
          console.error('MySQL connection is failed: ' + self.settings || {}, err);
        }
      }
      callback && callback(err, conn);
    });
  }
};

function generateOptions(settings) {
  var s = settings || {};
  if (s.collation) {
    // Charset should be first 'chunk' of collation.
    s.charset = s.collation.substr(0, s.collation.indexOf('_'));
  } else {
    s.collation = 'utf8_general_ci';
    s.charset = 'utf8';
  }

  s.supportBigNumbers = (s.supportBigNumbers || false);
  s.timezone = (s.timezone || 'local');

  if (isNaN(s.connectionLimit)) {
    s.connectionLimit = 10;
  }

  var options;
  if (s.url) {
    // use url to override other settings if url provided
    options = s.url;
  } else {
    options = {
      host: s.host || s.hostname || 'localhost',
      port: s.port || 3306,
      user: s.username || s.user,
      password: s.password,
      timezone: s.timezone,
      socketPath: s.socketPath,
      charset: s.collation.toUpperCase(), // Correct by docs despite seeming odd.
      supportBigNumbers: s.supportBigNumbers,
      connectionLimit: s.connectionLimit,
    };

    // Don't configure the DB if the pool can be used for multiple DBs
    if (!s.createDatabase) {
      options.database = s.database;
    }

    // Take other options for mysql driver
    // See https://github.com/strongloop/loopback-connector-mysql/issues/46
    for (var p in s) {
      if (p === 'database' && s.createDatabase) {
        continue;
      }
      if (options[p] === undefined) {
        options[p] = s[p];
      }
    }
  }
  return options;
}
/**
 * Execute the sql statement
 *
 * @param {String} sql The SQL statement
 * @param {Function} [callback] The callback after the SQL statement is executed
 */
MySQL.prototype.executeSQL = function(sql, params, options, callback) {
  var self = this;
  var client = this.client;
  var debugEnabled = debug.enabled;
  var db = this.settings.database;
  if (typeof callback !== 'function') {
    throw new Error(g.f('{{callback}} should be a function'));
  }
  if (debugEnabled) {
    debug('SQL: %s, params: %j', sql, params);
  }

  var transaction = options.transaction;

  function handleResponse(connection, err, result) {
    if (!transaction) {
      connection.release();
    }
    callback && callback(err, result);
  }

  function runQuery(connection, release) {
    connection.query(sql, params, function(err, data) {
      if (debugEnabled) {
        if (err) {
          debug('Error: %j', err);
        }
        debug('Data: ', data);
      }
      handleResponse(connection, err, data);
    });
  }

  function executeWithConnection(err, connection) {
    if (err) {
      return callback && callback(err);
    }
    if (self.settings.createDatabase) {
      // Call USE db ...
      connection.query('USE ??', [db], function(err) {
        if (err) {
          if (err && err.message.match(/(^|: )unknown database/i)) {
            var charset = self.settings.charset;
            var collation = self.settings.collation;
            var q = 'CREATE DATABASE ?? CHARACTER SET ?? COLLATE ??';
            connection.query(q, [db, charset, collation], function(err) {
              if (!err) {
                connection.query('USE ??', [db], function(err) {
                  runQuery(connection);
                });
              } else {
                handleResponse(connection, err);
              }
            });
            return;
          } else {
            handleResponse(connection, err);
            return;
          }
        }
        runQuery(connection);
      });
    } else {
      // Bypass USE db
      runQuery(connection);
    }
  }

  if (transaction && transaction.connection &&
    transaction.connector === this) {
    if (debugEnabled) {
      debug('Execute SQL within a transaction');
    }
    executeWithConnection(null, transaction.connection);
  } else {
    client.getConnection(executeWithConnection);
  }
};

MySQL.prototype._modifyOrCreate = function(model, data, options, fields, cb) {
  var sql = new ParameterizedSQL('INSERT INTO ' + this.tableEscaped(model));
  var columnValues = fields.columnValues;
  var fieldNames = fields.names;
  if (fieldNames.length) {
    sql.merge('(' + fieldNames.join(',') + ')', '');
    var values = ParameterizedSQL.join(columnValues, ',');
    values.sql = 'VALUES(' + values.sql + ')';
    sql.merge(values);
  } else {
    sql.merge(this.buildInsertDefaultValues(model, data, options));
  }

  sql.merge('ON DUPLICATE KEY UPDATE');
  var setValues = [];
  for (var i = 0, n = fields.names.length; i < n; i++) {
    if (!fields.properties[i].id) {
      setValues.push(new ParameterizedSQL(fields.names[i] + '=' +
          columnValues[i].sql, columnValues[i].params));
    }
  }

  sql.merge(ParameterizedSQL.join(setValues, ','));

  this.execute(sql.sql, sql.params, options, function(err, info) {
    if (!err && info && info.insertId) {
      data.id = info.insertId;
    }
    var meta = {};
    if (info) {
        // When using the INSERT ... ON DUPLICATE KEY UPDATE statement,
        // the returned value is as follows:
        // 1 for each successful INSERT.
        // 2 for each successful UPDATE.
      meta.isNewInstance = (info.affectedRows === 1);
    }
    cb(err, data, meta);
  });
};

/**
 * Replace if the model instance exists with the same id or create a new instance
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 */
MySQL.prototype.replaceOrCreate = function(model, data, options, cb) {
  var fields = this.buildReplaceFields(model, data);
  this._modifyOrCreate(model, data, options, fields, cb);
};

/**
 * Update if the model instance exists with the same id or create a new instance
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 */
MySQL.prototype.save =
MySQL.prototype.updateOrCreate = function(model, data, options, cb) {
  var fields =  this.buildFields(model, data);
  this._modifyOrCreate(model, data, options, fields, cb);
};

function dateToMysql(val) {
  return val.getUTCFullYear() + '-' +
    fillZeros(val.getUTCMonth() + 1) + '-' +
    fillZeros(val.getUTCDate()) + ' ' +
    fillZeros(val.getUTCHours()) + ':' +
    fillZeros(val.getUTCMinutes()) + ':' +
    fillZeros(val.getUTCSeconds());

  function fillZeros(v) {
    return v < 10 ? '0' + v : v;
  }
}

MySQL.prototype.getInsertedId = function(model, info) {
  var insertedId = info && typeof info.insertId === 'number' ?
    info.insertId : undefined;
  return insertedId;
};

/*!
 * Convert property name/value to an escaped DB column value
 * @param {Object} prop Property descriptor
 * @param {*} val Property value
 * @returns {*} The escaped value of DB column
 */
MySQL.prototype.toColumnValue = function(prop, val) {
  if (val == null) {
    if (prop.autoIncrement || prop.id) {
      return new ParameterizedSQL('DEFAULT');
    }
    return null;
  }
  if (!prop) {
    return val;
  }
  if (prop.type === String) {
    return String(val);
  }
  if (prop.type === Number) {
    if (isNaN(val)) {
      // FIXME: [rfeng] Should fail fast?
      return val;
    }
    return val;
  }
  if (prop.type === Date) {
    if (!val.toUTCString) {
      val = new Date(val);
    }
    return dateToMysql(val);
  }
  if (prop.type === Boolean) {
    return !!val;
  }
  if (prop.type.name === 'GeoPoint') {
    return new ParameterizedSQL({
      sql: 'Point(?,?)',
      params: [val.lat, val.lng],
    });
  }
  if (prop.type === Object) {
    return this._serializeObject(val);
  }
  if (typeof prop.type === 'function') {
    return this._serializeObject(val);
  }
  return this._serializeObject(val);
};

MySQL.prototype._serializeObject = function(obj) {
  var val;
  if (obj && typeof obj.toJSON === 'function') {
    obj = obj.toJSON();
  }
  if (typeof obj !== 'string') {
    val = JSON.stringify(obj);
  } else {
    val = obj;
  }
  return val;
};

/*!
 * Convert the data from database column to model property
 * @param {object} Model property descriptor
 * @param {*) val Column value
 * @returns {*} Model property value
 */
MySQL.prototype.fromColumnValue = function(prop, val) {
  if (val == null) {
    return val;
  }
  if (prop) {
    switch (prop.type.name) {
      case 'Number':
        val = Number(val);
        break;
      case 'String':
        val = String(val);
        break;
      case 'Date':

        // MySQL allows, unless NO_ZERO_DATE is set, dummy date/time entries
        // new Date() will return Invalid Date for those, so we need to handle
        // those separate.
        if (val == '0000-00-00 00:00:00') {
          val = null;
        } else {
          val = new Date(val.toString().replace(/GMT.*$/, 'GMT'));
        }
        break;
      case 'Boolean':
        val = Boolean(val);
        break;
      case 'GeoPoint':
      case 'Point':
        val = {
          lat: val.x,
          lng: val.y,
        };
        break;
      case 'List':
      case 'Array':
      case 'Object':
      case 'JSON':
        if (typeof val === 'string') {
          val = JSON.parse(val);
        }
        break;
      default:
        if (!Array.isArray(prop.type) && !prop.type.modelName) {
          // Do not convert array and model types
          val = prop.type(val);
        }
        break;
    }
  }
  return val;
};

/**
 * Escape an identifier such as the column name
 * @param {string} name A database identifier
 * @returns {string} The escaped database identifier
 */
MySQL.prototype.escapeName = function(name) {
  return this.client.escapeId(name);
};

/**
 * Build the LIMIT clause
 * @param {string} model Model name
 * @param {number} limit The limit
 * @param {number} offset The offset
 * @returns {string} The LIMIT clause
 */
MySQL.prototype._buildLimit = function(model, limit, offset) {
  if (isNaN(limit)) {
    limit = 0;
  }
  if (isNaN(offset)) {
    offset = 0;
  }
  if (!limit && !offset) {
    return '';
  }
  return 'LIMIT ' + (offset ? (offset + ',' + limit) : limit);
};

MySQL.prototype.applyPagination = function(model, stmt, filter) {
  var limitClause = this._buildLimit(model, filter.limit,
    filter.offset || filter.skip);
  return stmt.merge(limitClause);
};

/**
 * Get the place holder in SQL for identifiers, such as ??
 * @param {String} key Optional key, such as 1 or id
 * @returns {String} The place holder
 */
MySQL.prototype.getPlaceholderForIdentifier = function(key) {
  return '??';
};

/**
 * Get the place holder in SQL for values, such as :1 or ?
 * @param {String} key Optional key, such as 1 or id
 * @returns {String} The place holder
 */
MySQL.prototype.getPlaceholderForValue = function(key) {
  return '?';
};

MySQL.prototype.getCountForAffectedRows = function(model, info) {
  var affectedRows = info && typeof info.affectedRows === 'number' ?
    info.affectedRows : undefined;
  return affectedRows;
};

/**
 * Disconnect from MySQL
 */
MySQL.prototype.disconnect = function(cb) {
  if (this.debug) {
    debug('disconnect');
  }
  if (this.client) {
    this.client.end(cb);
  } else {
    process.nextTick(cb);
  }
};

MySQL.prototype.ping = function(cb) {
  this.execute('SELECT 1 AS result', cb);
};

MySQL.prototype.buildExpression = function(columnName, operator, operatorValue,
    propertyDefinition) {
  if (operator === 'regexp') {
    if (operatorValue.ignoreCase)
      g.warn('{{MySQL}} {{regex}} syntax does not respect the {{`i`}} flag');

    if (operatorValue.global)
      g.warn('{{MySQL}} {{regex}} syntax does not respect the {{`g`}} flag');

    if (operatorValue.multiline)
      g.warn('{{MySQL}} {{regex}} syntax does not respect the {{`m`}} flag');

    return new ParameterizedSQL(columnName + ' REGEXP ?',
        [operatorValue.source]);
  }

  // invoke the base implementation of `buildExpression`
  return this.invokeSuper('buildExpression', columnName, operator,
      operatorValue, propertyDefinition);
};

require('./migration')(MySQL, mysql);
require('./discovery')(MySQL, mysql);
require('./transaction')(MySQL, mysql);
