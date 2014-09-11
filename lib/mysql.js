/*!
 * Module dependencies
 */
var mysql = require('mysql');

var SqlConnector = require('loopback-connector').SqlConnector;
var EnumFactory = require('./enumFactory').EnumFactory;

var async = require('async');
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
  if (!mysql) {
    return;
  }

  var s = dataSource.settings;

  if (s.collation) {
    s.charset = s.collation.substr(0, s.collation.indexOf('_')); // Charset should be first 'chunk' of collation.
  } else {
    s.collation = 'utf8_general_ci';
    s.charset = 'utf8';
  }

  s.supportBigNumbers = (s.supportBigNumbers || false);
  s.timezone = (s.timezone || 'local');

  if (!isNaN(s.connectionLimit)) {
    s.connectionLimit = 10;
  }

  var options = {
    host: s.host || s.hostname || 'localhost',
    port: s.port || 3306,
    user: s.username || s.user,
    password: s.password,
    timezone: s.timezone,
    socketPath: s.socketPath,
    charset: s.collation.toUpperCase(), // Correct by docs despite seeming odd.
    supportBigNumbers: s.supportBigNumbers,
    connectionLimit: s.connectionLimit
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

  dataSource.client = mysql.createPool(options);

  dataSource.client.on('error', function (err) {
    dataSource.emit('error', err);
    dataSource.connected = false;
    dataSource.connecting = false;
  });

  if (debug.enabled) {
    debug('Settings: %j', s);
  }

  dataSource.connector = new MySQL(dataSource.client, s);
  dataSource.connector.dataSource = dataSource;

  defineMySQLTypes(dataSource);

  dataSource.EnumFactory = EnumFactory; // factory for Enums. Note that currently Enums can not be registered.

  process.nextTick(function () {
    callback && callback();
  });
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
function MySQL(client, settings) {
  this.name = 'mysql';
  this._models = {};
  this.client = client;
  this.settings = settings;
}

require('util').inherits(MySQL, SqlConnector);

/**
 * Execute the sql statement
 *
 * @param {String} sql The SQL statement
 * @param {Function} [callback] The callback after the SQL statement is executed
 */
MySQL.prototype.query = function (sql, callback) {
  var self = this;
  if (!this.dataSource.connected) {
    return this.dataSource.once('connected', function () {
      this.query(sql, callback);
    }.bind(this));
  }
  var client = this.client;
  var time = Date.now();
  var debugEnabled = debug.enabled;
  var db = this.settings.database;
  var log = this.log;
  if (typeof callback !== 'function') throw new Error('callback should be a function');
  if (debugEnabled) {
    debug('SQL: %s', sql);
  }

  function releaseConnectionAndCallback(connection, err, result) {
    connection.release();
    callback && callback(err, result);
  }

  function runQuery(connection) {
    connection.query(sql, function (err, data) {
      if (debugEnabled) {
        if (err) {
          console.error('Error: %j', err);
        }
        debug('Data: ', data);
      }
      if (log) {
        log(sql, time);
      }
      releaseConnectionAndCallback(connection, err, data);
    });
  }

  client.getConnection(function (err, connection) {
    if (err) {
      callback && callback(err);
      return;
    }
    if (self.settings.createDatabase) {
      // Call USE db ...
      connection.query('USE `' + db + '`', function (err) {
        if (err) {
          if (err && err.message.match(/(^|: )unknown database/i)) {
            var charset = self.settings.charset;
            var collation = self.settings.collation;
            var q = 'CREATE DATABASE ' + db + ' CHARACTER SET ' + charset + ' COLLATE ' + collation;
            connection.query(q, function (err) {
              if (!err) {
                connection.query('USE `' + db + '`', function (err) {
                  runQuery(connection);
                });
              } else {
                releaseConnectionAndCallback(connection, err);
              }
            });
            return;
          } else {
            releaseConnectionAndCallback(connection, err);
            return;
          }
        }
        runQuery(connection);
      });
    } else {
      // Bypass USE db
      runQuery(connection);
    }
  });
};

/**
 * Create the data model in MySQL
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */
MySQL.prototype.create = function (model, data, callback) {
  var fields = this.toFields(model, data);
  var sql = 'INSERT INTO ' + this.tableEscaped(model);
  if (fields) {
    sql += ' SET ' + fields;
  } else {
    sql += ' VALUES ()';
  }
  this.query(sql, function (err, info) {
    callback(err, info && info.insertId);
  });
};

/**
 * Update if the model instance exists with the same id or create a new instance
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */
MySQL.prototype.updateOrCreate = MySQL.prototype.save = function (model, data, callback) {
  var mysql = this;
  var fieldsNames = [];
  var fieldValues = [];
  var combined = [];
  var props = this._models[model].properties;
  Object.keys(data).forEach(function (key) {
    if (props[key] || mysql.id(model, key)) {
      var k = mysql.columnEscaped(model, key);
      var v;
      v = mysql.toDatabase(props[key], data[key], true);
      if (v !== undefined) {
        fieldsNames.push(k);
        fieldValues.push(v);
        if (!mysql.id(model, key)) {
          combined.push(k + ' = ' + v);
        }
      }
    }
  });

  var sql = 'INSERT INTO ' + this.tableEscaped(model);
  sql += ' (' + fieldsNames.join(', ') + ')';
  sql += ' VALUES (' + fieldValues.join(', ') + ')';
  sql += ' ON DUPLICATE KEY UPDATE ' + combined.join(', ');

  this.query(sql, function (err, info) {
    if (!err && info && info.insertId) {
      data.id = info.insertId;
    }
    callback(err, data);
  });
};

MySQL.prototype.toFields = function (model, data) {
  var self = this;
  var fields = [];
  var props = this._models[model].properties;
  Object.keys(data).forEach(function (key) {
    if (props[key]) {
      var value = this.toDatabase(props[key], data[key], true);
      if (undefined === value) {
        return;
      }
      fields.push(self.columnEscaped(model, key) + ' = ' + value);
    }
  }.bind(this));
  return fields.join(',');
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

/*!
 * Convert property name/value to a DB column
 * @param prop
 * @param val
 * @returns {*}
 */
MySQL.prototype.toDatabase = function (prop, val, forCreate) {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (!forCreate && val.constructor.name === 'Object') {
    var operator = Object.keys(val)[0]
    val = val[operator];
    if (operator === 'between') {
      return  this.toDatabase(prop, val[0]) +
        ' AND ' +
        this.toDatabase(prop, val[1]);
    } else if (operator === 'inq' || operator === 'nin') {
      if (Array.isArray(val)) { //if value is array
        for (var i = 0; i < val.length; i++) {
          val[i] = this.toDatabase(prop, val[i]);
        }
        return val.join(',');
      } else {
        return this.toDatabase(prop, val);
      }
    }
    return this.toDatabase(prop, val);
  }
  if (!prop) {
    return this.client.escape(val);
  }
  if (prop.type === Number) {
    val = Number(val);
    return isNaN(val) ? 'NULL' : val;
  }
  if (prop.type === Date) {
    if (!val) {
      return 'NULL';
    }
    if (!val.toUTCString) {
      val = new Date(val);
    }
    return '"' + dateToMysql(val) + '"';
  }
  if (prop.type === Boolean) {
    return val ? 1 : 0;
  }
  if (prop.type.name === 'GeoPoint') {
    return val ? 'Point(' + val.lat + ',' + val.lng + ')' : 'NULL';
  }
  if (prop.type === Object) {
    return this.client.escape(val);
  }
  if (typeof prop.type === 'function') {
    if (prop.type.modelName) {
      // For embedded models
      return this.client.escape(JSON.stringify(val));
    }
    return this.client.escape(prop.type(val));
  }
  return this.client.escape(val.toString());
};

/*!
 * Convert the data from database
 * @param model
 * @param data
 * @returns {*}
 */
MySQL.prototype.fromDatabase = function (model, data) {
  if (!data) {
    return null;
  }
  var props = this._models[model].properties;
  var json = {};
  for (var p in props) {
    var key = this.column(model, p);
    var val = data[key];
    if (val === undefined) {
      continue;
    }
    if (val === null) {
      json[p] = null;
      continue;
    }
    if (props[p]) {
      switch (props[p].type.name) {
        case 'Date':
          val = new Date(val.toString().replace(/GMT.*$/, 'GMT'));
          break;
        case 'Boolean':
          val = Boolean(val);
          break;
        case 'GeoPoint':
        case 'Point':
          val = {
            lat: val.x,
            lng: val.y
          };
          break;
      }
    }
    json[p] = val;
  }
  return json;
};

MySQL.prototype.escapeName = function (name) {
  return '`' + name.replace(/\./g, '`.`') + '`';
};

MySQL.prototype.getColumns = function (model, props) {
  var cols = this._models[model].properties;
  if (!cols) {
    return '*';
  }
  var self = this;
  var keys = Object.keys(cols);
  if (Array.isArray(props) && props.length > 0) {
    // No empty array, including all the fields
    keys = props;
  } else if ('object' === typeof props && Object.keys(props).length > 0) {
    // { field1: boolean, field2: boolean ... }
    var included = [];
    var excluded = [];
    keys.forEach(function (k) {
      if (props[k]) {
        included.push(k);
      } else if ((k in props) && !props[k]) {
        excluded.push(k);
      }
    });
    if (included.length > 0) {
      keys = included;
    } else if (excluded.length > 0) {
      excluded.forEach(function (e) {
        var index = keys.indexOf(e);
        keys.splice(index, 1);
      });
    }
  }
  var names = keys.map(function (c) {
    return self.columnEscaped(model, c);
  });
  return names.join(', ');
};

MySQL.prototype.buildWhere = function (model, conds) {
  var where = this._buildWhere(model, conds);
  return where? 'WHERE ' + where : '';
};

MySQL.prototype._buildWhere = function (model, conds) {
  if (conds === null || conds === undefined || (typeof conds !== 'object')) {
    return '';
  }
  var self = this;
  var props = self._models[model].properties;

  var cs = [];
  Object.keys(conds).forEach(function (key) {
    if (key === 'and' || key === 'or') {
      var clauses = conds[key];
      if (Array.isArray(clauses)) {
        clauses = clauses.map(function (c) {
          return '(' + self._buildWhere(model, c) + ')';
        });
        return cs.push(clauses.join(' ' + key.toUpperCase() + ' '));
      }
      // The value is not an array, fall back to regular fields
    }
    var keyEscaped = self.columnEscaped(model, key);
    var val = self.toDatabase(props[key], conds[key]);
    if (conds[key] === null || conds[key] === undefined) {
      cs.push(keyEscaped + ' IS NULL');
    } else if (conds[key] && conds[key].constructor.name === 'Object') {
      var condType = Object.keys(conds[key])[0];
      var sqlCond = keyEscaped;
      if ((condType === 'inq' || condType === 'nin') && val.length === 0) {
        cs.push(condType === 'inq' ? 0 : 1);
        return true;
      }
      switch (condType) {
        case 'gt':
          sqlCond += ' > ';
          break;
        case 'gte':
          sqlCond += ' >= ';
          break;
        case 'lt':
          sqlCond += ' < ';
          break;
        case 'lte':
          sqlCond += ' <= ';
          break;
        case 'between':
          sqlCond += ' BETWEEN ';
          break;
        case 'inq':
          sqlCond += ' IN ';
          break;
        case 'nin':
          sqlCond += ' NOT IN ';
          break;
        case 'neq':
          sqlCond += ' != ';
          break;
        case 'like':
          sqlCond += ' LIKE ';
          break;
        case 'nlike':
          sqlCond += ' NOT LIKE ';
          break;
      }
      sqlCond += (condType === 'inq' || condType === 'nin') ? '(' + val + ')' : val;
      cs.push(sqlCond);
    } else {
      cs.push(keyEscaped + ' = ' + val);
    }
  });
  if (cs.length === 0) {
    return '';
  }
  return cs.join(' AND ');
}

function buildOrderBy(self, model, order) {
  if (typeof order === 'string') {
    order = [order];
  }
  return 'ORDER BY ' + order.map(function (o) {
    var t = o.split(/[\s,]+/);
    if (t.length === 1) {
      return self.columnEscaped(model, o);
    }
    return self.columnEscaped(model, t[0]) + ' ' + t[1];
  }).join(', ');
}

function buildLimit(limit, offset) {
  if (isNaN(limit)) {
    limit = 0;
  }
  if (isNaN(offset)) {
    offset = 0;
  }
  return 'LIMIT ' + (offset ? (offset + ',' + limit) : limit);
}

/**
 * Find matching model instances by the filter
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [callback] The callback function
 */
MySQL.prototype.all = function all(model, filter, callback) {
  var self = this;
  // Order by id if no order is specified
  filter = filter || {};
  if (!filter.order) {
    var idNames = this.idNames(model);
    if (idNames && idNames.length) {
      filter.order = idNames;
    }
  }

  var sql = 'SELECT ' + this.getColumns(model, filter.fields) + ' FROM ' + this.tableEscaped(model);

  if (filter) {

    if (filter.where) {
      sql += ' ' + self.buildWhere(model, filter.where);
    }

    if (filter.order) {
      sql += ' ' + buildOrderBy(self, model, filter.order);
    }

    if (filter.limit) {
      sql += ' ' + buildLimit(filter.limit, filter.skip || filter.offset || 0);
    }

  }

  this.query(sql, function (err, data) {
    if (err) {
      return callback(err, []);
    }

    var objs = data.map(function (obj) {
      return self.fromDatabase(model, obj);
    });
    if (filter && filter.include) {
      this._models[model].model.include(objs, filter.include, callback);
    } else {
      callback(null, objs);
    }
  }.bind(this));

  return sql;

};

MySQL.prototype.count = function count(model, callback, where) {

  this.query('SELECT count(*) as cnt FROM ' +
      this.tableEscaped(model) + ' ' + this.buildWhere(model, where),
    function (err, res) {
      if (err) {
        return callback(err);
      }
      var c = (res && res[0] && res[0].cnt) || 0;
      callback(err, c);
    });

};


/**
 * Delete instances for the given model
 *
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [callback] The callback function
 *
 */
MySQL.prototype.destroyAll = function destroyAll(model, where, callback) {
  if (!callback && 'function' === typeof where) {
    callback = where;
    where = undefined;
  }
  this.query('DELETE FROM '
      + this.tableEscaped(model) + ' ' + this.buildWhere(model, where || {}),
    function (err, data) {
      callback && callback(err, data);
    }.bind(this));
};

/**
 * Perform autoupdate for the given models
 * @param {String[]} [models] A model name or an array of model names. If not present, apply to all models
 * @param {Function} [cb] The callback function
 */
MySQL.prototype.autoupdate = function (models, cb) {
  var self = this;

  if ((!cb) && ('function' === typeof models)) {
    cb = models;
    models = undefined;
  }
  // First argument is a model name
  if ('string' === typeof models) {
    models = [models];
  }

  models = models || Object.keys(this._models);

  async.each(models, function(model, done) {
    if (!(model in self._models)) {
      return process.nextTick(function() {
        done(new Error('Model not found: ' + model));
      });
    }
    var table = self.tableEscaped(model);
    self.query('SHOW FIELDS FROM ' + table, function(err, fields) {
      self.query('SHOW INDEXES FROM ' + table, function(err, indexes) {
        if (!err && fields && fields.length) {
          self.alterTable(model, fields, indexes, done);
        } else {
          self.createTable(model, done);
        }
      });
    });
  }, cb);

};

/*!
 * Create table
 * @param model
 * @param cb
 */
MySQL.prototype.createTable = function (model, cb) {
  var metadata = this._models[model].settings[this.name];
  var engine = metadata && metadata.engine;
  var sql = 'CREATE TABLE ' + this.tableEscaped(model) +
    ' (\n  ' + this.propertiesSQL(model) + '\n)';
  if (engine) {
    sql += 'ENGINE=' + engine + '\n';
  }
  this.query(sql, cb);
};

/**
 * Check if the models exist
 * @param {String[]} [models] A model name or an array of model names. If not present, apply to all models
 * @param {Function} [cb] The callback function
 */
MySQL.prototype.isActual = function(cb) {
  var self = this;
  var ok = false;
  async.each(Object.keys(this._models), function(model, done) {
    var table = self.tableEscaped(model);
    self.query('SHOW FIELDS FROM ' + table, function(err, fields) {
      self.query('SHOW INDEXES FROM ' + table, function(err, indexes) {
        self.alterTable(model, fields, indexes, function(err, needAlter) {
          if (err) {
            return done(err);
          } else {
            ok = ok || needAlter;
            done(err);
          }
        }, true);
      });
    });
  }, function(err) {
    if (err) {
      return err;
    }
    cb(null, !ok);
  });
};

MySQL.prototype.alterTable = function (model, actualFields, actualIndexes, done, checkOnly) {
  var self = this;
  var m = this._models[model];
  var propNames = Object.keys(m.properties).filter(function (name) {
    return !!m.properties[name];
  });
  var indexNames = m.settings.indexes ? Object.keys(m.settings.indexes).filter(function (name) {
    return !!m.settings.indexes[name];
  }) : [];
  var sql = [];
  var ai = {};

  if (actualIndexes) {
    actualIndexes.forEach(function (i) {
      var name = i.Key_name;
      if (!ai[name]) {
        ai[name] = {
          info: i,
          columns: []
        };
      }
      ai[name].columns[i.Seq_in_index - 1] = i.Column_name;
    });
  }
  var aiNames = Object.keys(ai);

  // change/add new fields
  propNames.forEach(function (propName) {
    if (m.properties[propName] && self.id(model, propName)) return;
    var found;
    if (actualFields) {
      actualFields.forEach(function (f) {
        if (f.Field === propName) {
          found = f;
        }
      });
    }

    if (found) {
      actualize(propName, found);
    } else {
      sql.push('ADD COLUMN `' + propName + '` ' + self.propertySettingsSQL(model, propName));
    }
  });

  // drop columns
  if (actualFields) {
    actualFields.forEach(function (f) {
      var notFound = !~propNames.indexOf(f.Field);
      if (m.properties[f.Field] && self.id(model, f.Field)) return;
      if (notFound || !m.properties[f.Field]) {
        sql.push('DROP COLUMN `' + f.Field + '`');
      }
    });
  }

  // remove indexes
  aiNames.forEach(function (indexName) {
    if (indexName === 'PRIMARY' || (m.properties[indexName] && self.id(model, indexName))) return;
    if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName] || m.properties[indexName] && !m.properties[indexName].index) {
      sql.push('DROP INDEX `' + indexName + '`');
    } else {
      // first: check single (only type and kind)
      if (m.properties[indexName] && !m.properties[indexName].index) {
        // TODO
        return;
      }
      // second: check multiple indexes
      var orderMatched = true;
      if (indexNames.indexOf(indexName) !== -1) {
        m.settings.indexes[indexName].columns.split(/,\s*/).forEach(function (columnName, i) {
          if (ai[indexName].columns[i] !== columnName) orderMatched = false;
        });
      }
      if (!orderMatched) {
        sql.push('DROP INDEX `' + indexName + '`');
        delete ai[indexName];
      }
    }
  });

  // add single-column indexes
  propNames.forEach(function (propName) {
    var i = m.properties[propName].index;
    if (!i) {
      return;
    }
    var found = ai[propName] && ai[propName].info;
    if (!found) {
      var type = '';
      var kind = '';
      if (i.type) {
        type = 'USING ' + i.type;
      }
      if (i.kind) {
        // kind = i.kind;
      }
      if (kind && type) {
        sql.push('ADD ' + kind + ' INDEX `' + propName + '` (`' + propName + '`) ' + type);
      } else {
        sql.push('ADD ' + kind + ' INDEX `' + propName + '` ' + type + ' (`' + propName + '`) ');
      }
    }
  });

  // add multi-column indexes
  indexNames.forEach(function (indexName) {
    var i = m.settings.indexes[indexName];
    var found = ai[indexName] && ai[indexName].info;
    if (!found) {
      var type = '';
      var kind = '';
      if (i.type) {
        type = 'USING ' + i.type;
      }
      if (i.kind) {
        kind = i.kind;
      }
      if (kind && type) {
        sql.push('ADD ' + kind + ' INDEX `' + indexName + '` (' + i.columns + ') ' + type);
      } else {
        sql.push('ADD ' + kind + ' INDEX ' + type + ' `' + indexName + '` (' + i.columns + ')');
      }
    }
  });

  if (sql.length) {
    var query = 'ALTER TABLE ' + self.tableEscaped(model) + ' ' + sql.join(',\n');
    if (checkOnly) {
      done(null, true, {statements: sql, query: query});
    } else {
      this.query(query, done);
    }
  } else {
    done();
  }

  function actualize(propName, oldSettings) {
    var newSettings = m.properties[propName];
    if (newSettings && changed(newSettings, oldSettings)) {
      sql.push('CHANGE COLUMN `' + propName + '` `' + propName + '` ' + self.propertySettingsSQL(model, propName));
    }
  }

  function changed(newSettings, oldSettings) {
    if (oldSettings.Null === 'YES') { // Used to allow null and does not now.
      if (newSettings.allowNull === false) return true;
      if (newSettings.null === false) return true;
    }
    if (oldSettings.Null === 'NO') { // Did not allow null and now does.
      if (newSettings.allowNull === true) return true;
      if (newSettings.null === true) return true;
      if (newSettings.null === undefined && newSettings.allowNull === undefined) return true;
    }

    if (oldSettings.Type.toUpperCase() !== datatype(newSettings).toUpperCase()) return true;
    return false;
  }
};

