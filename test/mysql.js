var jdb = require('jugglingdb'),
    Schema = jdb.Schema,
    test = jdb.test,
    schema = new Schema(__dirname + '/..', {
        database: 'myapp_test',
        username: 'root'
    });

test(module.exports, schema);

var Post, User;

test.it('hasMany should support additional conditions', function (test) {

    Post = schema.models.Post;
    User = schema.models.User;

    User.create(function (e, u) {
        u.posts.create({}, function (e, p) {
            u.posts({where: {id: p.id}}, function (e, posts) {
                test.equal(posts.length, 1, 'There should be only 1 post.');
                test.done();
            });
        });
    });

});

