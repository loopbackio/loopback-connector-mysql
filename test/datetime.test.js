// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var DateString = require('../node_modules/loopback-datasource-juggler/lib/date-string');
var fmt = require('util').format;
var should = require('./init.js');

var db, Person;
describe('MySQL datetime handling', function() {
  var personDefinition = {
    name: String,
    gender: String,
    married: Boolean,
    dob: {type: 'DateString'},
    createdAt: {type: Date, default: Date},
    lastLogon: {type: Date, precision: 3, default: Date},
  };

  // Modifying the connection timezones mid-flight is a pain,
  // but closing the existing connection requires more effort.
  function setConnectionTimezones(tz) {
    db.connector.client._allConnections.forEach(function(con) {
      con.config.timezone = tz;
    });
  }
  before(function(done) {
    db = global.getSchema({
      dateStrings: true,
    });
    Person = db.define('Person', personDefinition, {forceId: true, strict: true});
    db.automigrate(['Person'], done);
  });

  beforeEach(function() {
    setConnectionTimezones('Z');
  });
  after(function(done) {
    Person.destroyAll(function(err) {
      db.disconnect(function() {
        return done(err);
      });
    });
  });

  it('should allow use of DateStrings', function(done) {
    var d = new DateString('1971-06-22');
    return Person.create({
      name: 'Mr. Pink',
      gender: 'M',
      dob: d,
      createdAt: new Date(),
    }).then(function(inst) {
      return Person.findById(inst.id);
    }).then(function(inst) {
      inst.should.not.eql(null);
      inst.dob.toString().should.eql(d.toString());
      return done();
    }).catch(function(err) {
      return done(err);
    });
  });

  describe('should allow use of alternate timezone settings', function() {
    var d = new Date('1971-06-22T00:00:00.000Z');
    testDateTime(d, '+04:00', '1971-06-22 04:00:00');
    testDateTime(d, '-04:00', '1971-06-21 20:00:00');
    testDateTime(d, '-11:00', '1971-06-21 13:00:00');
    testDateTime(d, '+12:00', '1971-06-22 12:00:00');

    function testDateTime(date, tz, expected) {
      it(tz, function(done) {
        setConnectionTimezones(tz);
        db.settings.legacyUtcDateProcessing = false;
        db.settings.timezone = tz;
        var dt = new Date(date);
        return Person.create({
          name: 'Mr. Pink',
          gender: 'M',
          createdAt: dt,
        }).then(function(inst) {
          return Person.findById(inst.id);
        }).then(function(inst) {
          inst.should.not.eql(null);
          inst.createdAt.toString().should.eql(expected);
          return done();
        }).catch(function(err) {
          return done(err);
        });
      });
    }
  });

  it('should allow use of fractional seconds', function(done) {
    var d = new Date('1971-06-22T12:34:56.789Z');
    return Person.create({
      name: 'Mr. Pink',
      gender: 'M',
      lastLogon: d,
    }).then(function(inst) {
      return Person.findById(inst.id);
    }).then(function(inst) {
      inst.should.not.eql(null);
      var lastLogon = new Date(inst.lastLogon);
      lastLogon.toJSON().should.eql(d.toJSON());
      return done();
    }).catch(function(err) {
      return done(err);
    });
  });
});
