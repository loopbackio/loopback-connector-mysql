'use strict';
// TODO: used for testing support for parallel testing on ci.strongloop.com which
// provides MYSQL_* env vars instead of TEST_MYSQL_* env vars.
process.env.TEST_MYSQL_USER = process.env.TEST_MYSQL_USER || process.env.MYSQL_USER;
process.env.TEST_MYSQL_PASSWORD = process.env.TEST_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD;
process.env.TEST_MYSQL_HOST = process.env.TEST_MYSQL_HOST || process.env.MYSQL_HOST;
process.env.TEST_MYSQL_PORT = process.env.TEST_MYSQL_PORT || process.env.MYSQL_PORT;

if (!process.env.TEST_MYSQL_USER) {
  console.log('not seeding DB with example db');
  return;
}

var fs = require('fs');
var cp = require('child_process');

var sql = fs.createReadStream(require.resolve('./test/schema.sql'));
var stdio = ['pipe', process.stdout, process.stderr];
var args = ['--user=' + process.env.TEST_MYSQL_USER];

if (process.env.TEST_MYSQL_HOST) {
  args.push('--host=' + process.env.TEST_MYSQL_HOST);
}
if (process.env.TEST_MYSQL_PORT) {
  args.push('--port=' + process.env.TEST_MYSQL_PORT);
}
if (process.env.TEST_MYSQL_PASSWORD) {
  args.push('--password=' + process.env.TEST_MYSQL_PASSWORD);
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
