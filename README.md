## loopback-connector-mysql

`loopback-connector-mysql` is the MySQL connector module for [loopback-datasource-juggler](http://docs.strongloop.com/loopback-datasource-juggler/).

## Installation

````sh
npm install loopback-connector-mysql --save
````

## Usage

To use it you need `loopback-datasource-juggler`.

1. Setup dependencies in `package.json`:

    ```json
    {
      ...
      "dependencies": {
        "loopback-datasource-juggler": "latest",
        "loopback-connector-mysql": "latest"
      },
      ...
    }
    ```

2. Use:

    ```javascript
        var DataSource = require('loopback-datasource-juggler').DataSource;
        var dataSource = new DataSource('mysql', {
            host: 'localhost',
            port: 3306,
            database: 'mydb',
            username: 'myuser',
            password: 'mypass'
        });
    ```
    You can optionally pass a few additional parameters supported by [`node-mysql`](https://github.com/felixge/node-mysql),
    most particularly `password` and `collation`. `Collation` currently defaults
    to `utf8_general_ci`. The `collation` value will also be used to derive the
    connection charset.


## Data type mappings

`loopback-connector-mysql` uses the following rules to map between JSON types and MySQL data types.

### JSON to MySQL types

- String/JSON: VARCHAR
- Text: TEXT
- Number: INT
- Date: DATETIME
- BOOLEAN: TINYINT(1)
- Point/GeoPoint: POINT
- Enum: ENUM

### MySQL to JSON types

- CHAR: String
- CHAR(1): Boolean
- VARCHAR/TINYTEXT/MEDIUMTEXT/LONGTEXT/TEXT/ENUM/SET: String
- TINYBLOB/MEDIUMBLOB/LONGBLOB/BLOB/BINARY/VARBINARY/BIT: Binary
- TINYINT/SMALLINT/INT/MEDIUMINT/YEAR/FLOAT/DOUBLE/NUMERIC/DECIMAL: Number
- DATE/TIMESTAMP/DATETIME: Date

## Using the `dataType` field/column option with MySQL

`loopback-connector-mysql` allows mapping of LoopBack model properties to MYSQL columns using the 'mysql' property of the
 property definition. For example,

    "locationId":{
        "type":"String",
        "required":true,
        "length":20,
        "mysql":
        {
            "columnName":"LOCATION_ID",
            "dataType":"VARCHAR2",
            "dataLength":20,
            "nullable":"N"
        }
    }

`loopback-connector-mysql` also supports using the `dataType` column/property attribute to specify what MySQL column
type is used for many loopback-datasource-juggler types.

The following type-dataType combinations are supported:
- Number
  - integer
    - tinyint
    - smallint
    - mediumint
    - int
    - bigint
     
     Use the `limit` option to alter the display width.

     Example:
      `{ count : { type: Number, dataType: 'smallInt' }}`

  - floating point types
    - float
    - double
     
     Use the `precision` and `scale` options to specify custom precision. Default is (16,8).

     Example:
      `{ average : { type: Number, dataType: 'float', precision: 20, scale: 4 }}`

  - fixed-point exact value types
    - decimal
    - numeric

     Use the `precision` and `scale` options to specify custom precision. Default is (9,2).
     
     These aren't likely to function as true fixed-point.
     
     Example:
      `{ stdDev : { type: Number, dataType: 'decimal', precision: 12, scale: 8 }}`

- String / DataSource.Text / DataSource.JSON
  - varchar
  - char
  - text
  - mediumtext
  - tinytext
  - longtext
  
  Example:
   `{ userName : { type: String, dataType: 'char', limit: 24 }}`

  Example:
   `{ biography : { type: String, dataType: 'longtext' }}`

- Date
  - datetime
  - timestamp
  
  Example:
   `{ startTime : { type: Date, dataType: 'timestamp' }}`

* Enum
  Enums are special.
  Create an Enum using Enum factory:

```javascript
    var MOOD = dataSource.EnumFactory('glad', 'sad', 'mad');
    MOOD.SAD;    // 'sad'
    MOOD(2);     // 'sad'
    MOOD('SAD'); // 'sad'
    MOOD('sad'); // 'sad'
```
  
  - `{ mood: { type: MOOD }}`
  - `{ choice: { type: dataSource.EnumFactory('yes', 'no', 'maybe'), null: false }}`


## Discovering Models

MySQL data sources allow you to discover model definition information from existing mysql databases. See the following APIs:

 - [dataSource.discoverModelDefinitions([owner], fn)](https://github.com/strongloop/loopback#datasourcediscovermodeldefinitionsusername-fn)
 - [dataSource.discoverSchema([owner], name, fn)](https://github.com/strongloop/loopback#datasourcediscoverschemaowner-name-fn)

### Asynchronous APIs for discovery

* MySQL.prototype.discoverModelDefinitions = function (options, cb)
  - options:
    - all: {Boolean} To include tables/views from all schemas/owners
    - owner/schema: {String} The schema/owner name
    - views: {Boolean} To include views
  - cb:
    - Get a list of table/view names, for example:

        {type: 'table', name: 'INVENTORY', owner: 'STRONGLOOP' }
        {type: 'table', name: 'LOCATION', owner: 'STRONGLOOP' }
        {type: 'view', name: 'INVENTORY_VIEW', owner: 'STRONGLOOP' }


* MySQL.prototype.discoverModelProperties = function (table, options, cb)
  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of model property definitions, for example:

          { owner: 'STRONGLOOP',
            tableName: 'PRODUCT',
            columnName: 'ID',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'N',
            type: 'String' }
          { owner: 'STRONGLOOP',
            tableName: 'PRODUCT',
            columnName: 'NAME',
            dataType: 'VARCHAR2',
            dataLength: 64,
            nullable: 'Y',
            type: 'String' }


* MySQL.prototype.discoverPrimaryKeys= function(table, options, cb)
  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of primary key definitions, for example:

        { owner: 'STRONGLOOP',
          tableName: 'INVENTORY',
          columnName: 'PRODUCT_ID',
          keySeq: 1,
          pkName: 'ID_PK' }
        { owner: 'STRONGLOOP',
          tableName: 'INVENTORY',
          columnName: 'LOCATION_ID',
          keySeq: 2,
          pkName: 'ID_PK' }

* MySQL.prototype.discoverForeignKeys= function(table, options, cb)
  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of foreign key definitions, for example:

        { fkOwner: 'STRONGLOOP',
          fkName: 'PRODUCT_FK',
          fkTableName: 'INVENTORY',
          fkColumnName: 'PRODUCT_ID',
          keySeq: 1,
          pkOwner: 'STRONGLOOP',
          pkName: 'PRODUCT_PK',
          pkTableName: 'PRODUCT',
          pkColumnName: 'ID' }


* MySQL.prototype.discoverExportedForeignKeys= function(table, options, cb)

  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of foreign key definitions that reference the primary key of the given table, for example:

        { fkName: 'PRODUCT_FK',
          fkOwner: 'STRONGLOOP',
          fkTableName: 'INVENTORY',
          fkColumnName: 'PRODUCT_ID',
          keySeq: 1,
          pkName: 'PRODUCT_PK',
          pkOwner: 'STRONGLOOP',
          pkTableName: 'PRODUCT',
          pkColumnName: 'ID' }

### Discover/build/try the models

#### Build a LDL schema by discovery

Data sources backed by the MySQL connector can discover LDL models from the database using the `discoverSchema` API. For
example,

    dataSource.discoverSchema('INVENTORY', {owner: 'STRONGLOOP'}, function (err, schema) {
        ...
    }

Here is the sample result. Please note there are 'mysql' properties in addition to the regular LDL model options and
properties. The 'mysql' objects contain the MySQL specific mappings.

    {
      "name":"Inventory",
      "options":{
        "idInjection":false,
        "mysql":{
          "schema":"STRONGLOOP",
          "table":"INVENTORY"
        }
      },
      "properties":{
        "productId":{
          "type":"String",
          "required":false,
          "length":60,
          "precision":null,
          "scale":null,
          "id":1,
          "mysql":{
            "columnName":"PRODUCT_ID",
            "dataType":"varchar",
            "dataLength":60,
            "dataPrecision":null,
            "dataScale":null,
            "nullable":"NO"
          }
        },
        "locationId":{
          "type":"String",
          "required":false,
          "length":60,
          "precision":null,
          "scale":null,
          "id":2,
          "mysql":{
            "columnName":"LOCATION_ID",
            "dataType":"varchar",
            "dataLength":60,
            "dataPrecision":null,
            "dataScale":null,
            "nullable":"NO"
          }
        },
        "available":{
          "type":"Number",
          "required":false,
          "length":null,
          "precision":10,
          "scale":0,
          "mysql":{
            "columnName":"AVAILABLE",
            "dataType":"int",
            "dataLength":null,
            "dataPrecision":10,
            "dataScale":0,
            "nullable":"YES"
          }
        },
        "total":{
          "type":"Number",
          "required":false,
          "length":null,
          "precision":10,
          "scale":0,
          "mysql":{
            "columnName":"TOTAL",
            "dataType":"int",
            "dataLength":null,
            "dataPrecision":10,
            "dataScale":0,
            "nullable":"YES"
          }
        }
      }
    }

We can also discover and build model classes in one shot. The following example uses `discoverAndBuildModels` to discover,
build and try the models:

    dataSource.discoverAndBuildModels('INVENTORY', { owner: 'STRONGLOOP', visited: {}, associations: true},
         function (err, models) {
            // Show records from the models
            for(var m in models) {
                models[m].all(show);
            };

            // Find one record for inventory
            models.Inventory.findOne({}, function(err, inv) {
                console.log("\nInventory: ", inv);
                // Follow the foreign key to navigate to the product
                inv.product(function(err, prod) {
                    console.log("\nProduct: ", prod);
                    console.log("\n ------------- ");
                });
        });
    }