MySQL.prototype.propertiesSQL = function (model) {
  var self = this;

  var pks = this.idNames(model).map(function (i) {
    return self.columnEscaped(model, i);
  });

  var sql = [];
  if (pks.length === 1) {
    var idName = this.idName(model);
    var idProp = this._models[model].properties[idName];
    if(idProp.generated) {
      sql.push(self.columnEscaped(model, idName) + ' INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY');
    } else {
      idProp.nullable = false;
      sql.push(self.columnEscaped(model, idName) + ' ' + self.propertySettingsSQL(model, idName) + ' PRIMARY KEY');
    }
  }
  Object.keys(this._models[model].properties).forEach(function (prop) {
    if (self.id(model, prop) && pks.length === 1) {
      return;
    }
    var colName = self.columnEscaped(model, prop);
    sql.push(colName + ' ' + self.propertySettingsSQL(model, prop));
  });
  if (pks.length > 1) {
    sql.push('PRIMARY KEY(' + pks.join(',') + ')');
  }

  /*
   var sql = ['`id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY'];
   Object.keys(this._models[model].properties).forEach(function (prop) {
   if (self.id(model, prop)) return;
   sql.push('`' + prop + '` ' + self.propertySettingsSQL(model, prop));
   });
   */

  // Declared in model index property indexes.
  Object.keys(this._models[model].properties).forEach(function (prop) {
    var i = self._models[model].properties[prop].index;
    if (i) {
      sql.push(self.singleIndexSettingsSQL(model, prop));
    }
  });
  // Settings might not have an indexes property.
  var dxs = this._models[model].settings.indexes;
  if (dxs) {
    Object.keys(this._models[model].settings.indexes).forEach(function (prop) {
      sql.push(self.indexSettingsSQL(model, prop));
    });
  }
  return sql.join(',\n  ');
};

