process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;
var db;

before(function() {
    var config = require('rc')('loopback', {dev: {mysql: {}}}).dev.mysql;
    db = new DataSource(require('../'), config);
});

describe('discoverModels', function() {
  describe('Discover models including views', function() {
    it('should return an array of tables and views', function(done) {

      db.discoverModelDefinitions({
        views : true,
        limit : 3
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

  describe('Discover models excluding views', function() {
    it('should return an array of only tables', function(done) {

      db.discoverModelDefinitions({
        views : false,
        limit : 3
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
      all : true,
      limit : 3
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
    it('should return an array of columns for PRODUCT', function(done) {
      db.discoverModelProperties('PRODUCT', function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          models.forEach(function(m) {
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
        db.discoverPrimaryKeys('PRODUCT',function (err, models) {
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
        db.discoverForeignKeys('INVENTORY',function (err, models) {
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
            // console.log('%j', schema);
            assert(schema.name === 'Inventory');
            assert(schema.options.mysql.schema === 'STRONGLOOP');
            assert(schema.options.mysql.table === 'INVENTORY');
            assert(schema.properties.productId);
            assert(schema.properties.productId.type === 'String');
            assert(schema.properties.productId.mysql.columnName === 'PRODUCT_ID');
            assert(schema.properties.locationId);
            assert(schema.properties.locationId.type === 'String');
            assert(schema.properties.locationId.mysql.columnName === 'LOCATION_ID');
            assert(schema.properties.available);
            assert(schema.properties.available.type === 'Number');
            assert(schema.properties.total);
            assert(schema.properties.total.type === 'Number');
            done(null, schema);
        });
    });
});
