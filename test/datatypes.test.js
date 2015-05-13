require('./init.js');
var assert = require('assert');

var db, EnumModel, ANIMAL_ENUM;

describe('MySQL specific datatypes', function () {

  before(setup);

  it('should run migration', function (done) {
    db.automigrate(function () {
      done();
    });
  });

  it('An enum should parse itself', function (done) {
    assert.equal(ANIMAL_ENUM.CAT, ANIMAL_ENUM('cat'));
    assert.equal(ANIMAL_ENUM.CAT, ANIMAL_ENUM('CAT'));
    assert.equal(ANIMAL_ENUM.CAT, ANIMAL_ENUM(2));
    assert.equal(ANIMAL_ENUM.CAT, 'cat');
    assert.equal(ANIMAL_ENUM(null), null);
    assert.equal(ANIMAL_ENUM(''), '');
    assert.equal(ANIMAL_ENUM(0), '');
    done();
  });

  it('should create a model instance with Enums', function (done) {
    var em = EnumModel.create({animal: ANIMAL_ENUM.CAT, condition: 'sleepy', mood: 'happy'}, function (err, obj) {
      assert.ok(!err);
      assert.equal(obj.condition, 'sleepy');
      EnumModel.findOne({where: {animal: ANIMAL_ENUM.CAT}}, function (err, found) {
        assert.ok(!err);
        assert.equal(found.mood, 'happy');
        assert.equal(found.animal, ANIMAL_ENUM.CAT);
        done();
      });
    });
  });

  it('should fail spectacularly with invalid enum values', function (done) {
    var em = EnumModel.create({animal: 'horse', condition: 'sleepy', mood: 'happy'}, function (err, obj) {
      assert.ok(!err);
      EnumModel.findById(obj.id, function (err, found) {
        assert.ok(!err);
        assert.equal(found.animal, ''); // MySQL fun.
        assert.equal(found.animal, 0);
        done();
      });
    });
  });

  it('should create a model instance with object/json types', function (done) {
    var note = {a: 1, b: '2'};
    var extras = {c: 3, d: '4'};
    var em = EnumModel.create({animal: ANIMAL_ENUM.DOG, condition: 'sleepy',
      mood: 'happy', note: note, extras: extras}, function (err, obj) {
      assert.ok(!err);
      assert.equal(obj.condition, 'sleepy');
      EnumModel.findOne({where: {animal: ANIMAL_ENUM.DOG}}, function (err, found) {
        assert.ok(!err);
        assert.equal(found.mood, 'happy');
        assert.equal(found.animal, ANIMAL_ENUM.DOG);
        assert.deepEqual(found.note, note);
        assert.deepEqual(found.extras, extras);
        done();
      });
    });
  });

  it('should disconnect when done', function (done) {
    db.disconnect();
    done()
  });

});

function setup(done) {

  require('./init.js');

  db = getSchema();

  ANIMAL_ENUM = db.EnumFactory('dog', 'cat', 'mouse');

  EnumModel = db.define('EnumModel', {
    animal: { type: ANIMAL_ENUM, null: false },
    condition: { type: db.EnumFactory('hungry', 'sleepy', 'thirsty') },
    mood: { type: db.EnumFactory('angry', 'happy', 'sad') },
    note: Object,
    extras: 'JSON'
  });

  blankDatabase(db, done);

}

var query = function (sql, cb) {
  db.adapter.execute(sql, cb);
};

var blankDatabase = function (db, cb) {
  var dbn = db.settings.database;
  var cs = db.settings.charset;
  var co = db.settings.collation;
  query('DROP DATABASE IF EXISTS ' + dbn, function (err) {
    var q = 'CREATE DATABASE ' + dbn;
    if (cs) {
      q += ' CHARACTER SET ' + cs;
    }
    if (co) {
      q += ' COLLATE ' + co;
    }
    query(q, function (err) {
      query('USE ' + dbn, cb);
    });
  });
};

getFields = function (model, cb) {
  query('SHOW FIELDS FROM ' + model, function (err, res) {
    if (err) {
      cb(err);
    } else {
      var fields = {};
      res.forEach(function (field) {
        fields[field.Field] = field;
      });
      cb(err, fields);
    }
  });
}

getIndexes = function (model, cb) {
  query('SHOW INDEXES FROM ' + model, function (err, res) {
    if (err) {
      console.log(err);
      cb(err);
    } else {
      var indexes = {};
      // Note: this will only show the first key of compound keys
      res.forEach(function (index) {
        if (parseInt(index.Seq_in_index, 10) == 1) {
          indexes[index.Key_name] = index
        }
      });
      cb(err, indexes);
    }
  });
};






