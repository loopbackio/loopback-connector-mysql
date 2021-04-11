// Copyright IBM Corp. 2016,2019. All Rights Reserved.
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
  process.env.MYSQL_PORT || process.env.MYSQL_PORT || 3307;
process.env.MYSQL_USER =
  process.env.MYSQL_USER || process.env.MYSQL_USER || 'root';
process.env.MYSQL_PASSWORD =
  process.env.MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || 'root';

const fs = require('fs');
const cp = require('child_process');

const sql = fs.createReadStream(require.resolve('./test/schema.sql'));
const stdio = ['pipe', process.stdout, process.stderr];
const args = ['--user=' + process.env.MYSQL_USER];

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
const mysql = cp.spawn('mysql', args, {stdio: stdio});
sql.pipe(mysql.stdin);
mysql.on('exit', function(code) {
  console.log('done seeding DB');
  setTimeout(function() {
    process.exit(code);
  }, 200);
});
