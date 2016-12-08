// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var g = require('strong-globalize')();
var async = require('async');
module.exports = mixinMigration;

/*!
 * @param {MySQL} MySQL connector class
 * @param {Object} mysql mysql driver
 */
function mixinMigration(MySQL, mysql) {
  /**
   * Perform autoupdate for the given models
   * @param {String[]} [models] A model name or an array of model names.
   * If not present, apply to all models
   * @param {Function} [cb] The callback function
   */
  MySQL.prototype.autoupdate = function(models, cb) {
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
          done(new Error(g.f('Model not found: %s', model)));
        });
      }
      var table = self.tableEscaped(model);
      self.execute('SHOW FIELDS FROM ' + table, function(err, fields) {
        self.execute('SHOW INDEXES FROM ' + table, function(err, indexes) {
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
   * Create a DB table for the given model
   * @param {string} model Model name
   * @param cb
   */
  MySQL.prototype.createTable = function(model, cb) {
    var metadata = this.getModelDefinition(model).settings[this.name];
    var engine = metadata && metadata.engine;
    var sql = 'CREATE TABLE ' + this.tableEscaped(model) +
      ' (\n  ' + this.buildColumnDefinitions(model) + '\n)';
    if (engine) {
      sql += 'ENGINE=' + engine + '\n';
    }
    this.execute(sql, cb);
  };

  /**
   * Check if the models exist
   * @param {String[]} [models] A model name or an array of model names. If not
   * present, apply to all models
   * @param {Function} [cb] The callback function
   */
  MySQL.prototype.isActual = function(models, cb) {
    var self = this;
    var ok = false;

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
      var table = self.tableEscaped(model);
      self.execute('SHOW FIELDS FROM ' + table, function(err, fields) {
        self.execute('SHOW INDEXES FROM ' + table, function(err, indexes) {
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

  MySQL.prototype.alterTable = function(model, actualFields, actualIndexes, done, checkOnly) {
    var self = this;
    var m = this.getModelDefinition(model);
    var propNames = Object.keys(m.properties).filter(function(name) {
      return !!m.properties[name];
    });
    var indexes = m.settings.indexes || {};
    var indexNames = Object.keys(indexes).filter(function(name) {
      return !!m.settings.indexes[name];
    });
    var sql = [];
    var ai = {};

    if (actualIndexes) {
      actualIndexes.forEach(function(i) {
        var name = i.Key_name;
        if (!ai[name]) {
          ai[name] = {
            info: i,
            columns: [],
          };
        }
        ai[name].columns[i.Seq_in_index - 1] = i.Column_name;
      });
    }
    var aiNames = Object.keys(ai);

    // change/add new fields
    propNames.forEach(function(propName) {
      if (m.properties[propName] && self.id(model, propName)) return;
      var found;
      var colName = expectedColName(propName);
      if (actualFields) {
        actualFields.forEach(function(f) {
          if (f.Field === colName) {
            found = f;
          }
        });
      }

      if (found) {
        actualize(propName, found);
      } else {
        sql.push('ADD COLUMN ' + self.client.escapeId(propName) + ' ' +
          self.buildColumnDefinition(model, propName));
      }
    });

    // drop columns
    if (actualFields) {
      actualFields.forEach(function(f) {
        var colNames = propNames.map(expectedColName);
        var index = colNames.indexOf(f.Field);
        var propName = index >= 0 ? propNames[index] : f.Field;
        var notFound = !~index;
        if (m.properties[propName] && self.id(model, propName)) return;
        if (notFound || !m.properties[propName]) {
          sql.push('DROP COLUMN ' + self.client.escapeId(f.Field));
        }
      });
    }

    // remove indexes
    aiNames.forEach(function(indexName) {
      if (indexName === 'PRIMARY' ||
        (m.properties[indexName] && self.id(model, indexName))) return;
      if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName] ||
        m.properties[indexName] && !m.properties[indexName].index) {
        sql.push('DROP INDEX ' + self.client.escapeId(indexName));
      } else {
        // first: check single (only type and kind)
        if (m.properties[indexName] && !m.properties[indexName].index) {
          // TODO
          return;
        }
        // second: check multiple indexes
        var orderMatched = true;
        if (indexNames.indexOf(indexName) !== -1) {
          //check if indexes are configured as "columns"
          if (m.settings.indexes[indexName].columns) {
            m.settings.indexes[indexName].columns.split(/,\s*/).forEach(
              function(columnName, i) {
                if (ai[indexName].columns[i] !== columnName) orderMatched = false;
              });
          } else if (m.settings.indexes[indexName].keys) {
            //if indexes are configured as "keys"
            var index = 0;
            for (var key in m.settings.indexes[indexName].keys) {
              var sortOrder = m.settings.indexes[indexName].keys[key];
              if (ai[indexName].columns[index] !== key) {
                orderMatched = false;
                break;
              }
              index++;
            }
            //if number of columns differ between new and old index
            if (index !== ai[indexName].columns.length) {
              orderMatched = false;
            }
          }
        }
        if (!orderMatched) {
          sql.push('DROP INDEX ' + self.client.escapeId(indexName));
          delete ai[indexName];
        }
      }
    });

    // add single-column indexes
    propNames.forEach(function(propName) {
      var i = m.properties[propName].index;
      if (!i) {
        return;
      }
      var found = ai[propName] && ai[propName].info;
      if (!found) {
        var pName = self.client.escapeId(propName);
        var type = '';
        var kind = '';
        if (i.type) {
          type = 'USING ' + i.type;
        }
        if (kind && type) {
          sql.push('ADD ' + kind + ' INDEX ' + pName +
            ' (' + pName + ') ' + type);
        } else {
          if (typeof i === 'object' && i.unique && i.unique === true) {
            kind = 'UNIQUE';
          }
          sql.push('ADD ' + kind + ' INDEX ' + pName + ' ' + type +
            ' (' + pName + ') ');
        }
      }
    });

    // add multi-column indexes
    indexNames.forEach(function(indexName) {
      var i = m.settings.indexes[indexName];
      var found = ai[indexName] && ai[indexName].info;
      if (!found) {
        var iName = self.client.escapeId(indexName);
        var type = '';
        var kind = '';
        if (i.type) {
          type = 'USING ' + i.type;
        }
        if (i.kind) {
          kind = i.kind;
        } else if (i.options && i.options.unique && i.options.unique == true) {
          //if index unique indicator is configured
          kind = 'UNIQUE';
        }

        var indexedColumns = [];
        var columns = '';
        //if indexes are configured as "keys"
        if (i.keys) {
          for (var key in i.keys) {
            if (i.keys[key] !== -1) {
              indexedColumns.push(key);
            } else {
              indexedColumns.push(key + ' DESC ');
            }
          }
        }
        if (indexedColumns.length > 0) {
          columns = indexedColumns.join(',');
        } else if (i.columns) {
          //if indexes are configured as "columns"
          columns = i.columns;
        }
        if (kind && type) {
          sql.push('ADD ' + kind + ' INDEX ' + iName +
            ' (' + columns + ') ' + type);
        } else {
          sql.push('ADD ' + kind + ' INDEX ' + type + ' ' + iName +
            ' (' + columns + ')');
        }
      }
    });

    if (sql.length) {
      var query = 'ALTER TABLE ' + self.tableEscaped(model) + ' ' +
        sql.join(',\n');
      if (checkOnly) {
        done(null, true, {statements: sql, query: query});
      } else {
        this.execute(query, done);
      }
    } else {
      done();
    }

    function actualize(propName, oldSettings) {
      var newSettings = m.properties[propName];
      if (newSettings && changed(newSettings, oldSettings)) {
        var pName = self.client.escapeId(propName);
        sql.push('CHANGE COLUMN ' + pName + ' ' + pName + ' ' +
          self.buildColumnDefinition(model, propName));
      }
    }

    function changed(newSettings, oldSettings) {
      if (oldSettings.Null === 'YES') {
        // Used to allow null and does not now.
        if (!self.isNullable(newSettings)) {
          return true;
        }
      }
      if (oldSettings.Null === 'NO') {
        // Did not allow null and now does.
        if (self.isNullable(newSettings)) {
          return true;
        }
      }

      if (oldSettings.Type.toUpperCase() !==
        self.buildColumnType(newSettings).toUpperCase()) {
        return true;
      }
      return false;
    }

    function expectedColName(propName) {
      var mysql = m.properties[propName].mysql;
      if (typeof mysql === 'undefined') {
        return propName;
      }
      var colName = mysql.columnName;
      if (typeof colName === 'undefined') {
        return propName;
      }
      return colName;
    }
  };

  MySQL.prototype.buildColumnDefinitions =
    MySQL.prototype.propertiesSQL = function(model) {
      var self = this;

      var pks = this.idNames(model).map(function(i) {
        return self.columnEscaped(model, i);
      });

      var definition = this.getModelDefinition(model);
      var sql = [];
      if (pks.length === 1) {
        var idName = this.idName(model);
        var idProp = this.getModelDefinition(model).properties[idName];
        if (idProp.generated) {
          sql.push(self.columnEscaped(model, idName) +
            ' INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY');
        } else {
          idProp.nullable = false;
          sql.push(self.columnEscaped(model, idName) + ' ' +
            self.buildColumnDefinition(model, idName) + ' PRIMARY KEY');
        }
      }
      Object.keys(definition.properties).forEach(function(prop) {
        if (self.id(model, prop) && pks.length === 1) {
          return;
        }
        var colName = self.columnEscaped(model, prop);
        sql.push(colName + ' ' + self.buildColumnDefinition(model, prop));
      });
      if (pks.length > 1) {
        sql.push('PRIMARY KEY(' + pks.join(',') + ')');
      }

      var indexes = self.buildIndexes(model);
      indexes.forEach(function(i) {
        sql.push(i);
      });
      return sql.join(',\n  ');
    };

  MySQL.prototype.buildIndex = function(model, property) {
    var prop = this.getModelDefinition(model).properties[property];
    var i = prop && prop.index;
    if (!i) {
      return '';
    }
    var type = '';
    var kind = '';
    if (i.type) {
      type = 'USING ' + i.type;
    }
    if (i.kind) {
      kind = i.kind;
    }
    var columnName = this.columnEscaped(model, property);
    if (kind && type) {
      return (kind + ' INDEX ' + columnName + ' (' + columnName + ') ' + type);
    } else {
      if (typeof i === 'object' && i.unique && i.unique === true) {
        kind = 'UNIQUE';
      }
      return (kind + ' INDEX ' + columnName + ' ' + type + ' (' + columnName + ') ');
    }
  };

  MySQL.prototype.buildIndexes = function(model) {
    var self = this;
    var indexClauses = [];
    var definition = this.getModelDefinition(model);
    var indexes = definition.settings.indexes || {};
    // Build model level indexes
    for (var index in  indexes) {
      var i = indexes[index];
      var type = '';
      var kind = '';
      if (i.type) {
        type = 'USING ' + i.type;
      }
      if (i.kind) {
        //if index uniqueness is configured as "kind"
        kind = i.kind;
      } else if (i.options && i.options.unique && i.options.unique == true) {
        //if index unique indicator is configured
        kind = 'UNIQUE';
      }
      var indexedColumns = [];
      var indexName = this.escapeName(index);
      var columns = '';
      //if indexes are configured as "keys"
      if (i.keys) {
        //for each field in "keys" object
        for (var key in i.keys) {
          if (i.keys[key] !== -1) {
            indexedColumns.push(key);
          } else {
            //mysql does not support index sorting Currently
            //but mysql has added DESC keyword for future support
            indexedColumns.push(key + ' DESC ');
          }
        }
      }
      if (indexedColumns.length) {
        columns = indexedColumns.join(',');
      } else if (i.columns) {
        columns = i.columns;
      }
      if (columns.length) {
        if (kind && type) {
          indexClauses.push(kind + ' INDEX ' +
          indexName + ' (' + columns + ') ' + type);
        } else {
          indexClauses.push(kind + ' INDEX ' + type +
          ' ' + indexName + ' (' + columns + ')');
        }
      }
    }
    // Define index for each of the properties
    for (var p in definition.properties) {
      var propIndex = self.buildIndex(model, p);
      if (propIndex) {
        indexClauses.push(propIndex);
      }
    }
    return indexClauses;
  };

  MySQL.prototype.buildColumnDefinition = function(model, prop) {
    var p = this.getModelDefinition(model).properties[prop];
    var line = this.columnDataType(model, prop) + ' ' +
      (this.isNullable(p) ? 'NULL' : 'NOT NULL');
    return line;
  };

  MySQL.prototype.columnDataType = function(model, property) {
    var columnMetadata = this.columnMetadata(model, property);
    var colType = columnMetadata && columnMetadata.dataType;
    if (colType) {
      colType = colType.toUpperCase();
    }
    var prop = this.getModelDefinition(model).properties[property];
    if (!prop) {
      return null;
    }
    var colLength = columnMetadata && columnMetadata.dataLength ||
      prop.length || prop.limit;
    if (colType && colLength) {
      return colType + '(' + colLength + ')';
    }
    return this.buildColumnType(prop);
  };

  MySQL.prototype.buildColumnType = function buildColumnType(propertyDefinition) {
    var dt = '';
    var p = propertyDefinition;
    switch (p.type.name) {
      default:
      case 'JSON':
      case 'Object':
      case 'Any':
      case 'Text':
        dt = columnType(p, 'TEXT');
        dt = stringOptionsByType(p, dt);
        break;
      case 'String':
        dt = columnType(p, 'VARCHAR');
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
  };

  function columnType(p, defaultType) {
    var dt = defaultType;
    if (p.dataType) {
      dt = String(p.dataType);
    }
    return dt;
  }

  function stringOptionsByType(p, columnType) {
    switch (columnType.toLowerCase()) {
      default:
      case 'varchar':
        // The maximum length for an ID column is 1000 bytes
        // The maximum row size is 64K
        var len = p.length || p.limit ||
          ((p.type !== String) ? 4096 : p.id || p.index ? 255 : 512);
        columnType += '(' + len + ')';
        break;
      case 'char':
        len = p.length || p.limit || 255;
        columnType += '(' + len + ')';
        break;

      case 'text':
      case 'tinytext':
      case 'mediumtext':
      case 'longtext':

        break;
    }
    columnType = stringOptions(p, columnType);
    return columnType;
  }

  function stringOptions(p, columnType) {
    if (p.charset) {
      columnType += ' CHARACTER SET ' + p.charset;
    }
    if (p.collation) {
      columnType += ' COLLATE ' + p.collation;
    }
    return columnType;
  }

  function numericOptionsByType(p, columnType) {
    switch (columnType.toLowerCase()) {
      default:
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
      case 'int':
      case 'integer':
      case 'bigint':
        columnType = integerOptions(p, columnType);
        break;

      case 'decimal':
      case 'numeric':
        columnType = fixedPointOptions(p, columnType);
        break;

      case 'float':
      case 'double':
        columnType = floatingPointOptions(p, columnType);
        break;
    }
    columnType = unsigned(p, columnType);
    return columnType;
  }

  function floatingPointOptions(p, columnType) {
    var precision = 16;
    var scale = 8;
    if (p.precision) {
      precision = Number(p.precision);
    }
    if (p.scale) {
      scale = Number(p.scale);
    }
    if (p.precision && p.scale) {
      columnType += '(' + precision + ',' + scale + ')';
    } else if (p.precision) {
      columnType += '(' + precision + ')';
    }
    return columnType;
  }

  /*  @TODO: Change fixed point to use an arbitrary precision arithmetic library.     */
  /*  Currently fixed point will lose precision because it's turned to non-fixed in   */
  /*  JS. Also, defaulting column to (9,2) and not allowing non-specified 'DECIMAL'   */
  /*  declaration which would default to DECIMAL(10,0). Instead defaulting to (9,2).  */
  function fixedPointOptions(p, columnType) {
    var precision = 9;
    var scale = 2;
    if (p.precision) {
      precision = Number(p.precision);
    }
    if (p.scale) {
      scale = Number(p.scale);
    }
    columnType += '(' + precision + ',' + scale + ')';
    return columnType;
  }

  function integerOptions(p, columnType) {
    var tmp = 0;
    if (p.display || p.limit) {
      tmp = Number(p.display || p.limit);
    }
    if (tmp > 0) {
      columnType += '(' + tmp + ')';
    } else if (p.unsigned) {
      switch (columnType.toLowerCase()) {
        default:
        case 'int':
          columnType += '(10)';
          break;
        case 'mediumint':
          columnType += '(8)';
          break;
        case 'smallint':
          columnType += '(5)';
          break;
        case 'tinyint':
          columnType += '(3)';
          break;
        case 'bigint':
          columnType += '(20)';
          break;
      }
    } else {
      switch (columnType.toLowerCase()) {
        default:
        case 'int':
          columnType += '(11)';
          break;
        case 'mediumint':
          columnType += '(9)';
          break;
        case 'smallint':
          columnType += '(6)';
          break;
        case 'tinyint':
          columnType += '(4)';
          break;
        case 'bigint':
          columnType += '(20)';
          break;
      }
    }
    return columnType;
  }

  function unsigned(p, columnType) {
    if (p.unsigned) {
      columnType += ' UNSIGNED';
    }
    return columnType;
  }
}
