## JugglingDB-MySQL [![Build Status](https://travis-ci.org/jugglingdb/mysql-adapter.png)](https://travis-ci.org/jugglingdb/mysql-adapter)

MySQL adapter for JugglingDB.

## Usage

To use it you need `jugglingdb@0.2.x`.

1. Setup dependencies in `package.json`:

    ```json
    {
      ...
      "dependencies": {
        "jugglingdb": "0.2.x",
        "jugglingdb-mysql": "latest"
      },
      ...
    }
    ```

2. Use:

    ```javascript
        var Schema = require('jugglingdb').Schema;
        var schema = new Schema('mysql', {
            database: 'myapp_test',
            username: 'root'
        });
    ```
    You can optionally pass a few additional parameters supported by `node-mysql`, most particularly `password` and `collation`. `Collation` currently defaults to `utf8mb4_general_ci`. The `collation` value will also be used to derive the connection charset.

## Running tests

    npm test
    
## Using the `dataType` field/column option with MySQL

The jugglingdb MySQL adapter now supports using the `dataType`  column/property attribute to specify what MySQL column type is used for many jugglingdb types.

The following type-dataType combinations are supported:
* <h4> Number </h4>
  * <h5> integer </h5>
     * tinyint
     * smallint
     * mediumint
     * int
     * bigint
     
     Use the `limit` option to alter the display width.

     Example:
      `{ count : { type: Number, dataType: 'smallInt' }}`

  * <h5> floating point types </h5>
     * float
     * double
     
     Use the `precision` and `scale` options to specify custom precision. Default is (16,8).

     Example:
      `{ average : { type: Number, dataType: 'float', precision: 20, scale: 4 }}`

  * <h5> fixed-point exact value types </h5>
     * decimal
     * numeric

     Use the `precision` and `scale` options to specify custom precision. Default is (9,2).
     
     These aren't likely to function as true fixed-point.
     
     Example:
      `{ stdDev : { type: Number, dataType: 'decimal', precision: 12, scale: 8 }}`

* <h4> String / Schema.Text / Schema.JSON </h4>
  * varchar
  * char
  * text
  * mediumtext
  * tinytext
  * longtext
  
  Example:
   `{ userName : { type: String, dataType: 'char', limit: 24 }}`

  Example:
   `{ biography : { type: String, dataType: 'longtext' }}`

* <h4> Date </h4>
  * datetime
  * timestamp
  
  Example:
   `{ startTime : { type: Date, dataType: 'timestamp' }}`

* <h4> Enum </h4>
  Create an Enum using Enum factory:

```javascript
    var MOOD = schema.EnumFactory('glad', 'sad', 'mad');
    MOOD.SAD;    // 'sad'
    MOOD(2);     // 'sad'
    MOOD('SAD'); // 'sad'
    MOOD('sad'); // 'sad'
```
  
  * `{ mood: { type: MOOD } }`
  * `{ choice: { type: schema.EnumFactory('yes', 'no', 'maybe'), null: false }`

## MIT License

```text
Copyright (C) 2012 by Anatoliy Chakkaev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
```

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

```text
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
