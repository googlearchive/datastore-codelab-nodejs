#! /usr/bin/env node

var googleapis = require('googleapis'),
    authclient = new googleapis.OAuth2Client(),
    datasetId = 'gcd-codelab',
    compute = new googleapis.auth.Compute(),
    datastore = null,
    todoListName = null;

var usage = 'usage todo.js <todolist> <add|get|del> [todo-title|todo-id]';
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

var __FIXME__ = null;

var commands = {
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
  del: function(id) {
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        __FIXME__: [{ // fill mutation name.
          path: [{ kind: 'TodoList',  name: todoListName },
                 { kind: 'Todo', id: __FIXME__  }] // fill entity key id.
        }]
      }
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: DEL', id);
    });
  }
};
