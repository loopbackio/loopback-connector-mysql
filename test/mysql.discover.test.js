// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;
var db, config;

before(function () {
  require('./init');
  config = getConfig();
  config.database = 'STRONGLOOP';
  db = new DataSource(require('../'), config);
});

describe('discoverModels', function () {
  describe('Discover database schemas', function() {
    it('should return an array of db schemas', function(done) {
      db.connector.discoverDatabaseSchemas(function(err, schemas) {
        if (err) return done(err);
        schemas.should.be.an.array;
        schemas.length.should.be.above(0);
        done();
      });
    });
  });

  describe('Discover models including views', function () {
    it('should return an array of tables and views', function (done) {

      db.discoverModelDefinitions({
        views: true,
        limit: 3
      }, function (err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function (m) {
            // console.dir(m);
            if (m.type === 'view') {
              views = true;
            }
          });
          assert(views, 'Should have views');
          done(null, models);
        }
      });
    });
  });

  describe('Discover current user\'s tables', function () {
    it('should return an array of tables for the current user', function (done) {

      db.discoverModelDefinitions({
        limit: 3
      }, function (err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function (m) {
            assert.equal(m.owner, config.username);
          });
          done(null, models);
        }
      });
    });
  });

  describe('Discover models excluding views', function () {
    // TODO: this test assumes the current user owns the tables
    it.skip('should return an array of only tables', function (done) {

      db.discoverModelDefinitions({
        views: false,
        limit: 3
      }, function (err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function (m) {
            // console.dir(m);
            if (m.type === 'view') {
              views = true;
            }
          });
          models.should.have.length(3);
          assert(!views, 'Should not have views');
          done(null, models);
        }
      });
    });
  });
});

describe('Discover models including other users', function () {
  it('should return an array of all tables and views', function (done) {

    db.discoverModelDefinitions({
      all: true,
      limit: 3
    }, function (err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        var others = false;
        models.forEach(function (m) {
          // console.dir(m);
          if (m.owner !== 'STRONGLOOP') {
            others = true;
          }
        });
        assert(others, 'Should have tables/views owned by others');
        done(err, models);
      }
    });
  });
});

describe('Discover model properties', function () {
  describe('Discover a named model', function () {
    it('should return an array of columns for PRODUCT', function (done) {
      db.discoverModelProperties('PRODUCT', function (err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          models.forEach(function (m) {
            // console.dir(m);
            assert(m.tableName === 'PRODUCT');
          });
          done(null, models);
        }
      });
    });
  });

});

describe('Discover model primary keys', function () {
  it('should return an array of primary keys for PRODUCT', function (done) {
    db.discoverPrimaryKeys('PRODUCT', function (err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function (m) {
          // console.dir(m);
          assert(m.tableName === 'PRODUCT');
        });
        done(null, models);
      }
    });
  });

  it('should return an array of primary keys for STRONGLOOP.PRODUCT', function (done) {
    db.discoverPrimaryKeys('PRODUCT', {owner: 'STRONGLOOP'}, function (err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function (m) {
          // console.dir(m);
          assert(m.tableName === 'PRODUCT');
        });
        done(null, models);
      }
    });
  });
});

describe('Discover model foreign keys', function () {
  it('should return an array of foreign keys for INVENTORY', function (done) {
    db.discoverForeignKeys('INVENTORY', function (err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function (m) {
          // console.dir(m);
          assert(m.fkTableName === 'INVENTORY');
        });
        done(null, models);
      }
    });
  });
  it('should return an array of foreign keys for STRONGLOOP.INVENTORY', function (done) {
    db.discoverForeignKeys('INVENTORY', {owner: 'STRONGLOOP'}, function (err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function (m) {
          // console.dir(m);
          assert(m.fkTableName === 'INVENTORY');
        });
        done(null, models);
      }
    });
  });
});

describe('Discover LDL schema from a table', function () {
  it('should return an LDL schema for INVENTORY', function (done) {
    db.discoverSchema('INVENTORY', {owner: 'STRONGLOOP'}, function (err, schema) {
      var productId = 'productId' in schema.properties ? 'productId' : 'productid';
      var locationId = 'locationId' in schema.properties ? 'locationId' : 'locationid';
      console.error('schema:', schema);
      assert.strictEqual(schema.name, 'Inventory');
      assert.ok(/STRONGLOOP/i.test(schema.options.mysql.schema));
      assert.strictEqual(schema.options.mysql.table, 'INVENTORY');
      assert(schema.properties[productId]);
      // TODO: schema shows this field is default NULL, which means it isn't required
      // assert(schema.properties[productId].required);
      assert.strictEqual(schema.properties[productId].type, 'String');
      assert.strictEqual(schema.properties[productId].mysql.columnName, 'productId');
      assert(schema.properties[locationId]);
      assert.strictEqual(schema.properties[locationId].type, 'String');
      assert.strictEqual(schema.properties[locationId].mysql.columnName, 'locationId');
      assert(schema.properties.available);
      assert.strictEqual(schema.properties.available.required, false);
      assert.strictEqual(schema.properties.available.type, 'Number');
      assert(schema.properties.total);
      assert.strictEqual(schema.properties.total.type, 'Number');
      done(null, schema);
    });
  });
});

describe('Discover and build models', function () {
  it('should discover and build models', function (done) {
    db.discoverAndBuildModels('INVENTORY', {owner: 'STRONGLOOP', visited: {}, associations: true}, function (err, models) {
      assert(models.Inventory, 'Inventory model should be discovered and built');
      var schema = models.Inventory.definition;
      var productId = 'productId' in schema.properties ? 'productId' : 'productid';
      var locationId = 'locationId' in schema.properties ? 'locationId' : 'locationid';
      assert(/STRONGLOOP/i.test(schema.settings.mysql.schema));
      assert.strictEqual(schema.settings.mysql.table, 'INVENTORY');
      assert(schema.properties[productId]);
      assert.strictEqual(schema.properties[productId].type, String);
      assert.strictEqual(schema.properties[productId].mysql.columnName, 'productId');
      assert(schema.properties[locationId]);
      assert.strictEqual(schema.properties[locationId].type, String);
      assert.strictEqual(schema.properties[locationId].mysql.columnName, 'locationId');
      assert(schema.properties.available);
      assert.strictEqual(schema.properties.available.type, Number);
      assert(schema.properties.total);
      assert.strictEqual(schema.properties.total.type, Number);
      models.Inventory.findOne(function (err, inv) {
        assert(!err, 'error should not be reported');
        done();
      });
    });
  });
});
