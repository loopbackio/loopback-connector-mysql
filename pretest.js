if (!process.env.TEST_MYSQL_USER) {
  console.log('not seeding DB with example db');
  return;
}

var fs = require('fs');
var cp = require('child_process');

var sql = fs.createReadStream(require.resolve('./example/table.sql'));
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
mysql.on('exit', function() {
  console.log('done seeding DB');
});
