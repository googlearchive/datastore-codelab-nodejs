// Server-side code

var googleapis = require('googleapis');
var authclient = new googleapis.OAuth2Client();
var datastore;
var compute = new googleapis.auth.Compute();
var todoListName = process.argv[2] || 'default';
var datasetId = 'gcd-codelab';

compute.authorize(function(err, result) {
  console.assert(!err, err);
  googleapis.discover('datastore', 'v1beta1')
    .withAuthClient(compute)
    .execute(function(err, client) {
      console.assert(!err, err);
      datastore = client.datastore.datasets;
    });
});

// Define actions which can be called from the client using
// ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {
  return {
    getAll: function () {
      var todos = {};
      datastore.__FIXME__(); // copy commands.ls implementatation
      res(tt);
    },
    remove: function(id) {
      ss.publish.all('removeTodo', id);
      datastore.__FIXME__(); // copy commands.del implementatation
    },
    create: function(todo) {
      datastore.blindWrite(
        __FIXME__; // copy commands.add implementatation and tweak a little
      ).execute(function(err, result) {
        console.log(err, result);
        var id = result.mutationResult.insertAutoIdKeys[0].path[1].id;
        todo.id = id;
        // need to publish here
        ss.publish.all('updateTodo', todo);
      });
    },
    update: function(todo) {
      ss.publish.all('updateTodo', todo);
      datastore.__FIXME__(); // copy commands.edit implementatation
    },
    archive: function() {
      datastore.__FIXME__().execute(function(err, result) { // copy commands.archive implementation
        __FIXME__forEach(function() { // for each deleted todos
                ss.publish.all('removeTodo', id);
        });
      });
    }
  };
};
