#! /usr/bin/env node

var googleapis = require('googleapis'),
    authclient = new googleapis.OAuth2Client(),
    datasetId = 'gcd-codelab',
    compute = new googleapis.auth.Compute(),
    datastore = null,
    todoListName = null;

var usage = 'usage todo.js <todolist> <add|get|del|ls|do|undo|archive> [todo-title|todo-id]';
googleapis.discover('datastore', 'v1beta1', {
  localDiscoveryFilePath: './datastore_v1beta1.json',
}).execute(function(err, client) {
  compute.authorize(function(err, result) {
    datastore = client.datastore.datasets;
    todoListName = process.argv[2];
    var cmd = process.argv[3];
    console.assert(todoListName && cmd && commands[cmd], usage);
    commands[cmd].apply(commands, process.argv.slice(4))
  });
});

var commands = {
  // level 0
  add: function(todoText) {
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        insertAutoId: [{
          key: {
            pathElements: [{
              kind: 'TodoList',
              name: todoListName,
            },{
              kind: 'Todo',
            }]
          },
          properties: {
            title: {
              values: [{
                stringValue: todoText
              }]
            },
            completed: {
              values: [{
                booleanValue: false
              }]
            }
          }
        }]
      }
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      var key = result.mutationResult.insertAutoIdKeys[0];
      console.log('%d: TODO %s', key.pathElements[1].id, todoText);
    });    
  },
  get: function(todoId, callback) {
    datastore.lookup({
      datasetId: datasetId,
      keys: [{
        pathElements: [{
          kind: 'TodoList',
          name: todoListName
        },{
          kind: 'Todo',
          id: todoId
        }]
      }]
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.assert(!result.missing, 'todo %d: not found', todoId);
      var entity = result.found[0].entity;
      var text = entity.properties.title.values[0].stringValue;
      var done = entity.properties.completed.values[0].booleanValue == true;
      if (callback) {
        callback(err, todoId, text, done);
      } else {
        console.log('%d: %s %s', todoId, done && 'DONE' || 'TODO', text);
      }
    });
  },
  // level 1
  del: function(todoId) {
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        delete: [{
          pathElements: [{
            kind: 'TodoList',
            name: todoListName,
          },{
            kind: 'Todo',
            id: todoId
          }]
        }]
      }      
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: DEL', todoId);
    });
  },
  // level 2
  edit: function(id, text, done) {
    done = done === 'true';
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        update: [{
          key: {
            pathElements: [,{
              kind: 'TodoList',
              name: todoListName,
            },{
              kind: 'Todo',
              id: id
            }]
          },
          properties: {
            title: {
              values: [{
                stringValue: text
              }]
            },
            completed: {
              values: [{
                booleanValue: done
              }]
            }
          }
        }]
      }
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: %s %s', id, done && 'DONE' || 'TODO', text);
    });
  },
  ls: function () {
    datastore.runquery({
      datasetId: datasetId,
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
      var entityResults = result.batch.entityResults || [];
      entityResults.forEach(function(entityResult) {
        var entity = entityResult.entity;
        var id = entity.key.pathElements[1].id;
        var properties = entity.properties;
        var title = properties.title.values[0].stringValue;
        var done = properties.completed.values[0].booleanValue == true;
        console.log('%d: %s %s', id, done && 'DONE' || 'TODO', title);
      });

    });
  },
  // level 3
  archive: function() {
    datastore.runquery({
      datasetId: datasetId,
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
      var entityResults = result.batch.entityResults || [];
      entityResults.forEach(function(entityResult) {
        keys.push(entityResult.entity.key);
      });
      datastore.blindwrite({
        datasetId: datasetId,
        mutation: {
          delete: keys
        }      
      }).withAuthClient(compute).execute(function(err, result) {
        console.assert(!err, err);
        keys.forEach(function(key) {
          console.log('%d: DEL', key.pathElements[1].id);
        });
      });
    });
  }
};
