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

// Define actions which can be called from the client using
// ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {
  return {
    getAll: function () {
      datastore.runQuery({
        datasetId: datasetId,
        query: {
          kinds: [{ name: 'Todo' }],
          filter: {
            propertyFilter: {
              property: { name: '__key__' },
              operator: 'hasAncestor',
              value: {
                keyValue: {
                  path: [{ kind: 'TodoList', name: todoListName }]
                }
              }
            }
          }
        }   
      }).withAuthClient(compute).execute(function(err, result) {
        var tt = {};
        var entityResults = result.batch.entityResults || [];
        entityResults.forEach(function(entityResult) {
          var id = entityResult.entity.key.path[1].id;
          var title = entityResult.entity.properties.title.values[0].stringValue;
          var completed = entityResult.entity.properties.completed.values[0].booleanValue;
          tt[id] = {
            id: id,
            title: title,
            completed: completed
          };
        });
        res(tt);
      });
    },
    remove: function(id) {
      console.log('Remove called with: ' + id);
      ss.publish.all('removeTodo', id);
      datastore.blindWrite({
        datasetId: datasetId,
        mutation: {
          delete: [{
            path: [{ kind: 'TodoList', name: todoListName },
                   { kind: 'Todo', id: id }]
          }]
        }      
      }).withAuthClient(compute).execute(function(err, result) {
        console.log(err, result);
      });
    },
    create: function(todo) {
      datastore.blindWrite({
        datasetId: datasetId,
        mutation: {
          insertAutoId: [{
            key: {
              path: [{ kind: 'TodoList', name: todoListName },
                     { kind: 'Todo'}]
            },
            properties: {
              title: { values: [{ stringValue: todo.title }] },
              completed: { values: [{ booleanValue: todo.completed }] }
            }
          }]
        }
      }).withAuthClient(compute).execute(function(err, result) {
        console.log(err, result);
        var id = result.mutationResult.insertAutoIdKeys[0].path[1].id;
        todo.id = id;
        ss.publish.all('updateTodo', todo);
      });
    },
    update: function(todo) {
      ss.publish.all('updateTodo', todo);
      datastore.blindWrite({
        datasetId: datasetId,
        mutation: {
          upsert: [{
            key: {
              path: [{ kind: 'TodoList', name: todoListName },
                     { kind: 'Todo', id: todo.id }]
            },
            properties: {
              title: { values: [{ stringValue: todo.title }] },
              completed: { values: [{ booleanValue: todo.completed }] }
            }
          }]
        }
      }).withAuthClient(compute).execute(function(err, result) {
        console.log(err, result);
      });
    },
    archive: function() {
      datastore.runQuery({
        datasetId: datasetId,
        query: {
          kinds: [{ name: 'Todo' }],
          filter: {
            compositeFilter: {
              operator: 'and',
              filters: [{
                propertyFilter: {
                  property: { name: '__key__' },
                  operator: 'hasAncestor',
                  value: {
                    keyValue: {
                      path: [{ kind: 'TodoList', name: todoListName }]
                    }
                  }
                }
              },{
                propertyFilter: {
                  property: { name: 'completed' },
                  operator: 'equal',
                  value: { booleanValue: true }
                }
              }]
            }
          }
        }   
      }).withAuthClient(compute).execute(function(err, result) {
        var keys = [];
        var entityResults = result.batch.entityResults || [];
        entityResults.forEach(function(entityResult) {
          keys.push(entityResult.entity.key);
          var id = entityResult.entity.key.path[1].id;
          ss.publish.all('removeTodo', id);
        });
        datastore.blindWrite({
          datasetId: datasetId,
          mutation: {
            delete: keys
          }      
        }).withAuthClient(compute).execute(function(err, result) {
          console.log(err, result);
        });
      });
    }
  };
};
