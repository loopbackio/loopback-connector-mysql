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

describe('mysql', function () {

  before(function (done) {
    db = getDataSource();

    Post = db.define('PostWithDefaultId', {
      title: { type: String, length: 255, index: true },
      content: { type: String },
      comments: [String],
      history: Object,
      stars: Number,
      userId: ObjectID
    });

    PostWithStringId = db.define('PostWithStringId', {
      id: {type: String, id: true},
      title: { type: String, length: 255, index: true },
      content: { type: String }
    });

    PostWithUniqueTitle = db.define('PostWithUniqueTitle', {
      title: { type: String, length: 255, index: {unique: true} },
      content: { type: String }
    });

    db.automigrate(['PostWithDefaultId', 'PostWithStringId', 'PostWithUniqueTitle'], function (err) {
      should.not.exist(err);
      done(err);
    });
  });

  beforeEach(function (done) {
    Post.destroyAll(function () {
      PostWithStringId.destroyAll(function () {
        PostWithUniqueTitle.destroyAll(function () {
          done();
        });
      });
    });
  });

  it('should allow array or object', function (done) {
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

  it('updateOrCreate should update the instance', function (done) {
    Post.create({title: 'a', content: 'AAA'}, function (err, post) {
      post.title = 'b';
      Post.updateOrCreate(post, function (err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);

        Post.findById(post.id, function (err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('b');

          done();
        });
      });

    });
  });

  it('updateOrCreate should update the instance without removing existing properties', function (done) {
    Post.create({title: 'a', content: 'AAA'}, function (err, post) {
      post = post.toObject();
      delete post.title;
      Post.updateOrCreate(post, function (err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);
        Post.findById(post.id, function (err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('a');

          done();
        });
      });

    });
  });

  it('updateOrCreate should create a new instance if it does not exist', function (done) {
    var post = {id: 123, title: 'a', content: 'AAA'};
    Post.updateOrCreate(post, function (err, p) {
      should.not.exist(err);
      p.title.should.be.equal(post.title);
      p.content.should.be.equal(post.content);
      p.id.should.be.equal(post.id);

      Post.findById(p.id, function (err, p) {
        p.id.should.be.equal(post.id);

        p.content.should.be.equal(post.content);
        p.title.should.be.equal(post.title);
        p.id.should.be.equal(post.id);

        done();
      });
    });

  });

  it('save should update the instance with the same id', function (done) {
    Post.create({title: 'a', content: 'AAA'}, function (err, post) {
      post.title = 'b';
      post.save(function (err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);

        Post.findById(post.id, function (err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('b');

          done();
        });
      });

    });
  });

  it('save should update the instance without removing existing properties', function (done) {
    Post.create({title: 'a', content: 'AAA'}, function (err, post) {
      delete post.title;
      post.save(function (err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);
        p.content.should.be.equal(post.content);

        Post.findById(post.id, function (err, p) {
          p.id.should.be.equal(post.id);

          p.content.should.be.equal(post.content);
          p.title.should.be.equal('a');

          done();
        });
      });

    });
  });

  it('save should create a new instance if it does not exist', function (done) {
    var post = new Post({id: 123, title: 'a', content: 'AAA'});
    post.save(post, function (err, p) {
      should.not.exist(err);
      p.title.should.be.equal(post.title);
      p.content.should.be.equal(post.content);
      p.id.should.be.equal(post.id);

      Post.findById(p.id, function (err, p) {
        should.not.exist(err);
        p.id.should.be.equal(post.id);

        p.content.should.be.equal(post.content);
        p.title.should.be.equal(post.title);
        p.id.should.be.equal(post.id);

        done();
      });
    });

  });

  it('all return should honor filter.fields', function (done) {
    var post = new Post({title: 'b', content: 'BBB'})
    post.save(function (err, post) {
      Post.all({fields: ['title'], where: {title: 'b'}}, function (err, posts) {
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
    function (done) {
      PostWithStringId.create({id: '2', title: 'c', content: 'CCC'}, function (err, post) {
        PostWithStringId.create({id: '1', title: 'd', content: 'DDD'}, function (err, post) {
          PostWithStringId.find(function (err, posts) {
            should.not.exist(err);
            posts.length.should.be.equal(2);
            posts[0].id.should.be.equal('1');

            PostWithStringId.find({limit: 1, offset: 0}, function (err, posts) {
              should.not.exist(err);
              posts.length.should.be.equal(1);
              posts[0].id.should.be.equal('1');

              PostWithStringId.find({limit: 1, offset: 1}, function (err, posts) {
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

  it('should allow to find using like', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {like: 'M%st'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support like for no match', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {like: 'M%XY'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should allow to find using nlike', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {nlike: 'M%st'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should support nlike for no match', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {title: {nlike: 'M%XY'}}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support "and" operator that is satisfied', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {and: [
        {title: 'My Post'},
        {content: 'Hello'}
      ]}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support "and" operator that is not satisfied', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {and: [
        {title: 'My Post'},
        {content: 'Hello1'}
      ]}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  it('should support "or" that is satisfied', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {or: [
        {title: 'My Post'},
        {content: 'Hello1'}
      ]}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 1);
        done();
      });
    });
  });

  it('should support "or" operator that is not satisfied', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.find({where: {or: [
        {title: 'My Post1'},
        {content: 'Hello1'}
      ]}}, function (err, posts) {
        should.not.exist(err);
        posts.should.have.property('length', 0);
        done();
      });
    });
  });

  // The where object should be parsed by the connector
  it('should support where for count', function (done) {
    Post.create({title: 'My Post', content: 'Hello'}, function (err, post) {
      Post.count({and: [
        {title: 'My Post'},
        {content: 'Hello'}
      ]}, function (err, count) {
        should.not.exist(err);
        count.should.be.equal(1);
        Post.count({and: [
          {title: 'My Post1'},
          {content: 'Hello'}
        ]}, function (err, count) {
          should.not.exist(err);
          count.should.be.equal(0);
          done();
        });
      });
    });
  });

  // The where object should be parsed by the connector
  it('should support where for destroyAll', function (done) {
    Post.create({title: 'My Post1', content: 'Hello'}, function (err, post) {
      Post.create({title: 'My Post2', content: 'Hello'}, function (err, post) {
        Post.destroyAll({and: [
          {title: 'My Post1'},
          {content: 'Hello'}
        ]}, function (err) {
          should.not.exist(err);
          Post.count(function (err, count) {
            should.not.exist(err);
            count.should.be.equal(1);
            done();
          });
        });
      });
    });
  });

  it('should not allow SQL injection for inq operator', function (done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function (err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function (err, post) {
            Post.find({where: {title: {inq: ['SELECT title from PostWithDefaultId']}}},
              function (err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for lt operator', function (done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function (err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function (err, post) {
            Post.find({where: {stars: {lt: 'SELECT title from PostWithDefaultId'}}},
              function (err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for nin operator', function (done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function (err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function (err, post) {
            Post.find({where: {title: {nin: ['SELECT title from PostWithDefaultId']}}},
              function (err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 2);
                done();
              });
          });
      });
  });


  it('should not allow SQL injection for inq operator with number column', function (done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function (err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function (err, post) {
            Post.find({where: {stars: {inq: ['SELECT title from PostWithDefaultId']}}},
              function (err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for inq operator with array value', function (done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function (err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function (err, post) {
            Post.find({where: {stars: {inq: [5, 'SELECT title from PostWithDefaultId']}}},
              function (err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 1);
                done();
              });
          });
      });
  });

  it('should not allow SQL injection for between operator', function (done) {
    Post.create({title: 'My Post1', content: 'Hello', stars: 5},
      function (err, post) {
        Post.create({title: 'My Post2', content: 'Hello', stars: 20},
          function (err, post) {
            Post.find({where: {stars: {between: [5, 'SELECT title from PostWithDefaultId']}}},
              function (err, posts) {
                should.not.exist(err);
                posts.should.have.property('length', 0);
                done();
              });
          });
      });
  });

  it('should not allow duplicate titles', function (done) {
    var data = {title: 'a', content: 'AAA'};
    PostWithUniqueTitle.create(data, function (err, post) {
      should.not.exist(err);
      PostWithUniqueTitle.create(data, function (err, post) {
        should.exist(err);
        done();
      });
    });
  });

  after(function (done) {
    Post.destroyAll(function () {
      PostWithStringId.destroyAll(function () {
        PostWithUniqueTitle.destroyAll(done);
      });
    });
  });
});
