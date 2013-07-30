var should = require('./init.js');
var assert = require('assert');
var Schema = require('loopback-datasource-juggler').Schema;

var db, UserData, StringData, NumberData, DateData; 

describe('migrations', function() {
     
    before(setup);
    
    it('should run migration', function(done) {
        db.automigrate(function(){
            done();
        });
    });
    
    it('UserData should have correct columns', function(done) {
        getFields('UserData', function(err, fields) {
            assert.deepEqual(fields, { 
                id: {
                    Field: 'id',
                    Type: 'int(11)',
                    Null: 'NO',
                    Key: 'PRI',
                    Default: null,
                    Extra: 'auto_increment' },
                email: {
                    Field: 'email',
                    Type: 'varchar(255)',
                    Null: 'NO',
                    Key: 'MUL',
                    Default: null,
                    Extra: '' },
                name: {
                    Field: 'name',
                    Type: 'varchar(255)',
                    Null: 'YES',
                    Key: '',
                    Default: null,
                    Extra: '' },
                bio: {
                    Field: 'bio',
                    Type: 'text',
                    Null: 'YES',
                    Key: '',
                    Default: null,
                    Extra: '' },
                birthDate: {
                    Field: 'birthDate',
                    Type: 'datetime',
                    Null: 'YES',
                    Key: '',
                    Default: null,
                    Extra: '' },
                pendingPeriod: {
                    Field: 'pendingPeriod',
                    Type: 'int(11)',
                    Null: 'YES',
                    Key: '',
                    Default: null,
                    Extra: '' },
                createdByAdmin: {
                    Field: 'createdByAdmin',
                    Type: 'tinyint(1)',
                    Null: 'YES',
                    Key: '',
                    Default: null,
                    Extra: '' }
            });
            done();
        });    
    });
    
    it('UserData should have correct indexes', function(done) {
        // Note: getIndexes truncates multi-key indexes to the first member. Hence index1 is correct.
        getIndexes('UserData', function(err, fields) {
            // console.log('....', fields);
            assert.deepEqual(fields, { PRIMARY: 
               { Table: 'UserData',
                 Non_unique: 0,
                 Key_name: 'PRIMARY',
                 Seq_in_index: 1,
                 Column_name: 'id',
                 Collation: 'A',
                 Cardinality: 0,
                 Sub_part: null,
                 Packed: null,
                 Null: '',
                 Index_type: 'BTREE',
                 Comment: '' },
              email: 
               { Table: 'UserData',
                 Non_unique: 1,
                 Key_name: 'email',
                 Seq_in_index: 1,
                 Column_name: 'email',
                 Collation: 'A',
                 Cardinality: null,
                 Sub_part: null,
                 Packed: null,
                 Null: '',
                 Index_type: 'BTREE',
                 Comment: '' },
              index0: 
               { Table: 'UserData',
                 Non_unique: 1,
                 Key_name: 'index0',
                 Seq_in_index: 1,
                 Column_name: 'email',
                 Collation: 'A',
                 Cardinality: null,
                 Sub_part: null,
                 Packed: null,
                 Null: '',
                 Index_type: 'BTREE',
                 Comment: '' }
            });
            done();
        });
    });
    
    it('StringData should have correct columns', function(done) {
        getFields('StringData', function(err, fields) {
            assert.deepEqual(fields, { id: 
               { Field: 'id',
                 Type: 'int(11)',
                 Null: 'NO',
                 Key: 'PRI',
                 Default: null,
                 Extra: 'auto_increment' },
              smallString: 
               { Field: 'smallString',
                 Type: 'char(127)',
                 Null: 'NO',
                 Key: 'MUL',
                 Default: null,
                 Extra: '' },
              mediumString: 
               { Field: 'mediumString',
                 Type: 'varchar(255)',
                 Null: 'NO',
                 Key: '',
                 Default: null,
                 Extra: '' },
              tinyText: 
               { Field: 'tinyText',
                 Type: 'tinytext',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' },
              giantJSON: 
               { Field: 'giantJSON',
                 Type: 'longtext',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' },
              text: 
               { Field: 'text',
                 Type: 'varchar(1024)',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' } 
            });
            done();
        });
    });
    
    it('NumberData should have correct columns', function(done) {
        getFields('NumberData', function(err, fields) {
            assert.deepEqual(fields, { 
              id: 
               { Field: 'id',
                 Type: 'int(11)',
                 Null: 'NO',
                 Key: 'PRI',
                 Default: null,
                 Extra: 'auto_increment' },
              number: 
               { Field: 'number',
                 Type: 'decimal(10,3) unsigned',
                 Null: 'NO',
                 Key: 'MUL',
                 Default: null,
                 Extra: '' },
              tinyInt: 
               { Field: 'tinyInt',
                 Type: 'tinyint(2)',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' },
              mediumInt: 
               { Field: 'mediumInt',
                 Type: 'mediumint(8) unsigned',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' },
              floater: 
               { Field: 'floater',
                 Type: 'double(14,6)',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' } 
            });
            done();
        });
    });

    it('DateData should have correct columns', function(done) {
        getFields('DateData', function(err, fields) {
            assert.deepEqual(fields, { 
              id: 
               { Field: 'id',
                 Type: 'int(11)',
                 Null: 'NO',
                 Key: 'PRI',
                 Default: null,
                 Extra: 'auto_increment' },
              dateTime: 
               { Field: 'dateTime',
                 Type: 'datetime',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' },
              timestamp: 
               { Field: 'timestamp',
                 Type: 'timestamp',
                 Null: 'YES',
                 Key: '',
                 Default: null,
                 Extra: '' } 
            });
            done();
        });
    });
    
    it('should autoupgrade', function(done) {
        var userExists = function(cb) {
            query('SELECT * FROM UserData', function(err, res) {
                cb(!err && res[0].email == 'test@example.com');
            });
        }

        UserData.create({email: 'test@example.com'}, function(err, user) {
            assert.ok(!err, 'Could not create user');
            userExists(function(yep) {
                assert.ok(yep, 'User does not exist');
            });
            UserData.defineProperty('email', { type: String });
            UserData.defineProperty('name', {type: String, dataType: 'char', limit: 50});
            UserData.defineProperty('newProperty', {type: Number, unsigned: true, dataType: 'bigInt'});
            // UserData.defineProperty('pendingPeriod', false); This will not work as expected.
            db.autoupdate( function(err) {
                getFields('UserData', function(err, fields) {
                    // change nullable for email
                    assert.equal(fields.email.Null, 'YES', 'Email does not allow null');
                    // change type of name
                    assert.equal(fields.name.Type, 'char(50)', 'Name is not char(50)');
                    // add new column
                    assert.ok(fields.newProperty, 'New column was not added');
                    if (fields.newProperty) {
                        assert.equal(fields.newProperty.Type, 'bigint(20) unsigned', 'New column type is not bigint(20) unsigned');
                    }
                    // drop column - will not happen.
                    // assert.ok(!fields.pendingPeriod, 'Did not drop column pendingPeriod');
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
        // 'drop column'
        UserData.dataSource.isActual(function(err, ok) {
            assert.ok(ok, 'dataSource is not actual (should be)');
            UserData.defineProperty('essay', {type: Schema.Text});
            // UserData.defineProperty('email', false); Can't undefine currently.
            UserData.dataSource.isActual(function(err, ok) {
                assert.ok(!ok, 'dataSource is actual (shouldn\t be)');
                done()
            });
        });
    });
    
    it('should allow numbers with decimals', function(done) {
        NumberData.create({number: 1.1234567, tinyInt: 123456, mediumInt: -1234567, floater: 123456789.1234567 }, function(err, obj) {
            assert.ok(!err);
            assert.ok(obj);
            NumberData.findById(obj.id, function(err, found) {
                assert.equal(found.number, 1.123);
                assert.equal(found.tinyInt, 127);
                assert.equal(found.mediumInt, 0);
                assert.equal(found.floater, 99999999.999999);
                done();
            });
        });
    });
    
    it('should allow both kinds of date columns', function(done) {
        DateData.create({   
            dateTime: new Date('Aug 9 1996 07:47:33 GMT'), 
            timestamp: new Date('Sep 22 2007 17:12:22 GMT')
        }, function(err, obj){
            assert.ok(!err);
            assert.ok(obj);
            DateData.findById(obj.id, function(err, found){
                assert.equal(found.dateTime.toGMTString(), 'Fri, 09 Aug 1996 07:47:33 GMT');
                assert.equal(found.timestamp.toGMTString(), 'Sat, 22 Sep 2007 17:12:22 GMT');
                done();
            });
        });
    });
    
    it('should disconnect when done', function(done) {
        db.disconnect();
        done()
    });

});

function setup(done) {

    require('./init.js');
    
    db = getSchema();    
    
    UserData = db.define('UserData', {
        email: { type: String, null: false, index: true },
        name: String,
        bio: Schema.Text,
        birthDate: Date,
        pendingPeriod: Number,
        createdByAdmin: Boolean,
    } , { indexes: {
            index0: {
                columns: 'email, createdByAdmin'
            }
        }
    });

    StringData = db.define('StringData', {
        smallString: {type: String, null: false, index: true, dataType: 'char', limit: 127},
        mediumString: {type: String, null: false,  dataType: 'varchar', limit: 255},
        tinyText: {type: String, dataType: 'tinyText'},
        giantJSON: {type: Schema.JSON, dataType: 'longText'},
        text: {type: Schema.Text, dataType: 'varchar', limit: 1024}
    });
    
    NumberData = db.define('NumberData', {
        number: {type: Number, null: false, index: true, unsigned: true, dataType: 'decimal', precision: 10, scale: 3},
        tinyInt: {type: Number, dataType: 'tinyInt', display: 2},
        mediumInt: {type: Number, dataType: 'mediumInt', unsigned: true},
        floater: {type: Number, dataType: 'double', precision: 14, scale: 6}
    });
        
    DateData = db.define('DateData', {
        dateTime: {type: Date, dataType: 'datetime'},
        timestamp: {type: Date, dataType: 'timestamp'}
    });

    blankDatabase(db, done);
    
}

var query = function (sql, cb) {
    db.adapter.query(sql, cb);
};

var blankDatabase = function (db, cb) {
    var dbn = db.settings.database;
    var cs = db.settings.charset;
    var co = db.settings.collation;
    query('DROP DATABASE IF EXISTS ' + dbn, function(err) {
        var q = 'CREATE DATABASE ' + dbn;
        if(cs){
            q += ' CHARACTER SET ' + cs;
        }
        if(co){
            q += ' COLLATE ' + co;
        }
        query(q, function(err) {
            query('USE '+ dbn, cb);
        });
    });
};

getFields = function (model, cb) {
    query('SHOW FIELDS FROM ' + model, function(err, res) {
        if (err) {
            cb(err);
        } else {
            var fields = {};
            res.forEach(function(field){
                fields[field.Field] = field;
            });
            cb(err, fields);
        }
    });
}

getIndexes = function (model, cb) {
    query('SHOW INDEXES FROM ' + model, function(err, res) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            var indexes = {};
            // Note: this will only show the first key of compound keys
            res.forEach(function(index) {
                if (parseInt(index.Seq_in_index, 10) == 1) {
                    indexes[index.Key_name] = index 
                }
            });
            cb(err, indexes);
        }
    });
};