MySQL.prototype.singleIndexSettingsSQL = function (model, prop) {
  // Recycled from alterTable single indexes above, more or less.
  var i = this._models[model].properties[prop].index;
  var type = '';
  var kind = '';
  if (i.type) {
    type = 'USING ' + i.type;
  }
  if (i.kind) {
    kind = i.kind;
  }
  var columnName = this.columnEscaped(model, prop);
  if (kind && type) {
    return (kind + ' INDEX ' + columnName + ' (' + columnName + ') ' + type);
  } else {
    return (kind + ' INDEX ' + columnName + ' ' + type + ' (' + columnName + ') ');
  }
};

MySQL.prototype.indexSettingsSQL = function (model, prop) {
  // Recycled from alterTable multi-column indexes above, more or less.
  var i = this._models[model].settings.indexes[prop];
  var type = '';
  var kind = '';
  if (i.type) {
    type = 'USING ' + i.type;
  }
  if (i.kind) {
    kind = i.kind;
  }
  var columnName = this.columnEscaped(model, prop);
  if (kind && type) {
    return (kind + ' INDEX ' + columnName + ' (' + i.columns + ') ' + type);
  } else {
    return (kind + ' INDEX ' + type + ' ' + columnName + ' (' + i.columns + ')');
  }
};

MySQL.prototype.propertySettingsSQL = function (model, prop) {
  var p = this._models[model].properties[prop];
  var line = this.columnDataType(model, prop) + ' ' +
    (p.nullable === false || p.allowNull === false || p['null'] === false ? 'NOT NULL' : 'NULL');
  return line;
};

