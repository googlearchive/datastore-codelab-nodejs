// Server-side code

var googleapis = require('googleapis');
var authclient = new googleapis.OAuth2Client();
var datastore;
var compute;
var todoListName = process.argv[2] || 'default';
var datasetId = 'gcd-codelab';

googleapis.discover('datastore', 'v1beta1').execute(function(err, client) {
  console.log(err, client);
  compute = new googleapis.auth.Compute()
  compute.authorize(function(err, result) {
    console.log(err, result);
    datastore = client.datastore.datasets;
  });
});

var __FIXME__ = null;
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
