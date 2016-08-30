// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
require('./init');
var ds;

before(function() {
  ds = getDataSource();
});

describe('MySQL connector', function() {
  before(function() {
    setupAltColNameData();
  });

  it('should auto migrate/update tables', function(done) {
    var schema_v1 =
      {
        'name': 'CustomerTest',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'customer_test',
          },
          'indexes': {
            'name_index': {
              'keys': {
                'name': 1,
              },
              'options': {
                'unique': true,
              },
            },
          },
        },
        'properties': {
          'id': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'name': {
            'type': 'String',
            'required': false,
            'length': 40,
          },
          'email': {
            'type': 'String',
            'required': true,
            'length': 40,
          },
          'age': {
            'type': 'Number',
            'required': false,
          },
        },
      };

    var schema_v2 =
      {
        'name': 'CustomerTest',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'customer_test',
          },
          'indexes': {
            'updated_name_index': {
              'keys': {
                'firstName': 1,
                'lastName': -1,
              },
              'options': {
                'unique': true,
              },
            },
          },
        },
        'properties': {
          'id': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'email': {
            'type': 'String',
            'required': false,
            'length': 60,
            'mysql': {
              'columnName': 'email',
              'dataType': 'varchar',
              'dataLength': 60,
              'nullable': 'YES',
            },
          },
          'firstName': {
            'type': 'String',
            'required': false,
            'length': 40,
          },
          'lastName': {
            'type': 'String',
            'required': false,
            'length': 40,
          },
        },
      };

    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    ds.automigrate(function() {
      ds.discoverModelProperties('customer_test', function(err, props) {
        assert.equal(props.length, 4);
        var names = props.map(function(p) {
          return p.columnName;
        });
        assert.equal(props[0].nullable, 'N');
        assert.equal(props[1].nullable, 'Y');
        assert.equal(props[2].nullable, 'N');
        assert.equal(props[3].nullable, 'Y');
        assert.equal(names[0], 'id');
        assert.equal(names[1], 'name');
        assert.equal(names[2], 'email');
        assert.equal(names[3], 'age');

        ds.connector.execute('SHOW INDEXES FROM customer_test', function(err, indexes) {
          if (err) return done (err);
          assert(indexes);
          assert(indexes.length.should.be.above(1));
          assert.equal(indexes[1].Key_name, 'name_index');
          assert.equal(indexes[1].Non_unique, 0);
          ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);
          ds.autoupdate(function(err, result) {
            if (err) return done (err);
            ds.discoverModelProperties('customer_test', function(err, props) {
              if (err) return done (err);
              assert.equal(props.length, 4);
              var names = props.map(function(p) {
                return p.columnName;
              });
              assert.equal(names[0], 'id');
              assert.equal(names[1], 'email');
              assert.equal(names[2], 'firstName');
              assert.equal(names[3], 'lastName');
              ds.connector.execute('SHOW INDEXES FROM customer_test', function(err, updatedindexes) {
                if (err) return done (err);
                assert(updatedindexes);
                assert(updatedindexes.length.should.be.above(2));
                assert.equal(updatedindexes[1].Key_name, 'updated_name_index');
                assert.equal(updatedindexes[2].Key_name, 'updated_name_index');
                //Mysql supports only index sorting in ascending; DESC is ignored
                assert.equal(updatedindexes[1].Collation, 'A');
                assert.equal(updatedindexes[2].Collation, 'A');
                assert.equal(updatedindexes[1].Non_unique, 0);
                done(err, result);
              });
            });
          });
        });
      });
    });
  });

  function setupAltColNameData() {
    var schema = {
      name: 'ColRenameTest',
      options: {
        idInjection: false,
        mysql: {
          schema: 'myapp_test',
          table: 'col_rename_test',
        },
      },
      properties: {
        firstName: {
          type: 'String',
          required: false,
          length: 40,
          mysql: {
            columnName: 'first_name',
            dataType: 'varchar',
            dataLength: 40,
          },
        },
        lastName: {
          type: 'String',
          required: false,
          length: 40,
        },
      },
    };
    ds.createModel(schema.name, schema.properties, schema.options);
  }

  it('should report errors for automigrate', function(done) {
    ds.automigrate('XYZ', function(err) {
      assert(err);
      done();
    });
  });

  it('should report errors for autoupdate', function(done) {
    ds.autoupdate('XYZ', function(err) {
      assert(err);
      done();
    });
  });

  it('"mysql.columnName" is updated with correct name on create table', function(done) {
    // first autoupdate call uses create table
    verifyMysqlColumnNameAutoupdate(done);
  });

  it('"mysql.columnName" is updated without changing column name on alter table', function(done) {
    // second autoupdate call uses alter table
    verifyMysqlColumnNameAutoupdate(done);
  });

  function verifyMysqlColumnNameAutoupdate(done) {
    ds.autoupdate('ColRenameTest', function(err) {
      ds.discoverModelProperties('col_rename_test', function(err, props) {
        assert.equal(props[0].columnName, 'first_name');
        assert.equal(props[1].columnName, 'lastName');
        assert.equal(props.length, 2);
        done();
      });
    });
  }
});
