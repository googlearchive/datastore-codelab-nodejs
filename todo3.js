#! /usr/bin/env node

var googleapis = require('googleapis'),
    authclient = new googleapis.OAuth2Client(),
    datasetId = 'gcd-codelab',
    compute = new googleapis.auth.Compute(),
    datastore = null,
    todoListName = null;

var usage = 'usage todo.js <todolist> <add|get|del|edit|ls|archive> [todo-title|todo-id]';
compute.authorize(function(err, result) {
  console.assert(!err, err);
  googleapis.discover('datastore', 'v1beta1')
    .withAuthClient(compute)
    .execute(function(err, client) {
      datastore = client.datastore.datasets;
      todoListName = process.argv[2];
      var cmd = process.argv[3];
      console.assert(todoListName && cmd && commands[cmd], usage);
      commands[cmd].apply(commands, process.argv.slice(4))
    });
});

var commands = {
  add: function(title) {
    datastore.blindWrite({
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
    }).execute(function(err, result) {
      console.assert(!err, err);
      var key = result.mutationResult.insertAutoIdKeys[0];
      console.log('ID %d: %s - TODO', key.path[1].id, title);
    });
  },
  get: function(id, callback) {
    datastore.lookup({
      datasetId: datasetId,
      keys: [{
        path: [{ kind: 'TodoList', name: todoListName},
               { kind: 'Todo', id: id }]
      }]
    }).execute(function(err, result) {
      console.assert(!err, err);
      console.assert(!result.missing, 'todo %d: not found', id);
      var entity = result.found[0].entity;
      var title = entity.properties.title.values[0].stringValue;
      var completed = entity.properties.completed.values[0].booleanValue == true;
      if (callback) {
        callback(err, id, title, completed);
      } else {
        console.log('ID %d: %s - %s', id, title, completed && 'DONE' || 'TODO');
      }
    });
  },
  del: function(id) {
    datastore.blindWrite({
      datasetId: datasetId,
      mutation: {
        delete: [{
          path: [{ kind: 'TodoList', name: todoListName },
                 { kind: 'Todo', id: id }]
        }]
      }
    }).execute(function(err, result) {
      console.assert(!err, err);
      console.log('ID %d: DEL', id);
    });
  },
  edit: function(id, title, completed) {
    completed = completed === 'true';
    datastore.blindWrite({
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
    }).execute(function(err, result) {
      console.assert(!err, err);
      console.log('ID %d: %s - %s', id, title, completed && 'DONE' || 'TODO');
    });
  },
  ls: function() {
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
    }).execute(function(err, result) {
      var entityResults = result.batch.entityResults || [];
      entityResults.forEach(function(entityResult) {
        var entity = entityResult.entity;
        var id = entity.key.path[1].id;
        var properties = entity.properties;
        var title = properties.title.values[0].stringValue;
        var completed = properties.completed.values[0].booleanValue == true;
        console.log('ID %d: %s - %s', id, title, completed && 'DONE' || 'TODO');
      });

    });
  },
  archive: function() {
    datastore.__FIXME__({ // fill the rpc name to start a transaction
      datasetId: datasetId
    }).execute(function(err, result) {
      // Store transaction id in the current scope
      var tx = __FIXME__;
      datastore.runQuery({
        datasetId: datasetId,
        // fill with transaction handle
        readOptions: { transaction: __FIXME__ },
        query: {
          kinds: [{ name: 'Todo' }],
          filter: {
            compositeFilter: {
              operator: 'and',
              filters: [{
                // fill the ancestor filter
                propertyFilter: __FIXME__
              },{
                // fill the property filter
                propertyFilter: __FIXME__
              }]
            }
          }
        }
      }).execute(function(err, result) {
        var keys = [];
        var entityResults = result.batch.entityResults || [];

        // Retrieve the keys from the result and put them in `keys` variable
        entityResults.forEach(function(entityResult) {
          keys.push(__FIXME__);
        });

        datastore.commit({
          datasetId: datasetId,
          transaction: __FIXME__, // set the transaction handle
          mutation: {
            __FIXME__: keys // set the mutation type
          }
        }).execute(function(err, result) {
          console.assert(!err, err);
          keys.forEach(function(key) {
            // print the deleted todo's id
            // [HINT] keys have the following format:
            // key: {
            //   path: [{ kind: 'TodoList', name: todoListName },
            //          { kind: 'Todo', id: id } ]
            //  },
            console.log(__FIXME__);
          });
        });
      });
    });
  }
};
