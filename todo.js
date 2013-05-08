#! /usr/bin/env node

var googleapis = require('googleapis'),
    authclient = new googleapis.OAuth2Client(),
    datasetId = 'gcd-codelab',
    compute = new googleapis.auth.Compute(),
    datastore = null,
    todoListName = null;

var usage = 'usage todo.js <todolist> <add|get|del|edit|ls|archive> [todo-title|todo-id]';
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
  add: function(title) {
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        insertAutoId: [{
          key: {
            path: [{ kind: 'TodoList', name: todoListName },
                   { kind: 'Todo' }]
          },
          properties: {
            title: { values: [{ stringValue: title }] },
            completed: { values: [{ booleanValue: false }] }
          }
        }]
      }
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      var key = result.mutationResult.insertAutoIdKeys[0];
      console.log('%d: TODO %s', key.path[1].id, title);
    });    
  },
  get: function(id, callback) {
    datastore.lookup({
      datasetId: datasetId,
      keys: [{
        path: [{ kind: 'TodoList', name: todoListName},
               { kind: 'Todo', id: id }]
      }]
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.assert(!result.missing, 'todo %d: not found', id);
      var entity = result.found[0].entity;
      var title = entity.properties.title.values[0].stringValue;
      var completed = entity.properties.completed.values[0].booleanValue == true;
      if (callback) {
        callback(err, id, title, completed);
      } else {
        console.log('%d: %s %s', id, completed && 'DONE' || 'TODO', title);
      }
    });
  },
  // level 1
  del: function(id) {
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        delete: [{
          path: [{ kind: 'TodoList', name: todoListName },
                 { kind: 'Todo', id: id }]
        }]
      }   
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: DEL', id);
    });
  },
  // level 2
  edit: function(id, title, completed) {
    completed = completed === 'true';
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        update: [{
          key: {
            path: [{ kind: 'TodoList', name: todoListName },
                   { kind: 'Todo', id: id } ]
          },
          properties: {
            title: { values: [{ stringValue: title }] },
            completed: { values: [{ booleanValue: completed }] }
          }
        }]
      }
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: %s %s', id, completed && 'DONE' || 'TODO', title);
    });
  },
  ls: function() {
    datastore.runquery({
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
      var entityResults = result.batch.entityResults || [];
      entityResults.forEach(function(entityResult) {
        var entity = entityResult.entity;
        var id = entity.key.path[1].id;
        var properties = entity.properties;
        var title = properties.title.values[0].stringValue;
        var completed = properties.completed.values[0].booleanValue == true;
        console.log('%d: %s %s', id, completed && 'DONE' || 'TODO', title);
      });

    });
  },
  // level 3
  archive: function() {
    datastore.begintransaction({
      datasetId: datasetId
    }).withAuthClient(compute).execute(function(err, result) {
      var tx = result.transaction;
      datastore.runquery({
        datasetId: datasetId,
        readOptions: { transaction: tx },
        query: {
          kinds: [{ name: 'Todo' }],
          filter: {
            compositeFilter: {
              operator: 'and',
              filters: [{
                propertyFilter: {
                  property: { name: '__key__' },
                  operator: 'hasAncestor',
                  value: { keyValue: {
                    path: [{ kind: 'TodoList', name: todoListName }]
                  }}
                }
              }, {
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
        });
        datastore.commit({
          datasetId: datasetId,
          transaction: tx,
          mutation: { delete: keys }
        }).withAuthClient(compute).execute(function(err, result) {
          console.assert(!err, err);
          keys.forEach(function(key) {
            console.log('%d: DEL', key.path[1].id);
          });
        });
      });
    });
  }
};
