var assert = require('assert');
require('./init');
var ds;

before(function () {
  ds = getDataSource();
});

describe('MySQL connector', function () {
  it('should auto migrate/update tables', function (done) {

    var schema_v1 =
    {
      "name": "CustomerTest",
      "options": {
        "idInjection": false,
        "mysql": {
          "schema": "myapp_test",
          "table": "customer_test"
        }
      },
      "properties": {
        "id": {
          "type": "String",
          "length": 20,
          "id": 1
        },
        "name": {
          "type": "String",
          "required": false,
          "length": 40
        },
        "email": {
          "type": "String",
          "required": true,
          "length": 40
        },
        "age": {
          "type": "Number",
          "required": false
        }
      }
    }

    var schema_v2 =
    {
      "name": "CustomerTest",
      "options": {
        "idInjection": false,
        "mysql": {
          "schema": "myapp_test",
          "table": "customer_test"
        }
      },
      "properties": {
        "id": {
          "type": "String",
          "length": 20,
          "id": 1
        },
        "email": {
          "type": "String",
          "required": false,
          "length": 60,
          "mysql": {
            "columnName": "email",
            "dataType": "varchar",
            "dataLength": 60,
            "nullable": "YES"
          }
        },
        "firstName": {
          "type": "String",
          "required": false,
          "length": 40
        },
        "lastName": {
          "type": "String",
          "required": false,
          "length": 40
        }
      }
    }

    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

    ds.automigrate(function () {

      ds.discoverModelProperties('customer_test', function (err, props) {
        assert.equal(props.length, 4);
        var names = props.map(function (p) {
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

        ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);

        ds.autoupdate(function (err, result) {
          ds.discoverModelProperties('customer_test', function (err, props) {
            assert.equal(props.length, 4);
            var names = props.map(function (p) {
              return p.columnName;
            });
            assert.equal(names[0], 'id');
            assert.equal(names[1], 'email');
            assert.equal(names[2], 'firstName');
            assert.equal(names[3], 'lastName');
            done(err, result);
          });
        });
      });
    });
  });

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

});

