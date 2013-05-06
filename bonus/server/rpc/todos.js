// Server-side code

var googleapis = require('googleapis');
var authclient = new googleapis.OAuth2Client();
var datastore;
var compute;
var todoListName = process.argv[2] || 'default';
var datasetId = 'gcd-codelab';

googleapis.discover('datastore', 'v1beta1', {
  localDiscoveryFilePath: '../datastore_v1beta1.json',
}).execute(function(err, client) {
  console.log(err, client);
  compute = new googleapis.auth.Compute()
  compute.authorize(function(err, result) {
    console.log(err, result);
    datastore = client.datastore.datasets;
  });
});

var __TODO__ = null;
// Define actions which can be called from the client using
// ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {
  return {
    getAll: function () {
      var todos = {};
      datastore.__TODO__(); // copy commands.ls implementatation
      res(tt);
    },
    remove: function(todoId) {
      ss.publish.all('removeTodo', todoId);
      datastore.__TODO__(); // copy commands.del implementatation
    },
    update: function(todo) {
      ss.publish.all('updateTodo', todo);
      datastore.__TODO__(); // copy commands.edit implementatation
    },
    archive: function() {
      datastore.__TODO__().execute(function(err, result) { // copy commands.archive implementation
        __TODO__forEach(function() { // for each deleted todos
                ss.publish.all('removeTodo', id);
        });
      });
    }
  };
};
