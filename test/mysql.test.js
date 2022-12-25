// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const async = require('async');
const should = require('./init.js');
const sinon = require('sinon');
const List = require('loopback-datasource-juggler/lib/list');

let Post, PostWithStringId, PostWithUniqueTitle, PostWithNumId, Student, db;

// Mock up mongodb ObjectID
function ObjectID(id) {
  if (!(this instanceof ObjectID)) {
    return new ObjectID(id);
  }
  this.id1 = id.substring(0, 2);
  this.id2 = id.substring(2);
}

ObjectID.prototype.toJSON = function() {
  return this.id1 + this.id2;
};

describe('mysql', function() {
  before(function(done) {
    db = global.getDataSource();

    Post = db.define('PostWithDefaultId', {
      title: {type: String, length: 255, index: true},
      content: {type: String},
      comments: [String],
      history: Object,
      stars: Number,
      userId: ObjectID,
    }, {
      forceId: false,
      indexes: {
        content_fts_index: {
          kind: 'FULLTEXT',
          columns: 'content',
        },
        title_fts_index: {
          kind: 'FULLTEXT',
          columns: 'title',
        },
      },
      allowExtendedOperators: true,
    });

    PostWithStringId = db.define('PostWithStringId', {
      id: {type: String, id: true},
      title: {type: String, length: 255, index: true},
      content: {type: String},
    });
    PostWithNumId = db.define('PostWithNumId', {
      id: {type: Number, id: true, null: false},
      title: {type: String, length: 255, null: false, index: true},
      content: {type: String, null: false},
      buffProp: {type: Buffer, null: false},
      objProp: {type: Object, null: false},
      arrProp: {type: [Number], null: false},
      dateProp: {type: Date, null: false},
      pointProp: {type: 'GeoPoint', null: false},
    });
    PostWithUniqueTitle = db.define('PostWithUniqueTitle', {
      title: {type: String, length: 255, index: {unique: true}},
      content: {type: String},
    });

    Student = db.define('Student', {
      name: {type: String, length: 255},
      age: {type: Number},
    }, {
      forceId: false,
    });

    db.automigrate(
      ['PostWithDefaultId', 'PostWithStringId',
        'PostWithUniqueTitle', 'PostWithNumId', 'Student'],
      function(err) {
        should.not.exist(err);
        done(err);
      },
    );
  });

  beforeEach(function() {
    return deleteAllModelInstances();
  });

  it('should allow array or object', function(done) {
    Post.create({title: 'a', content: 'AAA', comments: ['1', '2'],
      history: {a: 1, b: 'b'}}, function(err, post) {
      should.not.exist(err);

      Post.findById(post.id, function(err, p) {
        p.id.should.be.equal(post.id);

        p.content.should.be.equal(post.content);
        p.title.should.be.equal('a');
        p.comments.should.eql(new List(['1', '2']));
        p.history.should.eql({a: 1, b: 'b'});

        done();
      });
    });
  });

  it('should allow ObjectID', function(done) {
    const uid = new ObjectID('123');
    Post.create({title: 'a', content: 'AAA', userId: uid},
      function(err, post) {
        should.not.exist(err);

        Post.findById(post.id, function(err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('a');
          p.userId.should.eql(uid);
          done();
        });
      });
  });

  it('createAll should create an array of instances', function(done) {
    Post.createAll([
      {title: 'Title 1', content: 'Content 1'},
      {title: 'Title 2', content: 'Content 2'},
    ],
    function(err, posts) {
      should.not.exist(err);
      posts.should.be.an.Array;
      posts.should.have.lengthOf(2);
      posts[0].should.have.property('id');
      posts[0].id.should.be.a.Number;
      posts[0].title.should.be.equal('Title 1');
      posts[0].content.should.be.equal('Content 1');
      posts[1].should.have.property('id');
      posts[1].id.should.be.a.Number;
      posts[1].title.should.be.equal('Title 2');
      posts[1].content.should.be.equal('Content 2');

      Post.findById(posts[0].id, function(er, p) {
        should.not.exist(er);
        p.id.should.be.equal(posts[0].id);
        p.content.should.be.equal(posts[0].content);
        done();
      });
    });
  });

  it('createAll should create an array of instances even when id is not auto generated', function(done) {
    PostWithStringId.createAll([
      {id: '10', title: 'Title 1', content: 'Content 1'},
      {id: '20', title: 'Title 2', content: 'Content 2'},
    ],
    function(err, posts) {
      should.not.exist(err);
      posts.should.be.an.Array;
      posts.should.have.lengthOf(2);
      posts[0].should.have.property('id');
      posts[0].id.should.be.a.String;
      posts[0].title.should.be.equal('Title 1');
      posts[0].content.should.be.equal('Content 1');
      posts[1].should.have.property('id');
      posts[1].id.should.be.a.String;
      posts[1].title.should.be.equal('Title 2');
      posts[1].content.should.be.equal('Content 2');

      PostWithStringId.findById(posts[0].id, function(er, p) {
        should.not.exist(er);
        p.id.should.be.equal(posts[0].id);
        p.content.should.be.equal(posts[0].content);
        done();
      });
    });
  });

  it('updateOrCreate should update the instance', function(done) {
    Post.create({title: 'a', content: 'AAA'}, function(err, post) {
      post.title = 'b';
      Post.updateOrCreate(post, function(err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);

        Post.findById(post.id, function(err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('b');

          done();
        });
      });
    });
  });

  it('updateOrCreate should update the instance without removing existing properties', function(done) {
    Post.create({title: 'a', content: 'AAA'}, function(err, post) {
      post = post.toObject();
      delete post.title;
      Post.updateOrCreate(post, function(err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);
        Post.findById(post.id, function(err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('a');

          done();
        });
      });
    });
  });

  it('updateOrCreate should create a new instance if it does not exist', function(done) {
    const post = {id: 123, title: 'a', content: 'AAA'};
    Post.updateOrCreate(post, function(err, p) {
      should.not.exist(err);
      p.title.should.be.equal(post.title);
      p.content.should.be.equal(post.content);
      p.id.should.be.equal(post.id);

      Post.findById(p.id, function(err, p) {
        p.id.should.be.equal(post.id);

        p.content.should.be.equal(post.content);
        p.title.should.be.equal(post.title);
        p.id.should.be.equal(post.id);

        done();
      });
    });
  });

  context('replaceOrCreate', function() {
    it('should replace the instance', function(done) {
      Post.create({title: 'a', content: 'AAA'}, function(err, post) {
        if (err) return done(err);
        post = post.toObject();
        delete post.content;
        Post.replaceOrCreate(post, function(err, p) {
          if (err) return done(err);
          p.id.should.equal(post.id);
          p.title.should.equal('a');
          should.not.exist(p.content);
          should.not.exist(p._id);
          Post.findById(post.id, function(err, p) {
            if (err) return done(err);
            p.id.should.equal(post.id);
            p.title.should.equal('a');
            should.not.exist(post.content);
            should.not.exist(p._id);
            done();
          });
        });
      });
    });

    it('should replace with new data', function(done) {
      Post.create({title: 'a', content: 'AAA', comments: ['Comment1']},
        function(err, post) {
          if (err) return done(err);
          post = post.toObject();
          delete post.comments;
          delete post.content;
          post.title = 'b';
          Post.replaceOrCreate(post, function(err, p) {
            if (err) return done(err);
            p.id.should.equal(post.id);
            should.not.exist(p._id);
            p.title.should.equal('b');
            should.not.exist(p.content);
            should.not.exist(p.comments);
            Post.findById(post.id, function(err, p) {
              if (err) return done(err);
              p.id.should.equal(post.id);
              should.not.exist(p._id);
              p.title.should.equal('b');
              should.not.exist(p.content);
              should.not.exist(p.comments);
              done();
            });
          });
        });
    });

    it('should create a new instance if it does not exist', function(done) {
      const post = {id: 123, title: 'a', content: 'AAA'};
      Post.replaceOrCreate(post, function(err, p) {
        if (err) return done(err);
        p.id.should.equal(post.id);
        should.not.exist(p._id);
        p.title.should.equal(post.title);
        p.content.should.equal(post.content);
        Post.findById(p.id, function(err, p) {
          if (err) return done(err);
          p.id.should.equal(post.id);
          should.not.exist(p._id);
          p.title.should.equal(post.title);
          p.content.should.equal(post.content);
          done();
        });
      });
    });

    it('isNewInstance should be undefined for after save hook', function(done) {
      const student = {name: 'Joe', age: 20};
      const newStudent = {};
      let isNewInstanceBefore = false;
      let isNewInstanceAfter = false;
      Student.create(student, function(err, createdStudent) {
        if (err) return done(err);
        newStudent.id = createdStudent.id;
        newStudent.name = 'Hannah';
        newStudent.age = 25;
        Student.observe('before save', function(ctx, next) {
          isNewInstanceBefore = ctx.isNewInstance;
          next();
        });
        Student.observe('after save', function(ctx, next) {
          isNewInstanceAfter = ctx.isNewInstance;
          next();
        });
        Student.replaceOrCreate(newStudent, function(err, s) {
          if (err) return done(err);
          should.not.exist(isNewInstanceBefore);
          should.not.exist(isNewInstanceAfter);
          done();
        });
      });
    });
  });

  it('save should update the instance with the same id', function(done) {
    Post.create({title: 'a', content: 'AAA'}, function(err, post) {
      post.title = 'b';
      post.save(function(err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);

        Post.findById(post.id, function(err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('b');

          done();
        });
      });
    });
  });

  it('save should update the instance without removing existing properties',
    function(done) {
      Post.create({title: 'a', content: 'AAA'}, function(err, post) {
        delete post.title;
        post.save(function(err, p) {
          should.not.exist(err);
          p.id.should.be.equal(post.id);
          p.content.should.be.equal(post.content);

          Post.findById(post.id, function(err, p) {
            p.id.should.be.equal(post.id);

            p.content.should.be.equal(post.content);
            p.title.should.be.equal('a');
            done();
          });
        });
      });
    });

  it('save should create a new instance if it does not exist', function(done) {
    const post = new Post({id: 123, title: 'a', content: 'AAA'});
    post.save(post, function(err, p) {
      should.not.exist(err);
      p.title.should.be.equal(post.title);
      p.content.should.be.equal(post.content);
      p.id.should.be.equal(post.id);

      Post.findById(p.id, function(err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);

        p.content.should.be.equal(post.content);
        p.title.should.be.equal(post.title);
        p.id.should.be.equal(post.id);

        done();
      });
    });
  });

  it('all return should honor filter.fields', function(done) {
    const post = new Post({title: 'b', content: 'BBB'});
    post.save(function(err, post) {
      Post.all({fields: ['title'], where: {title: 'b'}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.lengthOf(1);
        post = posts[0];
        post.should.have.property('title', 'b');
        post.should.have.property('content', undefined);
        should.not.exist(post.id);

        done();
      });
    });
  });

  it('find should order by id if the order is not set for the query filter',
    function(done) {
      PostWithStringId.create({id: '2', title: 'c', content: 'CCC'}, function(err, post) {
        PostWithStringId.create({id: '1', title: 'd', content: 'DDD'}, function(err, post) {
          PostWithStringId.find(function(err, posts) {
            should.not.exist(err);
            posts.length.should.be.equal(2);
            posts[0].id.should.be.equal('1');

            PostWithStringId.find({limit: 1, offset: 0}, function(err, posts) {
              should.not.exist(err);
              posts.length.should.be.equal(1);
              posts[0].id.should.be.equal('1');

              PostWithStringId.find({limit: 1, offset: 1}, function(err, posts) {
                should.not.exist(err);
                posts.length.should.be.equal(1);
                posts[0].id.should.be.equal('2');
                done();
              });
            });
          });
        });
      });
    });

  it('should allow to find using like', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {title: {like: 'M%st'}}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support like for no match', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {title: {like: 'M%XY'}}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should allow to find using nlike', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {title: {nlike: 'M%st'}}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should support nlike for no match', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {title: {nlike: 'M%XY'}}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support "and" operator that is satisfied', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {and: [
        {title: 'My Post'},
        {content: 'Hello'},
      ]}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support "and" operator that is not satisfied', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {and: [
        {title: 'My Post'},
        {content: 'Hello1'},
      ]}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should support "or" that is satisfied', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {or: [
        {title: 'My Post'},
        {content: 'Hello1'},
      ]}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support "or" operator that is not satisfied', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.find({where: {or: [
        {title: 'My Post1'},
        {content: 'Hello1'},
      ]}}, function(err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });
  context('null vals in different operators', function() {
    const defaultPost = {
      id: 3,
      title: 'defTitle',
      content: 'defContent',
      buffProp: new Buffer('defBuffer'),
      objProp: {defKey: 'defVal'},
      arrProp: [0],
      dateProp: new Date('2017-06-14'),
      pointProp: {lng: 4.51515, lat: 57.2314},
    };
    beforeEach(function(done) {
      PostWithNumId.destroyAll(done);
    });
    after(function(done) {
      PostWithNumId.destroyAll(done);
    });
    it('should handle null in inq operator', function(done) {
      defaultPost.id = 1;
      defaultPost.title = 'Foo';
      defaultPost.content = 'Bar';
      PostWithNumId.create(defaultPost, function(err, post) {
        should.not.exist(err);
        post.id.should.equal(defaultPost.id);
        PostWithNumId.find({where: {id: {inq: [null, 1]}}}, function(err, posts) {
          should.not.exist(err);
          posts.length.should.equal(1);
          posts[0].title.should.equal('Foo');
          posts[0].id.should.equal(1);
          done();
        });
      });
    });

    it('should handle null in nin operator', function(done) {
      defaultPost.id = 2;
      defaultPost.title = 'Make';
      defaultPost.content = 'Toyota';
      PostWithNumId.create(defaultPost, function(err, post) {
        should.not.exist(err);
        post.id.should.equal(defaultPost.id);
        PostWithNumId.find({where: {id: {nin: [null, 3]}}}, function(err, posts) {
          should.not.exist(err);
          posts.length.should.equal(1);
          posts[0].content.should.equal('Toyota');
          posts[0].id.should.equal(2);
          done();
        });
      });
    });

    it('should handle null in neq operator', function(done) {
      defaultPost.id = 3;
      defaultPost.title = 'Model';
      defaultPost.content = 'Corolla';
      PostWithNumId.create(defaultPost, function(err, post) {
        should.not.exist(err);
        post.id.should.equal(defaultPost.id);
        PostWithNumId.find({where: {id: {neq: null}}}, function(err, posts) {
          should.not.exist(err);
          posts.length.should.equal(1);
          posts[0].content.should.equal('Corolla');
          posts[0].id.should.equal(3);
          done();
        });
      });
    });

    it('should handle null in nin op for different datatypes', function(done) {
      PostWithNumId.create(defaultPost, function(err, post) {
        should.not.exist(err);
        post.id.should.equal(defaultPost.id);
        PostWithNumId.find({where: {and: [
          {id: {nin: [null]}},
          {title: {nin: [null]}},
          {content: {nin: [null]}},
          {buffProp: {nin: [null]}},
          {objProp: {nin: [null]}},
          {arrProp: {nin: [null]}},
          {dateProp: {nin: [null]}},
          {pointProp: {nin: [null]}},
        ]}}, function(err, posts) {
          should.not.exist(err);
          posts.length.should.equal(1);
          posts[0].toObject().should.deepEqual(defaultPost);
          done();
        });
      });
    });
  });

  // The where object should be parsed by the connector
  it('should support where for count', function(done) {
    Post.create({title: 'My Post', content: 'Hello'}, function(err, post) {
      Post.count({and: [
        {title: 'My Post'},
        {content: 'Hello'},
      ]}, function(err, count) {
        should.not.exist(err);
        count.should.be.equal(1);
        Post.count({and: [
          {title: 'My Post1'},
          {content: 'Hello'},
        ]}, function(err, count) {
          should.not.exist(err);
          count.should.be.equal(0);
          done();
        });
      });
    });
  });

  // The where object should be parsed by the connector
  it('should support where for destroyAll', function(done) {
    Post.create({title: 'My Post1', content: 'Hello'}, function(err, post) {
      Post.create({title: 'My Post2', content: 'Hello'}, function(err, post) {
        Post.destroyAll({and: [
          {title: 'My Post1'},
          {content: 'Hello'},
        ]}, function(err) {
          should.not.exist(err);
          Post.count(function(err, count) {
            should.not.exist(err);
            count.should.be.equal(1);
            done();
          });
        });
      });
    });
  });

  it('should not allow SQL injection for inq operator', function(done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function(err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function(err, post) {
            Post.find({where: {title: {inq: ['SELECT title from PostWithDefaultId']}}},
              function(err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for lt operator', function(done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function(err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function(err, post) {
            Post.find({where: {stars: {lt: 'SELECT title from PostWithDefaultId'}}},
              function(err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for nin operator', function(done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function(err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function(err, post) {
            Post.find({where: {title: {nin: ['SELECT title from PostWithDefaultId']}}},
              function(err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 2);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for inq operator with number column', function(done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function(err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function(err, post) {
            Post.find({where: {stars: {inq: ['SELECT title from PostWithDefaultId']}}},
              function(err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for inq operator with array value', function(done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function(err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function(err, post) {
            Post.find({where: {stars: {inq: [5, 'SELECT title from PostWithDefaultId']}}},
              function(err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 1);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for between operator', function(done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function(err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function(err, post) {
            Post.find({where: {stars: {between: [5, 'SELECT title from PostWithDefaultId']}}},
              function(err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow duplicate titles', function(done) {
    const data = {title: 'a', content: 'AAA'};
    PostWithUniqueTitle.create(data, function(err, post) {
      should.not.exist(err);
      PostWithUniqueTitle.create(data, function(err, post) {
        should.exist(err);
        done();
      });
    });
  });

  context('regexp operator', function() {
    beforeEach(function deleteExistingTestFixtures(done) {
      Post.destroyAll(done);
    });
    beforeEach(function createTestFixtures(done) {
      Post.createAll([
        {title: 'a', content: 'AAA'},
        {title: 'b', content: 'BBB'},
      ], done);
    });
    after(function deleteTestFixtures(done) {
      Post.destroyAll(done);
    });

    context('with regex strings', function() {
      context('using no flags', function() {
        it('should work', function(done) {
          Post.find({where: {content: {regexp: '^A'}}}, function(err, posts) {
            should.not.exist(err);
            posts.length.should.equal(1);
            posts[0].content.should.equal('AAA');
            done();
          });
        });
      });

      context('using flags', function() {
        beforeEach(function addSpy() {
          sinon.stub(console, 'warn');
        });
        afterEach(function removeSpy() {
          console.warn.restore();
        });

        it('should work', function(done) {
          Post.find({where: {content: {regexp: '^a/i'}}}, function(err, posts) {
            should.not.exist(err);
            posts.length.should.equal(1);
            posts[0].content.should.equal('AAA');
            done();
          });
        });

        it('should print a warning when the ignore flag is set',
          function(done) {
            Post.find({where: {content: {regexp: '^a/i'}}}, function(err, posts) {
              console.warn.calledOnce.should.be.ok;
              done();
            });
          });

        it('should print a warning when the global flag is set',
          function(done) {
            Post.find({where: {content: {regexp: '^a/g'}}}, function(err, posts) {
              console.warn.calledOnce.should.be.ok;
              done();
            });
          });

        it('should print a warning when the multiline flag is set',
          function(done) {
            Post.find({where: {content: {regexp: '^a/m'}}}, function(err, posts) {
              console.warn.calledOnce.should.be.ok;
              done();
            });
          });
      });

      it('filter with case sensitive regex string', function(done) {
        Post.find({where: {content: {regexp: '^a'}}}, function(err, posts) {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(0);
          done();
        });
      });
    });

    context('with regex literals', function() {
      context('using no flags', function() {
        it('should work', function(done) {
          Post.find({where: {content: {regexp: /^A/}}}, function(err, posts) {
            should.not.exist(err);
            posts.length.should.equal(1);
            posts[0].content.should.equal('AAA');
            done();
          });
        });
      });

      context('using flags', function() {
        beforeEach(function addSpy() {
          sinon.stub(console, 'warn');
        });
        afterEach(function removeSpy() {
          console.warn.restore();
        });

        it('should work', function(done) {
          Post.find({where: {content: {regexp: /^a/i}}}, function(err, posts) {
            should.not.exist(err);
            posts.length.should.equal(1);
            posts[0].content.should.equal('AAA');
            done();
          });
        });

        it('should print a warning when the ignore flag is set',
          function(done) {
            Post.find({where: {content: {regexp: /^a/i}}}, function(err, posts) {
              console.warn.calledOnce.should.be.ok;
              done();
            });
          });

        it('should print a warning when the global flag is set',
          function(done) {
            Post.find({where: {content: {regexp: /^a/g}}}, function(err, posts) {
              console.warn.calledOnce.should.be.ok;
              done();
            });
          });

        it('should print a warning when the multiline flag is set',
          function(done) {
            Post.find({where: {content: {regexp: /^a/m}}}, function(err, posts) {
              console.warn.calledOnce.should.be.ok;
              done();
            });
          });
      });

      it('filter with case sensitive regex literal', function(done) {
        Post.find({where: {content: {regexp: /^B/}}}, function(err, posts) {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(1);
          posts[0].content.should.equal('BBB');
          done();
        });
      });
    });

    context('with regex objects', function() {
      beforeEach(function addSpy() {
        sinon.stub(console, 'warn');
      });
      afterEach(function removeSpy() {
        console.warn.restore();
      });

      context('using no flags', function() {
        it('should work', function(done) {
          Post.find({where: {content: {regexp: new RegExp(/^A/)}}},
            function(err, posts) {
              should.not.exist(err);
              posts.length.should.equal(1);
              posts[0].content.should.equal('AAA');
              done();
            });
        });
      });

      context('using flags', function() {
        it('should work', function(done) {
          Post.find({where: {content: {regexp: new RegExp(/^a/i)}}},
            function(err, posts) {
              should.not.exist(err);
              posts.length.should.equal(1);
              posts[0].content.should.equal('AAA');
              done();
            });
        });
        it('should print a warning when the ignore flag is set',
          function(done) {
            Post.find({where: {content: {regexp: new RegExp(/^a/i)}}},
              function(err, posts) {
                console.warn.calledOnce.should.be.ok;
                done();
              });
          });

        it('should print a warning when the global flag is set',
          function(done) {
            Post.find({where: {content: {regexp: new RegExp(/^a/g)}}},
              function(err, posts) {
                console.warn.calledOnce.should.be.ok;
                done();
              });
          });

        it('should print a warning when the multiline flag is set',
          function(done) {
            Post.find({where: {content: {regexp: new RegExp(/^a/m)}}},
              function(err, posts) {
                console.warn.calledOnce.should.be.ok;
                done();
              });
          });

        it('filter with case sensitive regex object', function(done) {
          Post.find({where: {content: {regexp: new RegExp(/^a/)}}}, function(err, posts) {
            should.not.exist(err);
            should.exist(posts);
            posts.length.should.equal(0);
            done();
          });
        });
      });
    });
  });

  context('match operator', function() {
    beforeEach(function deleteExistingTestFixtures(done) {
      Post.destroyAll(done);
    });
    beforeEach(function createTestFixtures(done) {
      Post.createAll([
        {title: 'About Redis', content: 'Redis is a Database'},
        {title: 'Usage', content: 'How To Use MySQL database Well'},
        {title: 'About Mysql', content: 'Mysql is a database'},
      ], done);
    });
    after(function deleteTestFixtures(done) {
      Post.destroyAll(done);
    });

    context('with one column and string', () => {
      it('should work', function(done) {
        Post.find({where: {content: {match: '+using MYSQL'}}}, (err, posts) => {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(2);
          done();
        });
      });
      it('should work in boolean mode with empty result expected', function(done) {
        Post.find({where: {content: {matchbool: '+using MYSQL'}}}, (err, posts) => {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(0);
          done();
        });
      });
      it('should work in boolean mode with one result expected', function(done) {
        Post.find({where: {content: {matchbool: '+use MYSQL'}}}, (err, posts) => {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(1);
          done();
        });
      });
      it('should work with matchqe operator with expected result in first and second pass', function(done) {
        Post.find({where: {content: {match: 'redis'}}}, (err, posts) => {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(1);
          Post.find({where: {content: {matchqe: 'redis'}}}, (err, expandedPosts) => {
            should.not.exist(err);
            should.exist(expandedPosts);
            expandedPosts.length.should.equal(3);
            done();
          });
        });
      });
      it('should work with matchnlqe operator with expected result in first and second pass', function(done) {
        Post.find({where: {content: {match: 'redis'}}}, (err, posts) => {
          should.not.exist(err);
          should.exist(posts);
          posts.length.should.equal(1);
          Post.find({where: {content: {matchnlqe: 'redis'}}}, (err, expandedPosts) => {
            should.not.exist(err);
            should.exist(expandedPosts);
            expandedPosts.length.should.equal(3);
            done();
          });
        });
      });
    });

    context('with multiple column and one string', () => {
      it('should work', function(done) {
        const against = 'using MYSQL';
        Post.find(
          {
            where: {
              or: [
                {
                  content: {
                    match: against,
                  },
                },
                {
                  title: {
                    match: against,
                  },
                },
              ],
            },
          },
          (err, posts) => {
            should.not.exist(err);
            should.exist(posts);
            posts.length.should.equal(2);
            done();
          },
        );
      });
    });
  });

  function deleteAllModelInstances() {
    const models = [
      Post, PostWithStringId, PostWithUniqueTitle, PostWithNumId, Student,
    ];
    return Promise.all(models.map(m => m.destroyAll()));
  }

  after(function() {
    return deleteAllModelInstances();
  });
});
