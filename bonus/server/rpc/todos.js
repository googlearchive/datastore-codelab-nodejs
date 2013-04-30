// Server-side code

// All the todos are stored in an in-memory array on the server
// This should not be done in production apps
var googleapis = require('googleapis');
var authclient = new googleapis.OAuth2Client();
var datastore;
var compute;
var todoListName = process.argv[2] || 'default';

googleapis.discover('datastore', 'v1beta1', {
  localDiscoveryFile: './datastore_v1beta1.json',
}).execute(function(err, client) {
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
            datastore.runquery({
              datasetId: 'atlas-e2e-prod',
              query: {
                kinds: [{
                  name: 'Todo',
                }],
                filter: {
                  propertyFilter: {
                    property: {
                      name: '__key__'
                    },
                    operator: 'hasAncestor',
                    value: {
                      keyValue: {
                        pathElements: [{
                          kind: 'TodoList',
                          name: todoListName
                        }]
                      }
                    }
                  }
                }
              }   
            }).withAuthClient(compute).execute(function(err, result) {
              var tt = {};
              var entityResults = result['batch']['entityResults'] || [];
              entityResults.forEach(function(entityResult) {
                var id = entityResult.entity.key.pathElements[1].name;
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
        remove: function(todoId) {
		  ss.publish.all('removeTodo', todoId);
          datastore.blindwrite({
            datasetId: 'atlas-e2e-prod',
            mutation: {
              delete: [{
                pathElements: [{
                  kind: 'TodoList',
                  name: todoListName,
                },{
                  kind: 'Todo',
                  name: todoId
                }]
              }]
            }      
          }).withAuthClient(compute).execute(function(err, result) {
            console.log(err, result);
          });
        },
        update: function(todo) {
		  ss.publish.all('updateTodo', todo);
          datastore.blindwrite({
            datasetId: 'atlas-e2e-prod',
            mutation: {
              upsert: [{
                key: {
                  pathElements: [,{
                    kind: 'TodoList',
                    name: todoListName,
                  },{
                    kind: 'Todo',
                    name: todo.id
                  }]
                },
                properties: {
                  title: {
                    values: [{
                      stringValue: todo.title
                    }]
                  },
                  completed: {
                    values: [{
                      booleanValue: todo.completed
                    }]
                  }
                }
              }]
            }
          }).withAuthClient(compute).execute(function(err, result) {
            console.log(err, result);
          });
        },
        archive: function() {
            datastore.runquery({
              datasetId: 'atlas-e2e-prod',
              query: {
                kinds: [{
                  name: 'Todo',
                }],
                filter: {
                  compositeFilter: {
                    operator: 'and',
                    filters: [{
                        propertyFilter: {
                        property: {
                          name: '__key__'
                        },
                        operator: 'hasAncestor',
                        value: {
                          keyValue: {
                            pathElements: [{
                              kind: 'TodoList',
                              name: todoListName
                            }]
                          }
                        }
                        }
                    },{
                      propertyFilter: {
                        property: {
                          name: 'completed'
                        },
                        operator: 'equal',
                        value: {
                          booleanValue: true
                        }
                      }
                    }]
                  }
                }
              }   
            }).withAuthClient(compute).execute(function(err, result) {
              var keys = [];
              var entityResults = result['batch']['entityResults'] || [];
              entityResults.forEach(function(entityResult) {
                keys.push(entityResult.entity.key);
                var id = entityResult.entity.key.pathElements[1].name;
                ss.publish.all('removeTodo', id);
              });
              datastore.blindwrite({
                datasetId: 'atlas-e2e-prod',
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
