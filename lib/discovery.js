// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var g = require('strong-globalize')();

module.exports = mixinDiscovery;

/*!
 * @param {MySQL} MySQL connector class
 * @param {Object} mysql mysql driver
 */
function mixinDiscovery(MySQL, mysql) {
  var async = require('async');

  function paginateSQL(sql, orderBy, options) {
    options = options || {};
    var limitClause = '';
    if (options.offset || options.skip || options.limit) {
      // Offset starts from 0
      var offset = Number(options.offset || options.skip || 0);
      if (isNaN(offset)) {
        offset = 0;
      }
      limitClause = ' LIMIT ' + offset;
      if (options.limit) {
        var limit = Number(options.limit);
        if (isNaN(limit)) {
          limit = 0;
        }
        limitClause = limitClause + ',' + limit;
      }
    }
    if (!orderBy) {
      sql += ' ORDER BY ' + orderBy;
    }
    return sql + limitClause;
  }

  /*!
   * Build sql for listing schemas (databases in MySQL)
   * @params {Object} [options] Options object
   * @returns {String} The SQL statement
   */
  function querySchemas(options) {
    var sql = 'SELECT catalog_name as "catalog",' +
      ' schema_name as "schema"' +
      ' FROM information_schema.schemata';
    return paginateSQL(sql, 'schema_name', options);
  }

  /*!
   * Build sql for listing tables
   * @param options {all: for all owners, owner: for a given owner}
   * @returns {string} The sql statement
   */
  function queryTables(options) {
    var sqlTables = null;
    var schema = options.owner || options.schema;

    if (options.all && !schema) {
      sqlTables = paginateSQL('SELECT \'table\' AS "type",' +
        ' table_name AS "name", table_schema AS "owner"' +
        ' FROM information_schema.tables',
        'table_schema, table_name', options);
    } else if (schema) {
      sqlTables = paginateSQL('SELECT \'table\' AS "type",' +
        ' table_name AS "name", table_schema AS "schema"' +
        ' FROM information_schema.tables' +
        ' WHERE table_schema=' + mysql.escape(schema),
        'table_schema, table_name', options);
    } else {
      sqlTables = paginateSQL('SELECT \'table\' AS "type",' +
        ' table_name AS "name", ' +
        ' table_schema AS "owner" FROM information_schema.tables' +
        ' WHERE table_schema=SUBSTRING_INDEX(USER(),\'@\',1)',
        'table_name', options);
    }
    return sqlTables;
  }

  /*!
   * Build sql for listing views
   * @param options {all: for all owners, owner: for a given owner}
   * @returns {string} The sql statement
   */
  function queryViews(options) {
    var sqlViews = null;
    if (options.views) {
      var schema = options.owner || options.schema;

      if (options.all && !schema) {
        sqlViews = paginateSQL('SELECT \'view\' AS "type",' +
          ' table_name AS "name",' +
          ' table_schema AS "owner"' +
          ' FROM information_schema.views',
          'table_schema, table_name', options);
      } else if (schema) {
        sqlViews = paginateSQL('SELECT \'view\' AS "type",' +
          ' table_name AS "name",' +
          ' table_schema AS "owner"' +
          ' FROM information_schema.views' +
          ' WHERE table_schema=' + mysql.escape(schema),
          'table_schema, table_name', options);
      } else {
        sqlViews = paginateSQL('SELECT \'view\' AS "type",' +
          ' table_name AS "name",' +
          ' table_schema AS "owner"' +
          ' FROM information_schema.views',
          'table_name', options);
      }
    }
    return sqlViews;
  }

  MySQL.prototype.discoverDatabaseSchemas = function(options, cb) {
    if (!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};
    this.execute(querySchemas(options), cb);
  };

  /**
   * Discover model definitions
   *
   * @param {Object} options Options for discovery
   * @param {Function} [cb] The callback function
   */
  MySQL.prototype.discoverModelDefinitions = function(options, cb) {
    if (!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};

    var self = this;
    var calls = [function(callback) {
      self.execute(queryTables(options), callback);
    }];

    if (options.views) {
      calls.push(function(callback) {
        self.execute(queryViews(options), callback);
      });
    }
    async.parallel(calls, function(err, data) {
      if (err) {
        cb(err, data);
      } else {
        var merged = [];
        merged = merged.concat(data.shift());
        if (data.length) {
          merged = merged.concat(data.shift());
        }
        cb(err, merged);
      }
    });
  };

  /*!
   * Normalize the arguments
   * @param table string, required
   * @param options object, optional
   * @param cb function, optional
   */
  function getArgs(table, options, cb) {
    if ('string' !== typeof table || !table) {
      throw new Error(g.f('{{table}} is a required string argument: %s', table));
    }
    options = options || {};
    if (!cb && 'function' === typeof options) {
      cb = options;
      options = {};
    }
    if (typeof options !== 'object') {
      throw new Error(g.f('{{options}} must be an {{object}}: %s', options));
    }
    return {
      schema: options.owner || options.schema,
      table: table,
      options: options,
      cb: cb,
    };
  }

  /*!
   * Build the sql statement to query columns for a given table
   * @param schema
   * @param table
   * @returns {String} The sql statement
   */
  function queryColumns(schema, table) {
    var sql = null;
    if (schema) {
      sql = paginateSQL('SELECT table_schema AS "owner",' +
        ' table_name AS "tableName",' +
        ' column_name AS "columnName",' +
        ' data_type AS "dataType",' +
        ' character_maximum_length AS "dataLength",' +
        ' numeric_precision AS "dataPrecision",' +
        ' numeric_scale AS "dataScale",' +
        ' is_nullable = \'YES\' AS "nullable"' +
        ' FROM information_schema.columns' +
        ' WHERE table_schema=' + mysql.escape(schema) +
        (table ? ' AND table_name=' + mysql.escape(table) : ''),
        'table_name, ordinal_position', {});
    } else {
      sql = paginateSQL('SELECT table_schema AS "owner",' +
        ' table_name AS "tableName",' +
        ' column_name AS "columnName",' +
        ' data_type AS "dataType",' +
        ' character_maximum_length AS "dataLength",' +
        ' numeric_precision AS "dataPrecision",' +
        ' numeric_scale AS "dataScale",' +
        ' is_nullable = \'YES\' AS "nullable"' +
        ' FROM information_schema.columns' +
        (table ? ' WHERE table_name=' + mysql.escape(table) : ''),
        'table_name, ordinal_position', {});
    }
    return sql;
  }

  /**
   * Discover model properties from a table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   *
   */
  MySQL.prototype.discoverModelProperties = function(table, options, cb) {
    var self = this;
    var args = getArgs(table, options, cb);
    var schema = args.schema;
    if (!schema) {
      schema = this.getDefaultSchema();
    }
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryColumns(schema, table);
    var callback = function(err, results) {
      if (err) {
        cb(err, results);
      } else {
        results.map(function(r) {
          r.type = self.buildPropertyType(r);
          r.nullable = r.nullable ? 'Y' : 'N';
        });
        cb(err, results);
      }
    };
    this.execute(sql, callback);
  };

  /*!
   * Build the sql statement for querying primary keys of a given table
   * @param schema
   * @param table
   * @returns {string}
   */
// http://docs.oracle.com/javase/6/docs/api/java/sql/DatabaseMetaData.html
// #getPrimaryKeys(java.lang.String, java.lang.String, java.lang.String)
  function queryPrimaryKeys(schema, table) {
    var sql = 'SELECT table_schema AS "owner",' +
      ' table_name AS "tableName",' +
      ' column_name AS "columnName",' +
      ' ordinal_position AS "keySeq",' +
      ' constraint_name AS "pkName"' +
      ' FROM information_schema.key_column_usage' +
      ' WHERE constraint_name=\'PRIMARY\'';

    if (schema) {
      sql += ' AND table_schema=' + mysql.escape(schema);
    }
    if (table) {
      sql += ' AND table_name=' + mysql.escape(table);
    }
    sql += ' ORDER BY' +
      ' table_schema, constraint_name, table_name, ordinal_position';
    return sql;
  }

  /**
   * Discover primary keys for a given table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  MySQL.prototype.discoverPrimaryKeys = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var schema = args.schema;
    if (!schema) {
      schema = this.getDefaultSchema();
    }
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryPrimaryKeys(schema, table);
    this.execute(sql, cb);
  };

  /*!
   * Build the sql statement for querying foreign keys of a given table
   * @param schema
   * @param table
   * @returns {string}
   */
  function queryForeignKeys(schema, table) {
    var sql =
      'SELECT table_schema AS "fkOwner",' +
      ' constraint_name AS "fkName",' +
      ' table_name AS "fkTableName",' +
      ' column_name AS "fkColumnName",' +
      ' ordinal_position AS "keySeq",' +
      ' referenced_table_schema AS "pkOwner", \'PRIMARY\' AS "pkName",' +
      ' referenced_table_name AS "pkTableName",' +
      ' referenced_column_name AS "pkColumnName"' +
      ' FROM information_schema.key_column_usage' +
      ' WHERE constraint_name!=\'PRIMARY\'' +
      ' AND POSITION_IN_UNIQUE_CONSTRAINT IS NOT NULL';
    if (schema) {
      sql += ' AND table_schema=' + mysql.escape(schema);
    }
    if (table) {
      sql += ' AND table_name=' + mysql.escape(table);
    }
    return sql;
  }

  /**
   * Discover foreign keys for a given table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  MySQL.prototype.discoverForeignKeys = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var schema = args.schema;
    if (!schema) {
      schema = this.getDefaultSchema();
    }
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryForeignKeys(schema, table);
    this.execute(sql, cb);
  };

  /*!
   * Retrieves a description of the foreign key columns that reference the
   * given table's primary key columns (the foreign keys exported by a table).
   * They are ordered by fkTableOwner, fkTableName, and keySeq.
   * @param schema
   * @param table
   * @returns {string}
   */
  function queryExportedForeignKeys(schema, table) {
    var sql = 'SELECT a.constraint_name AS "fkName",' +
      ' a.table_schema AS "fkOwner",' +
      ' a.table_name AS "fkTableName",' +
      ' a.column_name AS "fkColumnName",' +
      ' a.ordinal_position AS "keySeq",' +
      ' NULL AS "pkName",' +
      ' a.referenced_table_schema AS "pkOwner",' +
      ' a.referenced_table_name AS "pkTableName",' +
      ' a.referenced_column_name AS "pkColumnName"' +
      ' FROM information_schema.key_column_usage a' +
      ' WHERE a.position_in_unique_constraint IS NOT NULL';
    if (schema) {
      sql += ' AND a.referenced_table_schema=' + mysql.escape(schema);
    }
    if (table) {
      sql += ' AND a.referenced_table_name=' + mysql.escape(table);
    }
    sql += ' ORDER BY a.table_schema, a.table_name, a.ordinal_position';

    return sql;
  }

  /**
   * Discover foreign keys that reference to the primary key of this table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  MySQL.prototype.discoverExportedForeignKeys = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var schema = args.schema;
    if (!schema) {
      schema = this.getDefaultSchema();
    }
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryExportedForeignKeys(schema, table);
    this.execute(sql, cb);
  };

  MySQL.prototype.buildPropertyType = function(columnDefinition) {
    var mysqlType = columnDefinition.dataType;
    var dataLength = columnDefinition.dataLength;

    var type = mysqlType.toUpperCase();
    switch (type) {
      case 'CHAR':
        if (dataLength === 1) {
          // Treat char(1) as boolean
          return 'Boolean';
        } else {
          return 'String';
        }
        break;
      case 'VARCHAR':
      case 'TINYTEXT':
      case 'MEDIUMTEXT':
      case 'LONGTEXT':
      case 'TEXT':
      case 'ENUM':
      case 'SET':
        return 'String';
      case 'TINYBLOB':
      case 'MEDIUMBLOB':
      case 'LONGBLOB':
      case 'BLOB':
      case 'BINARY':
      case 'VARBINARY':
      case 'BIT':
        return 'Binary';
      case 'TINYINT':
      case 'SMALLINT':
      case 'INT':
      case 'MEDIUMINT':
      case 'YEAR':
      case 'FLOAT':
      case 'DOUBLE':
      case 'BIGINT':
        return 'Number';
      case 'DATE':
      case 'TIMESTAMP':
      case 'DATETIME':
        return 'Date';
      case 'POINT':
        return 'GeoPoint';
      default:
        return 'String';
    }
  };

  MySQL.prototype.getDefaultSchema = function() {
    if (this.dataSource && this.dataSource.settings &&
      this.dataSource.settings.database) {
      return this.dataSource.settings.database;
    }
    return undefined;
  };
}
