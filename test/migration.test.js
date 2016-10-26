// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var assert = require('assert');
var async = require('async');
var platform = require('./helpers/platform');
var should = require('./init');
var Schema = require('loopback-datasource-juggler').Schema;

var db, UserData, StringData, NumberData, DateData;
var mysqlVersion;

describe('migrations', function() {
  before(setup);

  it('should run migration', function(done) {
    db.automigrate(function() {
      done();
    });
  });

  it('UserData should have correct columns', function(done) {
    getFields('UserData', function(err, fields) {
      if (!fields) return done();
      fields.should.be.eql({
        id: {
          Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null,
          Extra: 'auto_increment'},
        email: {
          Field: 'email',
          Type: 'varchar(255)',
          Null: 'NO',
          Key: 'MUL',
          Default: null,
          Extra: ''},
        name: {
          Field: 'name',
          Type: 'varchar(512)',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        bio: {
          Field: 'bio',
          Type: 'text',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        birthDate: {
          Field: 'birthDate',
          Type: 'datetime',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        pendingPeriod: {
          Field: 'pendingPeriod',
          Type: 'int(11)',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        createdByAdmin: {
          Field: 'createdByAdmin',
          Type: 'tinyint(1)',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
      });
      done();
    });
  });

  it('UserData should have correct indexes', function(done) {
    // Note: getIndexes truncates multi-key indexes to the first member.
    // Hence index1 is correct.
    getIndexes('UserData', function(err, fields) {
      if (!fields) return done();
      fields.should.match({
        PRIMARY: {
          Table: /UserData/i,
          Non_unique: 0,
          Key_name: 'PRIMARY',
          Seq_in_index: 1,
          Column_name: 'id',
          Collation: 'A',
          // XXX: this actually has more to do with whether the table existed or not and
          // what kind of data is in it that MySQL has analyzed:
          // https://dev.mysql.com/doc/refman/5.5/en/show-index.html
          // Cardinality: /^5\.[567]/.test(mysqlVersion) ? 0 : null,
          Sub_part: null,
          Packed: null,
          Null: '',
          Index_type: 'BTREE',
          Comment: ''},
        email: {
          Table: /UserData/i,
          Non_unique: 1,
          Key_name: 'email',
          Seq_in_index: 1,
          Column_name: 'email',
          Collation: 'A',
          // XXX: this actually has more to do with whether the table existed or not and
          // what kind of data is in it that MySQL has analyzed:
          // https://dev.mysql.com/doc/refman/5.5/en/show-index.html
          // Cardinality: /^5\.[567]/.test(mysqlVersion) ? 0 : null,
          Sub_part: null,
          Packed: null,
          Null: '',
          Index_type: 'BTREE',
          Comment: ''},
        index0: {
          Table: /UserData/i,
          Non_unique: 1,
          Key_name: 'index0',
          Seq_in_index: 1,
          Column_name: 'email',
          Collation: 'A',
          // XXX: this actually has more to do with whether the table existed or not and
          // what kind of data is in it that MySQL has analyzed:
          // https://dev.mysql.com/doc/refman/5.5/en/show-index.html
          // Cardinality: /^5\.[567]/.test(mysqlVersion) ? 0 : null,
          Sub_part: null,
          Packed: null,
          Null: '',
          Index_type: 'BTREE',
          Comment: ''},
      });
      done();
    });
  });

  it('StringData should have correct columns', function(done) {
    getFields('StringData', function(err, fields) {
      fields.should.be.eql({
        idString: {Field: 'idString',
          Type: 'varchar(255)',
          Null: 'NO',
          Key: 'PRI',
          Default: null,
          Extra: ''},
        smallString: {Field: 'smallString',
          Type: 'char(127)',
          Null: 'NO',
          Key: 'MUL',
          Default: null,
          Extra: ''},
        mediumString: {Field: 'mediumString',
          Type: 'varchar(255)',
          Null: 'NO',
          Key: '',
          Default: null,
          Extra: ''},
        tinyText: {Field: 'tinyText',
          Type: 'tinytext',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        giantJSON: {Field: 'giantJSON',
          Type: 'longtext',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        text: {Field: 'text',
          Type: 'varchar(1024)',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
      });
      done();
    });
  });

  it('NumberData should have correct columns', function(done) {
    getFields('NumberData', function(err, fields) {
      fields.should.be.eql({
        id: {Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null,
          Extra: 'auto_increment'},
        number: {Field: 'number',
          Type: 'decimal(10,3) unsigned',
          Null: 'NO',
          Key: 'MUL',
          Default: null,
          Extra: ''},
        tinyInt: {Field: 'tinyInt',
          Type: 'tinyint(2)',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        mediumInt: {Field: 'mediumInt',
          Type: 'mediumint(8) unsigned',
          Null: 'NO',
          Key: '',
          Default: null,
          Extra: ''},
        floater: {Field: 'floater',
          Type: 'double(14,6)',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
      });
      done();
    });
  });

  it('DateData should have correct columns', function(done) {
    getFields('DateData', function(err, fields) {
      fields.should.be.eql({
        id: {Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null,
          Extra: 'auto_increment'},
        dateTime: {Field: 'dateTime',
          Type: 'datetime',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
        timestamp: {Field: 'timestamp',
          Type: 'timestamp',
          Null: 'YES',
          Key: '',
          Default: null,
          Extra: ''},
      });
      done();
    });
  });

  it('should autoupdate', function(done) {
    // With an install of MYSQL5.7 on windows, these queries `randomly` fail and raise errors
    // especially with decimals, number and Date format.
    if (platform.isWindows) {
      return done();
    }
    var userExists = function(cb) {
      query('SELECT * FROM UserData', function(err, res) {
        cb(!err && res[0].email == 'test@example.com');
      });
    };

    UserData.create({email: 'test@example.com'}, function(err, user) {
      assert.ok(!err, 'Could not create user: ' + err);
      userExists(function(yep) {
        assert.ok(yep, 'User does not exist');
      });
      UserData.defineProperty('email', {type: String});
      UserData.defineProperty('name', {type: String,
        dataType: 'char', limit: 50});
      UserData.defineProperty('newProperty', {type: Number, unsigned: true,
        dataType: 'bigInt'});
      // UserData.defineProperty('pendingPeriod', false);
      // This will not work as expected.
      db.autoupdate(function(err) {
        getFields('UserData', function(err, fields) {
          // change nullable for email
          assert.equal(fields.email.Null, 'YES', 'Email does not allow null');
          // change type of name
          assert.equal(fields.name.Type, 'char(50)', 'Name is not char(50)');
          // add new column
          assert.ok(fields.newProperty, 'New column was not added');
          if (fields.newProperty) {
            assert.equal(fields.newProperty.Type, 'bigint(20) unsigned',
              'New column type is not bigint(20) unsigned');
          }
          // drop column - will not happen.
          // assert.ok(!fields.pendingPeriod,
          // 'Did not drop column pendingPeriod');
          // user still exists
          userExists(function(yep) {
            assert.ok(yep, 'User does not exist');
            done();
          });
        });
      });
    });
  });

  it('should check actuality of dataSource', function(done) {
    // With an install of MYSQL5.7 on windows, these queries `randomly` fail and raise errors
    // with date, number and decimal format
    if (platform.isWindows) {
      return done();
    }
    // 'drop column'
    UserData.dataSource.isActual(function(err, ok) {
      assert.ok(ok, 'dataSource is not actual (should be)');
      UserData.defineProperty('essay', {type: Schema.Text});
      // UserData.defineProperty('email', false); Can't undefine currently.
      UserData.dataSource.isActual(function(err, ok) {
        assert.ok(!ok, 'dataSource is actual (shouldn\t be)');
        done();
      });
    });
  });

  // In MySQL 5.6/5.7 Out of range values are rejected.
  // Reference: http://dev.mysql.com/doc/refman/5.7/en/integer-types.html
  it('allows numbers with decimals', function(done) {
    NumberData.create(
      {number: 1.1234567, tinyInt: 127, mediumInt: 16777215, floater: 12345678.123456},
      function(err, obj) {
        if (err) return (err);
        NumberData.findById(obj.id, function(err, found) {
          assert.equal(found.number, 1.123);
          assert.equal(found.tinyInt, 127);
          assert.equal(found.mediumInt, 16777215);
          assert.equal(found.floater, 12345678.123456);
          done();
        });
      });
  });

  // Reference: http://dev.mysql.com/doc/refman/5.7/en/out-of-range-and-overflow.html
  it('rejects out-of-range and overflow values', function(done) {
    async.series([
      function(next) {
        NumberData.create({number: 1.1234567, tinyInt: 128, mediumInt: 16777215}, function(err, obj) {
          assert(err);
          assert.equal(err.code, 'ER_WARN_DATA_OUT_OF_RANGE');
          next();
        });
      }, function(next) {
        NumberData.create({number: 1.1234567, mediumInt: 16777215 + 1}, function(err, obj) {
          assert(err);
          assert.equal(err.code, 'ER_WARN_DATA_OUT_OF_RANGE');
          next();
        });
      }, function(next) {
        //Minimum value for unsigned mediumInt is 0
        NumberData.create({number: 1.1234567, mediumInt: -8388608}, function(err, obj) {
          assert(err);
          assert.equal(err.code, 'ER_WARN_DATA_OUT_OF_RANGE');
          next();
        });
      }, function(next) {
        NumberData.create({number: 1.1234567, tinyInt: -129, mediumInt: 0}, function(err, obj) {
          assert(err);
          assert.equal(err.code, 'ER_WARN_DATA_OUT_OF_RANGE');
          next();
        });
      },
    ], done);
  });

  it('should allow both kinds of date columns', function(done) {
    DateData.create({
      dateTime: new Date('Aug 9 1996 07:47:33 GMT'),
      timestamp: new Date('Sep 22 2007 17:12:22 GMT'),
    }, function(err, obj) {
      assert.ok(!err);
      assert.ok(obj);
      DateData.findById(obj.id, function(err, found) {
        assert.equal(found.dateTime.toGMTString(),
          'Fri, 09 Aug 1996 07:47:33 GMT');
        assert.equal(found.timestamp.toGMTString(),
          'Sat, 22 Sep 2007 17:12:22 GMT');
        done();
      });
    });
  });

  // InMySQL5.7, DATETIME supported range is '1000-01-01 00:00:00' to '9999-12-31 23:59:59'.
  // TIMESTAMP has a range of '1970-01-01 00:00:01' UTC to '2038-01-19 03:14:07' UTC
  // Reference: http://dev.mysql.com/doc/refman/5.7/en/datetime.html
  // Out of range values are set to null in windows but rejected elsewhere
  // the next example is designed for windows while the following 2 are for other platforms
  it('should map zero dateTime into null', function(done) {
    if (!platform.isWindows) {
      return done();
    }

    query('INSERT INTO `DateData` ' +
      '(`dateTime`, `timestamp`) ' +
      'VALUES("0000-00-00 00:00:00", "0000-00-00 00:00:00") ',
      function(err, ret) {
        should.not.exists(err);
        DateData.findById(ret.insertId, function(err, dateData) {
          should(dateData.dateTime)
            .be.null();
          should(dateData.timestamp)
            .be.null();
          done();
        });
      });
  });

  it('rejects out of range datetime', function(done) {
    if (platform.isWindows) {
      return done();
    }

    query('INSERT INTO `DateData` ' +
      '(`dateTime`, `timestamp`) ' +
      'VALUES("0000-00-00 00:00:00", "0000-00-00 00:00:00") ', function(err) {
      var errMsg = 'ER_TRUNCATED_WRONG_VALUE: Incorrect datetime value: ' +
          '\'0000-00-00 00:00:00\' for column \'dateTime\' at row 1';
      assert(err);
      assert.equal(err.message, errMsg);
      done();
    });
  });

  it('rejects out of range timestamp', function(done) {
    if (platform.isWindows) {
      return done();
    }

    query('INSERT INTO `DateData` ' +
      '(`dateTime`, `timestamp`) ' +
      'VALUES("1000-01-01 00:00:00", "0000-00-00 00:00:00") ', function(err) {
      var errMsg = 'ER_TRUNCATED_WRONG_VALUE: Incorrect datetime value: ' +
            '\'0000-00-00 00:00:00\' for column \'timestamp\' at row 1';
      assert(err);
      assert.equal(err.message, errMsg);
      done();
    });
  });

  it('should report errors for automigrate', function() {
    db.automigrate('XYZ', function(err) {
      assert(err);
    });
  });

  it('should report errors for autoupdate', function() {
    db.autoupdate('XYZ', function(err) {
      assert(err);
    });
  });

  it('should disconnect when done', function(done) {
    db.disconnect();
    done();
  });
});

function setup(done) {
  require('./init.js');

  db = getSchema();

  UserData = db.define('UserData', {
    email: {type: String, null: false, index: true},
    name: String,
    bio: Schema.Text,
    birthDate: Date,
    pendingPeriod: Number,
    createdByAdmin: Boolean,
  }, {indexes: {
    index0: {
      columns: 'email, createdByAdmin',
    },
  },
  });

  StringData = db.define('StringData', {
    idString: {type: String, id: true},
    smallString: {type: String, null: false, index: true,
      dataType: 'char', limit: 127},
    mediumString: {type: String, null: false, dataType: 'varchar', limit: 255},
    tinyText: {type: String, dataType: 'tinyText'},
    giantJSON: {type: Schema.JSON, dataType: 'longText'},
    text: {type: Schema.Text, dataType: 'varchar', limit: 1024},
  });

  NumberData = db.define('NumberData', {
    number: {type: Number, null: false, index: true, unsigned: true,
      dataType: 'decimal', precision: 10, scale: 3},
    tinyInt: {type: Number, dataType: 'tinyInt', display: 2},
    mediumInt: {type: Number, dataType: 'mediumInt', unsigned: true,
      required: true},
    floater: {type: Number, dataType: 'double', precision: 14, scale: 6},
  });

  DateData = db.define('DateData', {
    dateTime: {type: Date, dataType: 'datetime'},
    timestamp: {type: Date, dataType: 'timestamp'},
  });

  query('SELECT VERSION()', function(err, res) {
    mysqlVersion = res && res[0] && res[0]['VERSION()'];
    blankDatabase(db, done);
  });
}

var query = function(sql, cb) {
  db.adapter.execute(sql, cb);
};

var blankDatabase = function(db, cb) {
  var dbn = db.settings.database;
  var cs = db.settings.charset;
  var co = db.settings.collation;
  query('DROP DATABASE IF EXISTS ' + dbn, function(err) {
    var q = 'CREATE DATABASE ' + dbn;
    if (cs) {
      q += ' CHARACTER SET ' + cs;
    }
    if (co) {
      q += ' COLLATE ' + co;
    }
    query(q, function(err) {
      query('USE ' + dbn, cb);
    });
  });
};

var getFields = function(model, cb) {
  query('SHOW FIELDS FROM ' + model, function(err, res) {
    if (err) {
      cb(err);
    } else {
      var fields = {};
      res.forEach(function(field) {
        fields[field.Field] = field;
      });
      cb(err, fields);
    }
  });
};

var getIndexes = function(model, cb) {
  query('SHOW INDEXES FROM ' + model, function(err, res) {
    if (err) {
      console.log(err);
      cb(err);
    } else {
      var indexes = {};
      // Note: this will only show the first key of compound keys
      res.forEach(function(index) {
        if (parseInt(index.Seq_in_index, 10) == 1) {
          indexes[index.Key_name] = index;
        }
      });
      cb(err, indexes);
    }
  });
};
