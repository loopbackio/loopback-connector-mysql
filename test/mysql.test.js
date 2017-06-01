// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var should = require('./init.js');

var Post, PostWithStringId, PostWithUniqueTitle, db;

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
    db = getDataSource();

    Post = db.define('PostWithDefaultId', {
      title: {type: String, length: 255, index: true},
      content: {type: String},
      comments: [String],
      history: Object,
      stars: Number,
      userId: ObjectID,
    }, {
      forceId: false,
    });

    PostWithStringId = db.define('PostWithStringId', {
      id: {type: String, id: true},
      title: {type: String, length: 255, index: true},
      content: {type: String},
    });

    PostWithUniqueTitle = db.define('PostWithUniqueTitle', {
      title: {type: String, length: 255, index: {unique: true}},
      content: {type: String},
    });

    Hash = db.define('Buffer', {
      hash: { type: 'buffer', mysql: {columnName: 'hash', dataType: 'BINARY', dataLength: 16}},
      buffer: { type: Buffer }
    });

    db.automigrate(['PostWithDefaultId', 'PostWithStringId', 'PostWithUniqueTitle', 'Buffer'], function(err) {
      should.not.exist(err);
      done(err);
    });
  });

  beforeEach(function(done) {
    Post.destroyAll(function() {
      PostWithStringId.destroyAll(function() {
        PostWithUniqueTitle.destroyAll(function() {
          done();
        });
      });
    });
  });

  it('should allow array or object', function(done) {
    Post.create({title: 'a', content: 'AAA', comments: ['1', '2'],
      history: {a: 1, b: 'b'}}, function(err, post) {
      should.not.exist(err);

      Post.findById(post.id, function(err, p) {
        p.id.should.be.equal(post.id);

        p.content.should.be.equal(post.content);
        p.title.should.be.equal('a');
        p.comments.should.eql(['1', '2']);
        p.history.should.eql({a: 1, b: 'b'});

        done();
      });
    });
  });

  it('should allow ObjectID', function(done) {
    var uid = new ObjectID('123');
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
    var post = {id: 123, title: 'a', content: 'AAA'};
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
      var post = {id: 123, title: 'a', content: 'AAA'};
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

  it('save should update the instance without removing existing properties', function(done) {
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
    var post = new Post({id: 123, title: 'a', content: 'AAA'});
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
    var post = new Post({title: 'b', content: 'BBB'});
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
    var data = {title: 'a', content: 'AAA'};
    PostWithUniqueTitle.create(data, function(err, post) {
      should.not.exist(err);
      PostWithUniqueTitle.create(data, function(err, post) {
        should.exist(err);
        done();
      });
    });
  });

  it('buffer fields should be stored correctly', function (done) {
    var hash = '00112233445566778899aabbccddeeff';
    var buffer = 'some text';
    var data = {hash: Buffer.from(hash, 'hex'), buffer: Buffer.from(buffer)};
    Hash.create(data, function (err, h1) {
      should.not.exist(err);
      Hash.findById(h1.id, function (err, h2) {
        should.not.exist(err);
        h2.hash.toString('hex').should.be.equal(hash);
        h2.buffer.toString().should.be.equal(buffer);
        done();
      });
    });
  });

  context('regexp operator', function() {
    beforeEach(function deleteExistingTestFixtures(done) {
      Post.destroyAll(done);
    });
    beforeEach(function createTestFixtures(done) {
      Post.create([
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
        afterEach(function removeSpy()  {
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
        afterEach(function removeSpy()  {
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
    });

    context('with regex objects', function() {
      beforeEach(function addSpy() {
        sinon.stub(console, 'warn');
      });
      afterEach(function removeSpy()  {
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
      });
    });
  });

  after(function(done) {
    Post.destroyAll(function() {
      PostWithStringId.destroyAll(function() {
        PostWithUniqueTitle.destroyAll(done);
      });
    });
  });
});
