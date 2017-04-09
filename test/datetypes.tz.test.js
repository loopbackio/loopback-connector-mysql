// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
var assert = require('assert');

var db, DateModel;
var mysqlVersion;

var timezone = '+05:30';
var defaulttz;
//var timezone = 'Z';
var date = new Date();//(2015,10,25,13,44,55); //2015-12-25 13:44:55
date.setMilliseconds(0);
var dateOnly = new Date(2015,10,25); //2015-12-25
var dateString = '2015-12-25 13:44:55';
var dateOnlyString = "2015-12-25";

describe('MySQL DATE, DATETTIME, TIMESTAMP types on server with non local TZ (+05:30)', function() {
  before(setup);
  it('should set session timezone to '+timezone, function(done){
      query("SET @@session.time_zone = '"+timezone+"'", function(err) {
          assert.ok(!err);
          done();
      });
  });
  it('should create table', function(done) {
    query("CREATE TABLE `DateModel` "+
      "(`id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,"+
      "`datetimeField` datetime NULL,"+
      "`timestampField` timestamp NULL,"+
      "`timestampDefaultField` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,"+
      "`dateField` date NOT NULL"+
    ")", done);
  });

  it('should create a model instance with dates with TZ: +05:30', function(done) {
    //set date to current timestamp to comapre with mysql CURRENT_TIMESTAMP from the server
    date = new Date();
    date.setMilliseconds(0);
    DateModel.upsert({
        datetimeField: date,
        timestampField: date,
        timestampDefaultField: null,
        dateField: dateOnly
    }, function(err, found) {
      assert.ok(!err);
      done();
    });
  });
  it('should get model instance', function(done) {
      DateModel.findOne({where: {id: 1}}, function(err, found) {
        assert.ok(!err);
        assert.equal(found.datetimeField.toISOString(), date.toISOString());
        assert.equal(found.timestampField.toISOString(), date.toISOString());
        assert.equal(found.dateField.toISOString(), dateOnly.toISOString());
        done();
      });
  });
  it('timestampField shoud equal DEFAULT CURRENT_TIMESTAMP field', function(done) {
      DateModel.findOne({where: {id: 1}}, function(err, found) {
        assert.ok(!err);
        assert.equal(found.timestampField.toISOString(), found.timestampDefaultField.toISOString());
        done();
      });
  });
  it('should find model instance by datetime field', function(done) {
      DateModel.findOne({where: {datetimeField: date}}, function(err, found) {
        assert.ok(!err);
        assert.equal(found.datetimeField.toISOString(), date.toISOString());
        assert.equal(found.timestampField.toISOString(), date.toISOString());
        assert.equal(found.dateField.toISOString(), dateOnly.toISOString());
        done();
      });
  });
  it('should find model instance by timestamp field', function(done) {
      DateModel.findOne({where: {timestampField: date}}, function(err, found) {
        assert.ok(!err);
        assert.equal(found.datetimeField.toISOString(), date.toISOString());
        assert.equal(found.timestampField.toISOString(), date.toISOString());
        assert.equal(found.dateField.toISOString(), dateOnly.toISOString());
        done();
      });
  });
  it('should find model instance by date field', function(done) {
      DateModel.findOne({where: {dateField: dateOnly}}, function(err, found) {
        assert.ok(!err);
        assert.equal(found.datetimeField.toISOString(), date.toISOString());
        assert.equal(found.timestampField.toISOString(), date.toISOString());
        assert.equal(found.dateField.toISOString(), dateOnly.toISOString());
        done();
      });
  });
  it('set timezone to +00:00', function(done) {
      query("SET @@session.time_zone = '+00:00'", function(err) {
          assert.ok(!err);
          done();
      });
  });

  it('now datetime and timestamp field should be different in 330 minutes 5:30 - 0:00', function(done) {
      DateModel.findOne({where: {id: 1}}, function(err, found) {
        assert.ok(!err);
        var diff = (found.datetimeField.getTime() - found.timestampField.getTime())/60000;
        assert.equal(diff, 330);
        done();
      });
  });

  it('should disconnect when done', function(done) {
    db.disconnect();
    done();
  });
});

function setup(done) {
  require('./init.js');

  db = getSchema({timezone:timezone});


  DateModel = db.define('DateModel', {
    id: {type:Number, id:1, generated: true},
    datetimeField: {type: Date, dataType: 'datetime', null: false},
    timestampField: {type: Date, dataType: 'timestamp', null: false},
    timestampDefaultField: {type: Date, dataType: 'timestamp', null: false},
    dateField: {type: Date, dataType: 'date', null: false},
  });

  query('SELECT VERSION()', function(err, res) {
    mysqlVersion = res && res[0] && res[0]['VERSION()'];
    var parts = mysqlVersion.split(/\./);
    if ( parts[1] && parts[1] >= 7) {
        mysqlVersion57Plus = true;
    }
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
