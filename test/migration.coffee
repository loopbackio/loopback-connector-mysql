juggling = require('loopback-data')
Schema = juggling.Schema
Text = Schema.Text

DBNAME = 'myapp_test'
DBUSER = 'strongloop'
DBPASS = 'str0ng100pjs'
DBENGINE = 'mysql'

schema = new Schema __dirname + '/..', database: '', username: DBUSER, password: DBPASS
schema.log = (q) -> console.log q

query = (sql, cb) ->
    schema.adapter.query sql, cb

User = schema.define 'User',
    email: { type: String, null: false, index: true }
    name: String
    bio: Text
    password: String
    birthDate: Date
    pendingPeriod: Number
    createdByAdmin: Boolean
,   indexes:
      index1:
        columns: 'email, createdByAdmin'

withBlankDatabase = (cb) ->
    db = schema.settings.database = DBNAME
    query 'DROP DATABASE IF EXISTS ' + db, (err) ->
        query 'CREATE DATABASE ' + db, (err) ->
            query 'USE '+ db, cb

getFields = (model, cb) ->
    query 'SHOW FIELDS FROM ' + model, (err, res) ->
        if err
            cb err
        else
            fields = {}
            res.forEach (field) -> fields[field.Field] = field
            cb err, fields

getIndexes = (model, cb) ->
    query 'SHOW INDEXES FROM ' + model, (err, res) ->
        if err
            console.log err
            cb err
        else
            indexes = {}
            # Note: this will only show the first key of compound keys
            res.forEach (index) ->
              indexes[index.Key_name] = index if parseInt(index.Seq_in_index, 10) == 1
            cb err, indexes

it = (name, testCases) ->
  module.exports[name] = testCases

it 'should run migration', (test) ->
    withBlankDatabase (err) ->
        schema.automigrate ->
            getFields 'User', (err, fields) ->
                test.deepEqual fields,
                    id:
                        Field: 'id'
                        Type: 'int(11)'
                        Null: 'NO'
                        Key: 'PRI'
                        Default: null
                        Extra: 'auto_increment'
                    email:
                        Field: 'email'
                        Type: 'varchar(255)'
                        Null: 'NO'
                        Key: 'MUL'
                        Default: null
                        Extra: ''
                    name:
                        Field: 'name'
                        Type: 'varchar(255)'
                        Null: 'YES'
                        Key: ''
                        Default: null
                        Extra: '' 
                    bio:
                        Field: 'bio'
                        Type: 'text'
                        Null: 'YES'
                        Key: ''
                        Default: null
                        Extra: ''
                    password:
                        Field: 'password'
                        Type: 'varchar(255)'
                        Null: 'YES'
                        Key: ''
                        Default: null
                        Extra: ''
                    birthDate:
                        Field: 'birthDate'
                        Type: 'datetime'
                        Null: 'YES'
                        Key: ''
                        Default: null
                        Extra: ''
                    pendingPeriod:
                        Field: 'pendingPeriod'
                        Type: 'int(11)'
                        Null: 'YES'
                        Key: ''
                        Default: null
                        Extra: ''
                    createdByAdmin:
                        Field: 'createdByAdmin'
                        Type: 'tinyint(1)'
                        Null: 'YES'
                        Key: ''
                        Default: null
                        Extra: ''
            # Once gain, getIdexes truncates multi-key indexes to the first member. Hence index1 is correct.
            getIndexes 'User', (err, fields) ->
                test.deepEqual fields,
                    PRIMARY:
                        Table: 'User'
                        Non_unique: 0
                        Key_name: 'PRIMARY'
                        Seq_in_index: 1
                        Column_name: 'id'
                        Collation: 'A'
                        Cardinality: 0
                        Sub_part: null
                        Packed: null
                        Null: ''
                        Index_type: 'BTREE'
                        Comment: ''
                        Index_comment: ''
                    email:
                        Table: 'User'
                        Non_unique: 1
                        Key_name: 'email'
                        Seq_in_index: 1
                        Column_name: 'email'
                        Collation: 'A'
                        Cardinality: 0
                        Sub_part: null
                        Packed: null
                        Null: ''
                        Index_type: 'BTREE'
                        Comment: ''
                        Index_comment: ''
                    index1:
                        Table: 'User'
                        Non_unique: 1
                        Key_name: 'index1'
                        Seq_in_index: 1
                        Column_name: 'email'
                        Collation: 'A'
                        Cardinality: 0
                        Sub_part: null
                        Packed: null
                        Null: ''
                        Index_type: 'BTREE'
                        Comment: ''
                        Index_comment: ''
                test.done()