MySQL.prototype.columnDataType = function (model, property) {
  var columnMetadata = this.columnMetadata(model, property);
  var colType = columnMetadata && columnMetadata.dataType;
  if (colType) {
    colType = colType.toUpperCase();
  }
  var prop = this._models[model].properties[property];
  if (!prop) {
    return null;
  }
  var colLength = columnMetadata && columnMetadata.dataLength || prop.length;
  if (colType) {
    return colType + (colLength ? '(' + colLength + ')' : '');
  }
  return datatype(prop);
};

function datatype(p) {
  var dt = '';
  switch (p.type.name) {
    default:
    case 'String':
      dt = columnType(p, 'VARCHAR');
      dt = stringOptionsByType(p, dt);
      break;
    case 'JSON':
    case 'Object':
    case 'Any':
    case 'Text':
      dt = columnType(p, 'TEXT');
      dt = stringOptionsByType(p, dt);
      break;
    case 'Number':
      dt = columnType(p, 'INT');
      dt = numericOptionsByType(p, dt);
      break;
    case 'Date':
      dt = columnType(p, 'DATETIME'); // Currently doesn't need options.
      break;
    case 'Boolean':
      dt = 'TINYINT(1)';
      break;
    case 'Point':
    case 'GeoPoint':
      dt = 'POINT';
      break;
    case 'Enum':
      dt = 'ENUM(' + p.type._string + ')';
      dt = stringOptions(p, dt); // Enum columns can have charset/collation.
      break;
  }
  return dt;
}

