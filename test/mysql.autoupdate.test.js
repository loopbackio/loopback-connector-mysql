// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const assert = require('assert');
require('./init');
let ds;

before(function() {
  ds = global.getDataSource();
});

describe('MySQL connector', function() {
  before(function() {
    setupAltColNameData();
  });

  describe('escape index names upon automigrate', function() {
    before(function(done) {
      const messageSchema = {
        'name': 'Message',
        'options': {
          'idInjection': false,
          'indexes': {
            'id_index': {
              'keys': {
                'id': 1,
              },
            },
            'from_index': {
              'keys': {
                'from': 1,
              },
            },
          },
        },
        'properties': {
          'id': {
            'type': 'number',
            'id': true,
            'generated': false,
          },
          'conversation': {
            'type': 'string',
          },
          'from': {
            'type': 'number',
          },
          'sent': {
            'type': 'date',
          },
        },
      };
      ds.createModel(messageSchema.name, messageSchema.properties, messageSchema.options);
      done();
    });
    it('should escape index names', function(done) {
      // please note `from` is a keyword in mysql https://dev.mysql.com/doc/refman/5.7/en/keywords.html
      // hence it needs to be escaped in order for it to work
      // instead of escaping the special keywords, we escape all index names
      ds.automigrate('Message', function(err) {
        assert(!err);
        done();
      });
    });
  });

  it('should auto migrate/update tables', function(done) {
    const schema_v1 = {
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

    const schema_v2 = {
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

    ds.automigrate(function(err) {
      if (err) return done(err);
      ds.isActual(function(err, isActual) {
        if (err) return done(err);
        assert(isActual, 'isActual should return true after automigrate');
        ds.discoverModelProperties('customer_test', function(err, props) {
          assert.equal(props.length, 5);
          // Mysql versions on different OS versions return results in different orders
          props.sort(function(a, b) {
            return a.columnName > b.columnName ? 1 : -1;
          });
          const names = props.map(function(p) {
            return p.columnName;
          });

          assert.equal(names[0], 'age');
          assert.equal(names[1], 'customer_discount');
          assert.equal(names[2], 'email');
          assert.equal(names[3], 'id');
          assert.equal(names[4], 'name');
          assert.equal(props[0].nullable, 'Y');
          assert.equal(props[1].nullable, 'Y');
          assert.equal(props[2].nullable, 'N');
          assert.equal(props[3].nullable, 'N');
          assert.equal(props[4].nullable, 'Y');

          ds.connector.execute('SHOW INDEXES FROM customer_test', function(err, indexes) {
            if (err) return done(err);
            assert(indexes);
            assert(indexes.length.should.be.above(1));
            assert.equal(indexes[1].Key_name, 'name_index');
            assert.equal(indexes[1].Non_unique, 0);
            ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);
            ds.autoupdate(function(err, result) {
              if (err) return done(err);
              ds.isActual(function(err, isActual) {
                if (err) return done(err);
                assert(isActual, 'isActual should return true after autoupdate');
                ds.discoverModelProperties('customer_test', function(err, props) {
                  if (err) return done(err);
                  assert.equal(props.length, 7);
                  // Mysql versions on different OS versions return results in different orders
                  props.sort(function(a, b) {
                    return a.columnName > b.columnName ? 1 : -1;
                  });
                  const names = props.map(function(p) {
                    return p.columnName;
                  });
                  assert.equal(names[0], 'customer_address');
                  assert.equal(names[1], 'customer_code');
                  assert.equal(names[2], 'customer_discount');
                  assert.equal(names[3], 'email');
                  assert.equal(names[4], 'firstName');
                  assert.equal(names[5], 'id');
                  assert.equal(names[6], 'lastName');
                  ds.connector.execute('SHOW INDEXES FROM customer_test', function(err, updatedindexes) {
                    if (err) return done(err);
                    assert(updatedindexes);
                    assert(updatedindexes.length.should.be.above(3));
                    assert.equal(updatedindexes[1].Key_name, 'code');
                    assert.equal(updatedindexes[1].Column_name, 'customer_code');
                    assert.equal(updatedindexes[2].Key_name, 'updated_name_index');
                    assert.equal(updatedindexes[3].Key_name, 'updated_name_index');
                    assert.equal(updatedindexes[1].Collation, 'A');
                    assert.equal(updatedindexes[2].Collation, 'A');
                    // MySQL8 supports descending indexes:
                    // DESC in an index definition is no longer ignored but causes storage of key values in descending order.
                    assert.equal(updatedindexes[3].Collation, 'D');
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
    });
  });

  it('should auto migrate/update foreign keys in tables', function(done) {
    const customer2_schema = {
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
    const customer3_schema = {
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

    const schema_v1 = {
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
        },
        'description': {
          'type': 'String',
          'required': false,
          'length': 40,
        },
      },
    };

    const schema_v2 = {
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
          'mysql': {
            'columnName': 'customer_id',
          },
        },
        'description': {
          'type': 'String',
          'required': false,
          'length': 40,
        },
      },
    };

    const schema_v3 = {
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
          'mysql': {
            'columnName': 'customer_id',
          },
        },
        'description': {
          'type': 'String',
          'required': false,
          'length': 40,
        },
      },
    };

    const foreignKeySelect =
      'SELECT COLUMN_NAME,CONSTRAINT_NAME,REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME ' +
      'FROM   INFORMATION_SCHEMA.KEY_COLUMN_USAGE ' +
      'WHERE  REFERENCED_TABLE_SCHEMA = "myapp_test" ' +
      'AND   TABLE_NAME = "order_test"';

    ds.createModel(customer2_schema.name, customer2_schema.properties, customer2_schema.options);
    ds.createModel(customer3_schema.name, customer3_schema.properties, customer3_schema.options);
    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    // do initial update/creation of table
    ds.autoupdate(function(err) {
      assert(!err, err);
      ds.discoverModelProperties('order_test', function(err, props) {
        // validate that we have the correct number of properties
        assert.equal(props.length, 3);

        // get the foreign keys for this table
        ds.connector.execute(foreignKeySelect, function(err, foreignKeys) {
          if (err) return done(err);
          // validate that the foreign key exists and points to the right column
          assert(foreignKeys);
          assert(foreignKeys.length.should.be.equal(1));
          assert.equal(foreignKeys[0].REFERENCED_TABLE_NAME, 'customer_test3');
          assert.equal(foreignKeys[0].COLUMN_NAME, 'customerId');
          assert.equal(foreignKeys[0].CONSTRAINT_NAME, 'fk_ordertest_customerId');
          assert.equal(foreignKeys[0].REFERENCED_COLUMN_NAME, 'id');

          // update our model (move foreign key) and run autoupdate to migrate
          ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);
          ds.autoupdate(function(err, result) {
            if (err) return done(err);

            ds.isActual(function(err, isEqual) {
              if (err) return done(err);
              assert(isEqual, 'Should be actual after autoupdate');

              // get and validate the properties on this model
              ds.discoverModelProperties('order_test', function(err, props) {
                if (err) return done(err);

                assert.equal(props.length, 3);

                // get the foreign keys that exist after the migration
                ds.connector.execute(foreignKeySelect, function(err, updatedForeignKeys) {
                  if (err) return done(err);
                  // validate that the foreign keys was moved to the new column
                  assert(updatedForeignKeys);
                  assert(updatedForeignKeys.length.should.be.equal(1));
                  assert.equal(updatedForeignKeys[0].REFERENCED_TABLE_NAME, 'customer_test2');
                  assert.equal(updatedForeignKeys[0].COLUMN_NAME, 'customer_id');
                  assert.equal(updatedForeignKeys[0].CONSTRAINT_NAME, 'fk_ordertest_customerId');
                  assert.equal(updatedForeignKeys[0].REFERENCED_COLUMN_NAME, 'id');

                  // update model (to drop foreign key) and autoupdate
                  ds.createModel(schema_v3.name, schema_v3.properties, schema_v3.options);
                  ds.autoupdate(function(err, result) {
                    if (err) return done(err);
                    // validate the properties
                    ds.discoverModelProperties('order_test', function(err, props) {
                      if (err) return done(err);

                      assert.equal(props.length, 3);

                      // get the foreign keys and validate the foreign key has been dropped
                      ds.connector.execute(foreignKeySelect, function(err, thirdForeignKeys) {
                        if (err) return done(err);
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
  });

  it('should auto migrate/update foreign keys in tables multiple times without error', function(done) {
    const customer3_schema = {
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

    const schema_v1 = {
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
        },
        'description': {
          'type': 'String',
          'required': false,
          'length': 40,
        },
      },
    };

    ds.createModel(customer3_schema.name, customer3_schema.properties, customer3_schema.options);
    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    // do initial update/creation of table
    ds.autoupdate(function(err) {
      assert(!err, err);
      ds.isActual(function(err, isActual) {
        if (err) return done(err);
        assert(isActual, 'isActual should be true after autoupdate');
        ds.autoupdate(function(err) {
          return done(err);
        });
      });
    });
  });

  it('should auto migrate/update foreign keys with onUpdate and onDelete in tables', function(done) {
    const customer2_schema = {
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

    const schema_v1 = {
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
            'onUpdate': 'no action',
            'onDelete': 'cascade',
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
        },
        'description': {
          'type': 'String',
          'required': false,
          'length': 40,
        },
      },
    };

    const schema_v2 = {
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
            'onUpdate': 'restrict',
            'onDelete': 'restrict',
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
        },
        'description': {
          'type': 'String',
          'required': false,
          'length': 40,
        },
      },
    };

    const foreignKeySelect =
    'SELECT COLUMN_NAME,CONSTRAINT_NAME,REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME ' +
    'FROM   INFORMATION_SCHEMA.KEY_COLUMN_USAGE ' +
    'WHERE  REFERENCED_TABLE_SCHEMA = "myapp_test" ' +
    'AND   TABLE_NAME = "order_test"';
    const getCreateTable = 'SHOW CREATE TABLE `myapp_test`.`order_test`';

    ds.createModel(customer2_schema.name, customer2_schema.properties, customer2_schema.options);
    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    // do initial update/creation of table
    ds.autoupdate(function(err) {
      assert(!err, err);
      ds.discoverModelProperties('order_test', function(err, props) {
        // validate that we have the correct number of properties
        assert.equal(props.length, 3);

        // get the foreign keys for this table
        ds.connector.execute(foreignKeySelect, function(err, foreignKeys) {
          if (err) return done(err);
          // validate that the foreign key exists and points to the right column
          assert(foreignKeys);
          assert(foreignKeys.length.should.be.equal(1));
          assert.equal(foreignKeys[0].REFERENCED_TABLE_NAME, 'customer_test2');
          assert.equal(foreignKeys[0].COLUMN_NAME, 'customerId');
          assert.equal(foreignKeys[0].CONSTRAINT_NAME, 'fk_ordertest_customerId');
          assert.equal(foreignKeys[0].REFERENCED_COLUMN_NAME, 'id');

          // get the create table for this table
          ds.connector.execute(getCreateTable, function(err, createTable) {
            if (err) return done(err);
            // validate that the foreign key exists and points to the right column
            assert(createTable);
            assert(createTable.length.should.be.equal(1));
            assert(/ON DELETE CASCADE/.test(createTable[0]['Create Table']), 'Constraint must have correct trigger');

            ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);
            ds.isActual(function(err, isActual) {
              if (err) return done(err);
              assert(!isActual, 'isActual should return false before autoupdate');
              ds.autoupdate(function(err) {
                if (err) return done(err);
                ds.isActual(function(err, isActual) {
                  if (err) return done(err);
                  assert(isActual, 'isActual should be true after autoupdate');
                  ds.connector.execute(getCreateTable, function(err, createTable) {
                    if (err) return done(err);
                    assert(createTable);
                    assert(createTable.length.should.be.equal(1));
                    assert(!/ON DELETE CASCADE ON UPDATE NO ACTION/.test(createTable[0]['Create Table']), 'Constraint must not have on delete trigger');
                    done(err, createTable);
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
    const schema = {
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

  it('should update the nullable property of "first_name" to false', function(done) {
    // update the model "required" property
    const schema = {
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
          required: true,
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

    // nullable should be updated to false
    ds.autoupdate('ColRenameTest', function(err) {
      assert.ifError(err);
      ds.discoverModelProperties('col_rename_test', function(err, props) {
        assert.equal(props[0].nullable, 'N');
        assert.equal(props[0].columnName, 'first_name');
        done();
      });
    });
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
