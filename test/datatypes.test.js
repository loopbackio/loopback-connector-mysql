// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
const assert = require('assert');
const _ = require('lodash');
const GeoPoint = require('loopback-datasource-juggler').GeoPoint;

let db, BlobModel, EnumModel, ANIMAL_ENUM, City, Account;

let mysqlVersion;

describe('MySQL specific datatypes', function() {
  before(setup);

  describe('Support explicit datatypes on a property', function() {
    const dateString1 = '2017-04-01';
    const dateString2 = '2016-01-30';
    const dateForTransactions = [new Date(dateString1).toString(), new Date(dateString2).toString()];
    const data = [
      {
        id: 1,
        type: 'Student - Basic',
        amount: 1000,
        lastTransaction: dateString1,
      },
      {
        id: 2,
        type: 'Professional',
        amount: 1999.99,
        lastTransaction: dateString2,
      },
    ];
    before(function(done) {
      require('./init.js');
      db = global.getSchema();
      Account = db.define('Account', {
        type: {type: String},
        amount: {
          type: Number,
          mysql: {
            dataType: 'DECIMAL',
            dataPrecision: 10,
            dataScale: 2,
          },
        },
        lastTransaction: {
          type: String,
          mysql: {
            dataType: 'DATE',
          },
        },
      }, {forceId: false});
      db.automigrate(done);
    });
    after(function(done) {
      Account.destroyAll(done);
    });

    it('discover type of amount', function(done) {
      db.discoverModelProperties('Account', {})
        .then(function(defs) {
          defs.forEach(function(props) {
            if (props.columnName === 'amount') {
              assert.deepEqual(props.dataType, 'decimal');
              assert.deepEqual(props.type, 'Number');
              done();
            }
          });
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('create an instance', function(done) {
      Account.create(data, function(err, result) {
        if (err) return done(err);
        assert(result);
        assert(_.isEqual(data.length, result.length));
        assert(_.isEqual(data[0].amount, result[0].amount));
        assert(_.isEqual(data[1].amount, result[1].amount));
        done();
      });
    });

    it('find an instance', function(done) {
      Account.find({order: 'amount'}, function(err, result) {
        if (err) return done(err);
        assert(result);
        assert(_.isEqual(data.length, result.length));
        assert(_.isEqual(data[0].amount, result[0].amount));
        assert(_.isEqual(data[1].amount, result[1].amount));
        assert(_.isEqual(dateForTransactions[0], result[0].lastTransaction));
        assert(_.isEqual(dateForTransactions[1], result[1].lastTransaction));
        done();
      });
    });

    it('find an instance by id', function(done) {
      Account.findById(1, function(err, result) {
        if (err) return done(err);
        assert(result);
        assert(_.isEqual(data[0].amount, result.amount));
        assert(_.isEqual(dateForTransactions[0], result.lastTransaction));
        done();
      });
    });

    it('update an instance', function(done) {
      const updatedData = {
        type: 'Student - Basic',
        amount: 1155.77,
      };
      Account.update({id: 1}, updatedData, function(err, result) {
        if (err) return done(err);
        assert(result);
        assert(result.count);
        assert.equal(1, result.count);
        done();
      });
    });
  });

  it('should run migration', function(done) {
    db.automigrate(function() {
      done();
    });
  });

  it('An enum should parse itself', function(done) {
    assert.equal(ANIMAL_ENUM.CAT, ANIMAL_ENUM('cat'));
    assert.equal(ANIMAL_ENUM.CAT, ANIMAL_ENUM('CAT'));
    assert.equal(ANIMAL_ENUM.CAT, ANIMAL_ENUM(2));
    assert.equal(ANIMAL_ENUM.CAT, 'cat');
    assert.equal(ANIMAL_ENUM(null), null);
    assert.equal(ANIMAL_ENUM(''), '');
    assert.equal(ANIMAL_ENUM(0), '');
    done();
  });

  it('should create a model instance with Enums', function(done) {
    const em = EnumModel.create({animal: ANIMAL_ENUM.CAT, condition: 'sleepy', mood: 'happy'}, function(err, obj) {
      if (err) return done(err);
      assert.equal(obj.condition, 'sleepy');
      EnumModel.findOne({where: {animal: ANIMAL_ENUM.CAT}}, function(err, found) {
        if (err) return done(err);
        assert.equal(found.mood, 'happy');
        assert.equal(found.animal, ANIMAL_ENUM.CAT);
        done();
      });
    });
  });

  it('should fail spectacularly with invalid enum values', function(done) {
    // In MySQL 5.6/5.7, An ENUM value must be one of those listed in the column definition,
    // or the internal numeric equivalent thereof. Invalid values are rejected.
    // Reference: http://dev.mysql.com/doc/refman/5.7/en/constraint-enum.html
    EnumModel.create({animal: 'horse', condition: 'sleepy', mood: 'happy'}, function(err, obj) {
      assert.ok(err);
      assert.equal(err.code, 'WARN_DATA_TRUNCATED');
      assert.equal(err.errno, 1265);
      done();
    });
  });

  it('should create a model instance with object/json types', function(done) {
    const note = {a: 1, b: '2'};
    const extras = {c: 3, d: '4'};
    const em = EnumModel.create({animal: ANIMAL_ENUM.DOG, condition: 'sleepy',
      mood: 'happy', note: note, extras: extras}, function(err, obj) {
      if (err) return done(err);
      assert.equal(obj.condition, 'sleepy');
      EnumModel.findOne({where: {animal: ANIMAL_ENUM.DOG}}, function(err, found) {
        if (err) return done(err);
        assert.equal(found.mood, 'happy');
        assert.equal(found.animal, ANIMAL_ENUM.DOG);
        assert.deepEqual(found.note, note);
        assert.deepEqual(found.extras, extras);
        done();
      });
    });
  });
  it('should create a model instance with binary types', function(done) {
    const str = 'This is a test';
    const name = 'bob';
    const bob = {name: name, bin: new Buffer.from(str)};
    BlobModel.create(bob, function(err, obj) {
      if (err) return done(err);
      assert.equal(obj.bin.toString(), str);
      BlobModel.findOne({where: {name: name}}, function(err, found) {
        if (err) return done(err);
        assert.equal(found.bin.toString(), str);
        done();
      });
    });
  });
  it('should create a model instance with geopoint type', function(done) {
    const city1 = {
      name: 'North York',
      loc: {
        lat: 43.761539,
        lng: -79.411079,
      },
    };
    let xcor, ycor;
    City.create(city1, function(err, res) {
      if (err) return done(err);
      const loc_in_geo_type = new GeoPoint(city1.loc);
      res.loc.should.deepEqual(loc_in_geo_type);
      res.name.should.equal(city1.name);
      const sqlStmt = 'select ST_X(loc),ST_Y(loc) from City where id=1';
      db.connector.execute(sqlStmt, function(err, res) {
        if (err) return done(err);
        xcor = res[0]['ST_X(loc)'];
        ycor = res[0]['ST_Y(loc)'];
        City.find({where: {name: city1.name}}, function(err, found) {
          if (err) return done(err);
          found[0].name.should.equal(city1.name);
          found[0].loc.lng.should.equal(xcor);
          found[0].loc.lat.should.equal(ycor);
          done();
        });
      });
    });
  });
  it('should disconnect when done', function(done) {
    db.disconnect();
    done();
  });
});

function setup(done) {
  require('./init.js');

  db = global.getSchema();

  ANIMAL_ENUM = db.EnumFactory('dog', 'cat', 'mouse');

  EnumModel = db.define('EnumModel', {
    animal: {type: ANIMAL_ENUM, null: false},
    condition: {type: db.EnumFactory('hungry', 'sleepy', 'thirsty')},
    mood: {type: db.EnumFactory('angry', 'happy', 'sad')},
    note: Object,
    extras: 'JSON',
  });
  BlobModel = db.define('BlobModel', {
    bin: {type: Buffer, dataType: 'blob', null: false},
    name: {type: String},
  });

  City = db.define('City', {
    name: {type: String},
    loc: {type: 'GeoPoint'},
  });
  query('SELECT VERSION()', function(err, res) {
    mysqlVersion = res && res[0] && res[0]['VERSION()'];
    blankDatabase(db, done);
  });
}

function query(sql, cb) {
  db.adapter.execute(sql, cb);
}

function blankDatabase(db, cb) {
  const dbn = db.settings.database;
  const cs = db.settings.charset;
  const co = db.settings.collation;
  query('DROP DATABASE IF EXISTS ' + dbn, function(err) {
    let q = 'CREATE DATABASE ' + dbn;
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
}
