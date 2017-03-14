// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;
var db, config;

before(function() {
  require('./init');
  config = getConfig();
  config.database = 'STRONGLOOP';
  db = new DataSource(require('../'), config);
});

describe('discoverModels', function() {
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

  describe('Discover models including views', function() {
    it('should return an array of tables and views', function(done) {
      db.discoverModelDefinitions({
        views: true,
        limit: 3,
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
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

  describe('Discover current user\'s tables', function() {
    it('should return an array of tables for the current user', function(done) {
      db.discoverModelDefinitions({
        limit: 3,
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
            assert.equal(m.owner, config.username);
          });
          done(null, models);
        }
      });
    });
  });

  describe('Discover models excluding views', function() {
    // TODO: this test assumes the current user owns the tables
    it.skip('should return an array of only tables', function(done) {
      db.discoverModelDefinitions({
        views: false,
        limit: 3,
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
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

describe('Discover models including other users', function() {
  it('should return an array of all tables and views', function(done) {
    db.discoverModelDefinitions({
      all: true,
      limit: 3,
    }, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        var others = false;
        models.forEach(function(m) {
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

describe('Discover model properties', function() {
  describe('Discover a named model', function() {
    it('should return an array of columns for product', function(done) {
      db.discoverModelProperties('product', function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          models.forEach(function(m) {
            // console.dir(m);
            assert(m.tableName === 'product');
          });
          done(null, models);
        }
      });
    });
  });
});

describe('Discover model primary keys', function() {
  it('should return an array of primary keys for product', function(done) {
    db.discoverPrimaryKeys('product', function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.tableName === 'product');
        });
        done(null, models);
      }
    });
  });

  it('should return an array of primary keys for STRONGLOOP.PRODUCT', function(done) {
    db.discoverPrimaryKeys('product', {owner: 'STRONGLOOP'}, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.tableName === 'product');
        });
        done(null, models);
      }
    });
  });
});

describe('Discover model foreign keys', function() {
  it('should return an array of foreign keys for INVENTORY', function(done) {
    db.discoverForeignKeys('INVENTORY', function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.fkTableName === 'INVENTORY');
        });
        done(null, models);
      }
    });
  });
  it('should return an array of foreign keys for STRONGLOOP.INVENTORY', function(done) {
    db.discoverForeignKeys('INVENTORY', {owner: 'STRONGLOOP'}, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.fkTableName === 'INVENTORY');
        });
        done(null, models);
      }
    });
  });
});

describe('Discover model generated columns', function() {
  it('should return an array of columns for STRONGLOOP.PRODUCT and none of them is generated', function(done) {
    db.discoverModelProperties('product', function(err, models) {
      if (err) return done(err);
      models.forEach(function(model) {
        assert(model.tableName === 'product');
        assert(!model.generated, 'STRONGLOOP.PRODUCT table should not have generated (identity) columns');
      });
      done();
    });
  });
  it('should return an array of columns for STRONGLOOP.TESTGEN and the first is generated', function(done) {
    db.discoverModelProperties('testgen', function(err, models) {
      if (err) return done(err);
      models.forEach(function(model) {
        assert(model.tableName === 'testgen');
        if (model.columnName === 'ID') {
          assert(model.generated, 'STRONGLOOP.TESTGEN.ID should be a generated (identity) column');
        }
      });
      done();
    });
  });
});

describe('Discover LDL schema from a table', function() {
  var schema;
  before(function(done) {
    db.discoverSchema('INVENTORY', {owner: 'STRONGLOOP'}, function(err, schema_) {
      schema = schema_;
      done(err);
    });
  });
  it('should return an LDL schema for INVENTORY', function() {
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
    assert.strictEqual(schema.properties[productId].mysql.columnName, 'PRODUCT_ID');
    assert(schema.properties[locationId]);
    assert.strictEqual(schema.properties[locationId].type, 'String');
    assert.strictEqual(schema.properties[locationId].mysql.columnName, 'LOCATION_ID');
    assert(schema.properties.available);
    assert.strictEqual(schema.properties.available.required, false);
    assert.strictEqual(schema.properties.available.type, 'Number');
    assert(schema.properties.total);
    assert.strictEqual(schema.properties.total.type, 'Number');
  });
});

