// Copyright IBM Corp. 2016,2017. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

if (!process.env.CI) {
  return console.log('Not seeding DB with test db');
}

process.env.MYSQL_HOST =
  process.env.MYSQL_HOST || process.env.MYSQL_HOST || 'localhost';
process.env.MYSQL_PORT =
  process.env.MYSQL_PORT || process.env.MYSQL_PORT || 3306;
process.env.MYSQL_USER =
  process.env.MYSQL_USER || process.env.MYSQL_USER || 'test';
process.env.MYSQL_PASSWORD =
  process.env.MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || 'test';

var fs = require('fs');
var cp = require('child_process');

var sql = fs.createReadStream(require.resolve('./test/schema.sql'));
var stdio = ['pipe', process.stdout, process.stderr];
var args = ['--user=' + process.env.MYSQL_USER];

if (process.env.MYSQL_HOST) {
  args.push('--host=' + process.env.MYSQL_HOST);
}
if (process.env.MYSQL_PORT) {
  args.push('--port=' + process.env.MYSQL_PORT);
}
if (process.env.MYSQL_PASSWORD) {
  args.push('--password=' + process.env.MYSQL_PASSWORD);
}

console.log('seeding DB with example db...');
var mysql = cp.spawn('mysql', args, {stdio: stdio});
sql.pipe(mysql.stdin);
mysql.on('exit', function(code) {
  console.log('done seeding DB');
  setTimeout(function() {
    process.exit(code);
  }, 200);
});
