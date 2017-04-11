// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
var assert = require('assert');

var db, DateModel;

describe('MySQL DATE, DATETTIME, TIMESTAMP types on server with local TZ', function() {
  var date;
  var dateOnly = new Date(2015, 10, 25); //2015-12-25
  var timezone = getTimeZone();

  before(function(done) {
    prepareModel('local', done);
  });

  it('should set local timezone in mysql ' + timezone, function(done) {
    query("SET @@session.time_zone = '" + timezone + "';", function(err) {
      assert.ok(!err);
      done();
    });
  });

  it('should create a model instance with dates', function(done) {
    date = new Date();
    date.setMilliseconds(0);
    DateModel.create({
      datetimeField: date,
      timestampField: date,
      dateField: dateOnly,
    }, function(err, obj) {
      assert.ok(!err);
      done();
    });
  });

  it('should get model instance', function(done) {
    DateModel.findOne({
      where: {
        id: 1,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.equal(found.datetimeField.toISOString(), date.toISOString());
      assert.equal(found.timestampField.toISOString(), date.toISOString());
      assert.equal(found.dateField.toISOString(), dateOnly.toISOString());
      done();
    });
  });

  it('timestampField shoud equal DEFAULT CURRENT_TIMESTAMP field', function(done) {
    DateModel.findOne({
      where: {
        id: 1,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.equal(found.timestampField.toISOString(), found.timestampDefaultField.toISOString());
      done();
    });
  });

  it('should find model instance by datetime field', function(done) {
    DateModel.findOne({
      where: {
        datetimeField: date,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.ok(found);
      assert.equal(found.id, 1);
      done();
    });
  });

  it('should find model instance by timestamp field', function(done) {
    DateModel.findOne({
      where: {
        timestampField: date,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.ok(found);
      assert.equal(found.id, 1);
      done();
    });
  });

  it('should find model instance by date field', function(done) {
    DateModel.findOne({
      where: {
        dateField: dateOnly,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.ok(found);
      assert.equal(found.id, 1);
      done();
    });
  });

  it('should disconnect when done', function(done) {
    db.disconnect();
    done();
  });
});

describe('MySQL DATE, DATETTIME, TIMESTAMP types on server with non local TZ (+05:30)', function() {
  var timezone = '+05:30';
  var date;
  var dateOnly = new Date(2016, 11, 22); //2015-12-25

  before(function(done) {
    prepareModel(timezone, done);
  });

  it('should set session timezone to ' + timezone, function(done) {
    query("SET @@session.time_zone = '" + timezone + "'", function(err) {
      assert.ok(!err);
      done();
    });
  });

  it('should create a model instance with dates with TZ: +05:30', function(done) {
    //set date to current timestamp to comapre with mysql CURRENT_TIMESTAMP from the server
    date = new Date();
    date.setMilliseconds(0);
    DateModel.create({
      datetimeField: date,
      timestampField: date,
      timestampDefaultField: null,
      dateField: dateOnly,
    }, function(err, found) {
      assert.ok(!err);
      done();
    });
  });

  it('should get model instance', function(done) {
    DateModel.findOne({
      where: {
        id: 1,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.equal(found.datetimeField.toISOString(), date.toISOString());
      assert.equal(found.timestampField.toISOString(), date.toISOString());
      assert.equal(found.dateField.toISOString(), dateOnly.toISOString());
      done();
    });
  });

  it('timestampField shoud equal DEFAULT CURRENT_TIMESTAMP field', function(done) {
    DateModel.findOne({
      where: {
        id: 1,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.equal(found.timestampField.toISOString(), found.timestampDefaultField.toISOString());
      done();
    });
  });

  it('should find model instance by datetime field', function(done) {
    DateModel.findOne({
      where: {
        datetimeField: date,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.ok(found);
      assert.equal(found.id, 1);
      done();
    });
  });

  it('should find model instance by timestamp field', function(done) {
    DateModel.findOne({
      where: {
        timestampField: date,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.ok(found);
      assert.equal(found.id, 1);
      done();
    });
  });

  it('should find model instance by date field', function(done) {
    DateModel.findOne({
      where: {
        dateField: dateOnly,
      },
    }, function(err, found) {
      assert.ok(!err);
      assert.ok(found);
      assert.equal(found.id, 1);
      done();
    });
  });

  it('set timezone to UTC +00:00', function(done) {
    query("SET @@session.time_zone = '+00:00'", function(err) {
      assert.ok(!err);
      done();
    });
  });

  it('now datetime and timestamp field should be different in 330 minutes 5:30 - 0:00', function(done) {
    DateModel.findOne({
      where: {
        id: 1,
      },
    }, function(err, found) {
      assert.ok(!err);
      var diff = (found.datetimeField.getTime() - found.timestampField.getTime()) / 60000;
      assert.equal(diff, 330);
      done();
    });
  });

  it('should disconnect when done', function(done) {
    db.disconnect();
    done();
  });
});

var prepareModel = function(tz, done) {
  db = getSchema({timezone: tz});
  DateModel = db.define('DateModel', {
    id: {type: Number, id: 1, generated: true},
    datetimeField: {type: Date, dataType: 'datetime', null: false},
    timestampField: {type: Date, dataType: 'timestamp', null: false},
    timestampDefaultField: {type: Date, dataType: 'timestamp', null: false},
    dateField: {type: Date, dataType: 'date', null: false},
  });
  // set sql_mode to empty to zero's on date for CURRENT_TIMESTAMP
  query("SET sql_mode = ''", function(err) {
    if (err) done(err);
    db.automigrate(function() {
      //SET DEFAULT CURRENT_TIMESTAMP for timestampDefaultField
      query('ALTER TABLE `DateModel` CHANGE COLUMN `timestampDefaultField` ' +
      '`timestampDefaultField` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;', function(err, result) {
        if (err) done(err);
        done();
      });
    });
  });
};

var query = function(sql, cb) {
  db.adapter.execute(sql, cb);
};

function getTimeZone() {
  var offset = new Date().getTimezoneOffset(), o = Math.abs(offset);
  return (offset < 0 ? '+' : '-') + ('00' + Math.floor(o / 60)).slice(-2) + ':' + ('00' + (o % 60)).slice(-2);
}