describe('Discover and build models', function() {
  var models;
  before(function(done) {
    db.discoverAndBuildModels('INVENTORY', {owner: 'STRONGLOOP', visited: {}, associations: true},
     function(err, models_) {
       models = models_;
       done(err);
     });
  });
  it('should discover and build models', function() {
    assert(models.Inventory, 'Inventory model should be discovered and built');
    var schema = models.Inventory.definition;
    var productId = 'productId' in schema.properties ? 'productId' : 'productid';
    var locationId = 'locationId' in schema.properties ? 'locationId' : 'locationid';
    assert(/STRONGLOOP/i.test(schema.settings.mysql.schema));
    assert.strictEqual(schema.settings.mysql.table, 'INVENTORY');
    assert(schema.properties[productId]);
    assert.strictEqual(schema.properties[productId].type, String);
    assert.strictEqual(schema.properties[productId].mysql.columnName, 'PRODUCT_ID');
    assert(schema.properties[locationId]);
    assert.strictEqual(schema.properties[locationId].type, String);
    assert.strictEqual(schema.properties[locationId].mysql.columnName, 'LOCATION_ID');
    assert(schema.properties.available);
    assert.strictEqual(schema.properties.available.type, Number);
    assert(schema.properties.total);
    assert.strictEqual(schema.properties.total.type, Number);
  });
  it('should be able to find an instance', function(done) {
    assert(models.Inventory, 'Inventory model must exist');
    models.Inventory.findOne(function(err, inv) {
      assert(!err, 'error should not be reported');
      done();
    });
  });

  describe('discoverModelProperties() flags', function() {
    context('with default flags', function() {
      var models, schema;
      before(discoverAndBuildModels);

      it('handles CHAR(1) as Boolean', function() {
        assert(schema.properties.enabled);
        assert.strictEqual(schema.properties.enabled.type, Boolean);
      });

      it('handles BIT(1) as Bit', function() {
        assert(schema.properties.disabled);
        assert.strictEqual(schema.properties.disabled.type, Buffer);
      });

      it('handles TINYINT(1) as Number', function() {
        assert(schema.properties.active);
        assert.strictEqual(schema.properties.active.type, Number);
      });

      function discoverAndBuildModels(done) {
        db.discoverAndBuildModels('INVENTORY', {
          owner: 'STRONGLOOP',
          visited: {},
          associations: true,
        }, function(err, models_) {
          models = models_;
          schema = models.Inventory.definition;
          done(err);
        });
      }
    });

    context('with flag treatCHAR1AsString = true', function() {
      var models, schema;
      before(discoverAndBuildModels);

      it('handles CHAR(1) as String', function() {
        assert(schema.properties.enabled);
        assert.strictEqual(schema.properties.enabled.type, String);
      });

      it('handles BIT(1) as Binary', function() {
        assert(schema.properties.disabled);
        assert.strictEqual(schema.properties.disabled.type, Buffer);
      });

      it('handles TINYINT(1) as Number', function() {
        assert(schema.properties.active);
        assert.strictEqual(schema.properties.active.type, Number);
      });

      function discoverAndBuildModels(done) {
        db.discoverAndBuildModels('INVENTORY', {
          owner: 'STRONGLOOP',
          visited: {},
          associations: true,
          treatCHAR1AsString: true,
        }, function(err, models_) {
          models = models_;
          schema = models.Inventory.definition;
          done(err);
        });
      }
    });

    context('with flag treatBIT1AsBit = false', function() {
      var models, schema;
      before(discoverAndBuildModels);

      it('handles CHAR(1) as Boolean', function() {
        assert(schema.properties.enabled);
        assert.strictEqual(schema.properties.enabled.type, Boolean);
      });

      it('handles BIT(1) as Boolean', function() {
        assert(schema.properties.disabled);
        assert.strictEqual(schema.properties.disabled.type, Boolean);
      });

      it('handles TINYINT(1) as Number', function() {
        assert(schema.properties.active);
        assert.strictEqual(schema.properties.active.type, Number);
      });

      function discoverAndBuildModels(done) {
        db.discoverAndBuildModels('INVENTORY', {
          owner: 'STRONGLOOP',
          visited: {},
          associations: true,
          treatBIT1AsBit: false,
        }, function(err, models_) {
          models = models_;
          schema = models.Inventory.definition;
          done(err);
        });
      }
    });

    context('with flag treatTINYINT1AsTinyInt = false', function() {
      var models, schema;
      before(discoverAndBuildModels);

      it('handles CHAR(1) as Boolean', function() {
        assert(schema.properties.enabled);
        assert.strictEqual(schema.properties.enabled.type, Boolean);
      });

      it('handles BIT(1) as Binary', function() {
        assert(schema.properties.disabled);
        assert.strictEqual(schema.properties.disabled.type, Buffer);
      });

      it('handles TINYINT(1) as Boolean', function() {
        assert(schema.properties.active);
        assert.strictEqual(schema.properties.active.type, Boolean);
      });

      function discoverAndBuildModels(done) {
        db.discoverAndBuildModels('INVENTORY', {
          owner: 'STRONGLOOP',
          visited: {},
          associations: true,
          treatTINYINT1AsTinyInt: false,
        }, function(err, models_) {
          if (err) return done(err);
          models = models_;
          schema = models.Inventory.definition;
          done();
        });
      }
    });
  });
});