it 'should autoupgrade', (test) ->
    userExists = (cb) ->
        query 'SELECT * FROM User', (err, res) ->
            cb(not err and res[0].email == 'test@example.com')

    User.create email: 'test@example.com', (err, user) ->
        test.ok not err
        userExists (yep) ->
            test.ok yep
            User.defineProperty 'email', type: String
            User.defineProperty 'name', type: String, limit: 50
            User.defineProperty 'newProperty', type: Number
            User.defineProperty 'pendingPeriod', false
            schema.autoupdate (err) ->
                getFields 'User', (err, fields) ->
                    # change nullable for email
                    test.equal fields.email.Null, 'YES', 'Email is not null'
                    # change type of name
                    test.equal fields.name.Type, 'varchar(50)', 'Name is not varchar(50)'
                    # add new column
                    test.ok fields.newProperty, 'New column was not added'
                    if fields.newProperty
                        test.equal fields.newProperty.Type, 'int(11)', 'New column type is not int(11)'
                    # drop column
                    test.ok not fields.pendingPeriod, 'drop column'

                    # user still exists
                    userExists (yep) ->
                        test.ok yep
                        test.done()

it 'should check actuality of schema', (test) ->
    # drop column
    User.schema.isActual (err, ok) ->
        test.ok ok, 'schema is actual'
        User.defineProperty 'email', false
        User.schema.isActual (err, ok) ->
            test.ok not ok, 'schema is not actual'
            test.done()

it 'should add single-column index', (test) ->
    User.defineProperty 'email', type: String, index: { kind: 'FULLTEXT', type: 'HASH'}
    User.schema.autoupdate (err) ->
        return console.log(err) if err
        getIndexes 'User', (err, ixs) ->
            test.ok ixs.email && ixs.email.Column_name == 'email'
            console.log(ixs)
            test.equal ixs.email.Index_type, 'BTREE', 'default index type'
            test.done()

it 'should change type of single-column index', (test) ->
    User.defineProperty 'email', type: String, index: { type: 'BTREE' }
    User.schema.isActual (err, ok) ->
        test.ok ok, 'schema is actual'
        User.schema.autoupdate (err) ->
        return console.log(err) if err
        getIndexes 'User', (err, ixs) ->
            test.ok ixs.email && ixs.email.Column_name == 'email'
            test.equal ixs.email.Index_type, 'BTREE'
            test.done()

it 'should remove single-column index', (test) ->
    User.defineProperty 'email', type: String, index: false
    User.schema.autoupdate (err) ->
        return console.log(err) if err
        getIndexes 'User', (err, ixs) ->
            test.ok !ixs.email
            test.done()

it 'should update multi-column index when order of columns changed', (test) ->
    User.schema.adapter._models.User.settings.indexes.index1.columns = 'createdByAdmin, email'
    User.schema.isActual (err, ok) ->
        test.ok not ok, 'schema is not actual'
        User.schema.autoupdate (err) ->
            return console.log(err) if err
            getIndexes 'User', (err, ixs) ->
                test.equals ixs.index1.Column_name, 'createdByAdmin'
                test.done()


it 'test', (test) ->
    User.defineProperty 'email', type: String, index: true
    User.schema.autoupdate (err) ->
        User.schema.autoupdate (err) ->
            User.schema.autoupdate (err) ->
                test.done()

it 'should disconnect when done', (test) ->
    schema.disconnect()
    test.done()