function columnType(p, defaultType) {
  var dt = defaultType;
  if (p.dataType) {
    dt = String(p.dataType);
  }
  return dt;
}

function stringOptionsByType(p, dt) {
  switch (dt.toLowerCase()) {
    default:
    case 'varchar':
      // The maximum length for an ID column is 1000 bytes
      // The maximum row size is 64K
      var len = p.length || p.limit || ((p.type !== String) ? 4096 : p.id ? 255: 512);
      dt += '(' + len + ')';
      break;
    case 'char':
      len = p.length || p.limit || 255;
      dt += '(' + len + ')';
      break;

    case 'text':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':

      break;
  }
  dt = stringOptions(p, dt);
  return dt;
}

function stringOptions(p, dt) {
  if (p.charset) {
    dt += " CHARACTER SET " + p.charset;
  }
  if (p.collation) {
    dt += " COLLATE " + p.collation;
  }
  return dt;
}

function numericOptionsByType(p, dt) {
  switch (dt.toLowerCase()) {
    default:
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'bigint':
      dt = integerOptions(p, dt);
      break;

    case 'decimal':
    case 'numeric':
      dt = fixedPointOptions(p, dt);
      break;

    case 'float':
    case 'double':
      dt = floatingPointOptions(p, dt);
      break;
  }
  dt = unsigned(p, dt);
  return dt;
}

