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

## Running tests

    npm test
    
## Using the `dataType` field/column option with MySQL

The jugglingdb MySQL adapter now supports using the `dataType`  column/property attribute to specify what MySQL column type is used for many jugglingdb types.

The following type-dataType combinations are supported (incomplete):
* Number
  * integer types
     * tinyint
     * smallint
     * mediumint
     * int
     * bigint
     * use the 'limit' option to alter the display width
     * example:
       `{ count : { type: Number, dataType: 'smallInt' }}`
  * floating point types
     * float
     * double
     * use the `precision` and `scale` options to specify custom precision. Default is (16,8).
     * example:
      `{ average : { type: Number, dataType: 'float', precision: 20, scale: 4 }}`
  * fixed-point exact value types
     * decimal
     * numeric
     * use the `precision` and `scale` options to specify custom precision. Default is (9,2).
     * these aren't likely to function as true fixed-point.
     * example:
      `{ stdDev : { type: Number, dataType: 'decimal', precision: 12, scale: 8 }}`
* String / Schema.Text / Schema.JSON
  * varchar
  * char
  * text
  * mediumtext
  * tinytext
  * longtext
* Date
  * datetime
  * timestamp
    

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
