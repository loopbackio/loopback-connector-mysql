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
          'discount': {
            'type': 'Number',
            'required': false,
            'dataType': 'decimal',
            'precision': 10,
            'scale': 2,
            'mysql': {
              'columnName': 'customer_discount',
              'dataType': 'decimal',
              'dataPrecision': 10,
              'dataScale': 2,
            },
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
          // remove age
          // change data type details with column name
          'discount': {
            'type': 'Number',
            'required': false,
            'dataType': 'decimal',
            'precision': 12,
            'scale': 5,
            'mysql': {
              'columnName': 'customer_discount',
              'dataType': 'decimal',
              'dataPrecision': 12,
              'dataScale': 5,
            },
          },
          // add new column with column name
          'address': {
            'type': 'String',
            'required': false,
            'length': 10,
            'mysql': {
              'columnName': 'customer_address',
              'dataType': 'varchar',
              'length': 10,
            },
          },
          // add new column with index & column name
          'code': {
            'type': 'String',
            'required': true,
            'length': 12,
            'index': {
              unique: true,
            },
            'mysql': {
              'columnName': 'customer_code',
              'dataType': 'varchar',
              'length': 12,
            },
          },
        },
      };

    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    ds.automigrate(function() {
      ds.discoverModelProperties('customer_test', function(err, props) {
        assert.equal(props.length, 5);
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
        assert.equal(names[4], 'customer_discount');

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
              assert.equal(props.length, 7);
              var names = props.map(function(p) {
                return p.columnName;
              });
              assert.equal(names[0], 'id');
              assert.equal(names[1], 'email');
              assert.equal(names[2], 'customer_discount');
              assert.equal(names[3], 'firstName');
              assert.equal(names[4], 'lastName');
              assert.equal(names[5], 'customer_address');
              assert.equal(names[6], 'customer_code');
              ds.connector.execute('SHOW INDEXES FROM customer_test', function(err, updatedindexes) {
                if (err) return done (err);
                assert(updatedindexes);
                assert(updatedindexes.length.should.be.above(3));
                assert.equal(updatedindexes[1].Key_name, 'customer_code');
                assert.equal(updatedindexes[2].Key_name, 'updated_name_index');
                assert.equal(updatedindexes[3].Key_name, 'updated_name_index');
                //Mysql supports only index sorting in ascending; DESC is ignored
                assert.equal(updatedindexes[1].Collation, 'A');
                assert.equal(updatedindexes[2].Collation, 'A');
                assert.equal(updatedindexes[3].Collation, 'A');
                assert.equal(updatedindexes[1].Non_unique, 0);
                assert.equal(updatedindexes[2].Non_unique, 0);
                assert.equal(updatedindexes[3].Non_unique, 0);
                done(err, result);
              });
            });
          });
        });
      });
    });
  });

  it('should auto migrate/update foreign keys in tables', function(done) {
    var customer2_schema =
      {
        'name': 'CustomerTest2',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'customer_test2',
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
    var customer3_schema =
      {
        'name': 'CustomerTest3',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'customer_test3',
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

    var schema_v1 =
      {
        'name': 'OrderTest',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'order_test',
          },
          'foreignKeys': {
            'fk_ordertest_customerId': {
              'name': 'fk_ordertest_customerId',
              'entity': 'CustomerTest3',
              'entityKey': 'id',
              'foreignKey': 'customerId',
            },
          },
        },
        'properties': {
          'id': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'customerId': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'description': {
            'type': 'String',
            'required': false,
            'length': 40,
          },
        },
      };

    var schema_v2 =
      {
        'name': 'OrderTest',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'order_test',
          },
          'foreignKeys': {
            'fk_ordertest_customerId': {
              'name': 'fk_ordertest_customerId',
              'entity': 'CustomerTest2',
              'entityKey': 'id',
              'foreignKey': 'customerId',
            },
          },
        },
        'properties': {
          'id': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'customerId': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'description': {
            'type': 'String',
            'required': false,
            'length': 40,
          },
        },
      };

    var schema_v3 =
      {
        'name': 'OrderTest',
        'options': {
          'idInjection': false,
          'mysql': {
            'schema': 'myapp_test',
            'table': 'order_test',
          },
        },
        'properties': {
          'id': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'customerId': {
            'type': 'String',
            'length': 20,
            'id': 1,
          },
          'description': {
            'type': 'String',
            'required': false,
            'length': 40,
          },
        },
      };

    var foreignKeySelect =
      'SELECT COLUMN_NAME,CONSTRAINT_NAME,REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME ' +
      'FROM   INFORMATION_SCHEMA.KEY_COLUMN_USAGE ' +
      'WHERE  REFERENCED_TABLE_SCHEMA = "myapp_test" ' +
      'AND   TABLE_NAME = "order_test"';

    ds.createModel(customer2_schema.name, customer2_schema.properties, customer2_schema.options);
    ds.createModel(customer3_schema.name, customer3_schema.properties, customer3_schema.options);
    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    //do initial update/creation of table
    ds.autoupdate(function() {
      ds.discoverModelProperties('order_test', function(err, props) {
        //validate that we have the correct number of properties
        assert.equal(props.length, 3);

        //get the foreign keys for this table
        ds.connector.execute(foreignKeySelect, function(err, foreignKeys) {
          if (err) return done (err);
          //validate that the foreign key exists and points to the right column
          assert(foreignKeys);
          assert(foreignKeys.length.should.be.equal(1));
          assert.equal(foreignKeys[0].REFERENCED_TABLE_NAME, 'customer_test3');
          assert.equal(foreignKeys[0].COLUMN_NAME, 'customerId');
          assert.equal(foreignKeys[0].CONSTRAINT_NAME, 'fk_ordertest_customerId');
          assert.equal(foreignKeys[0].REFERENCED_COLUMN_NAME, 'id');

          //update our model (move foreign key) and run autoupdate to migrate
          ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);
          ds.autoupdate(function(err, result) {
            if (err) return done (err);

            //get and validate the properties on this model
            ds.discoverModelProperties('order_test', function(err, props) {
              if (err) return done (err);

              assert.equal(props.length, 3);

              //get the foreign keys that exist after the migration
              ds.connector.execute(foreignKeySelect, function(err, updatedForeignKeys) {
                if (err) return done (err);
                //validate that the foreign keys was moved to the new column
                assert(updatedForeignKeys);
                assert(updatedForeignKeys.length.should.be.equal(1));
                assert.equal(updatedForeignKeys[0].REFERENCED_TABLE_NAME, 'customer_test2');
                assert.equal(updatedForeignKeys[0].COLUMN_NAME, 'customerId');
                assert.equal(updatedForeignKeys[0].CONSTRAINT_NAME, 'fk_ordertest_customerId');
                assert.equal(updatedForeignKeys[0].REFERENCED_COLUMN_NAME, 'id');

                //update model (to drop foreign key) and autoupdate
                ds.createModel(schema_v3.name, schema_v3.properties, schema_v3.options);
                ds.autoupdate(function(err, result) {
                  if (err) return done (err);
                  //validate the properties
                  ds.discoverModelProperties('order_test', function(err, props) {
                    if (err) return done (err);

                    assert.equal(props.length, 3);

                    //get the foreign keys and validate the foreign key has been dropped
                    ds.connector.execute(foreignKeySelect, function(err, thirdForeignKeys) {
                      if (err) return done (err);
                      assert(thirdForeignKeys);
                      assert(thirdForeignKeys.length.should.be.equal(0));

                      done(err, result);
                    });
                  });
                });
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