function floatingPointOptions(p, dt) {
  var precision = 16;
  var scale = 8;
  if (p.precision) {
    precision = Number(p.precision);
  }
  if (p.scale) {
    scale = Number(p.scale);
  }
  if (p.precision && p.scale) {
    dt += '(' + precision + ',' + scale + ')';
  } else if (p.precision) {
    dt += '(' + precision + ')';
  }
  return dt;
}

/*  @TODO: Change fixed point to use an arbitrary precision arithmetic library.     */
/*  Currently fixed point will lose precision because it's turned to non-fixed in   */
/*  JS. Also, defaulting column to (9,2) and not allowing non-specified 'DECIMAL'   */
/*  declaration which would default to DECIMAL(10,0). Instead defaulting to (9,2).  */
function fixedPointOptions(p, dt) {
  var precision = 9;
  var scale = 2;
  if (p.precision) {
    precision = Number(p.precision);
  }
  if (p.scale) {
    scale = Number(p.scale);
  }
  dt += '(' + precision + ',' + scale + ')';
  return dt;
}

function integerOptions(p, dt) {
  var tmp = 0;
  if (p.display || p.limit) {
    tmp = Number(p.display || p.limit);
  }
  if (tmp > 0) {
    dt += '(' + tmp + ')';
  } else if (p.unsigned) {
    switch (dt.toLowerCase()) {
      default:
      case 'int':
        dt += '(10)';
        break;
      case 'mediumint':
        dt += '(8)';
        break;
      case 'smallint':
        dt += '(5)';
        break;
      case 'tinyint':
        dt += '(3)';
        break;
      case 'bigint':
        dt += '(20)';
        break;
    }
  } else {
    switch (dt.toLowerCase()) {
      default:
      case 'int':
        dt += '(11)';
        break;
      case 'mediumint':
        dt += '(9)';
        break;
      case 'smallint':
        dt += '(6)';
        break;
      case 'tinyint':
        dt += '(4)';
        break;
      case 'bigint':
        dt += '(20)';
        break;
    }
  }
  return dt;
}

function unsigned(p, dt) {
  if (p.unsigned) {
    dt += ' UNSIGNED';
  }
  return dt;
}

/**
 * Disconnect from MySQL
 */
MySQL.prototype.disconnect = function () {
  if (this.debug) {
    debug('disconnect');
  }
  if (this.client) {
    this.client.end();
  }
};

MySQL.prototype.ping = function(cb) {
  this.query('SELECT 1 AS result', cb);
};

require('./discovery')(MySQL);

