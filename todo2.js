#! /usr/bin/env node

var googleapis = require('googleapis'),
    authclient = new googleapis.OAuth2Client(),
    datasetId = 'gcd-codelab',
    compute = new googleapis.auth.Compute(),
    datastore = null,
    todoListName = null;

var usage = 'usage todo.js <todolist> <add|get|del|edit|ls> [todo-title|todo-id]';
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
            path: [{
              kind: 'TodoList',
              name: todoListName,
            },{
              kind: 'Todo',
            }]
          },
          properties: {
            title: {
              values: [{
                stringValue: title
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
        path: [{
          kind: 'TodoList',
          name: todoListName
        },{
          kind: 'Todo',
          id: id
        }]
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
        // fill mutation name
        __FIXME__: [{
          key: {
            path: [{ kind: 'TodoList', name: todoListName },
                    // fill entity key
                   { kind: __FIXME__, id: __FIXME__ }]
          },
          properties: {
             // fill property name and value
            __FIXME__: { values: [{ stringValue: __FIXME__ }] },
             // fill property name and value
            __FIXME__: { values: [{ booleanValue: __FIXME__ }] },
          }
        }]
      }
    }).execute(function(err, result) {
      console.assert(!err, err);
      console.log('ID %d: %s - %s', id, title, completed && 'DONE' || 'TODO');
    });
  },
  ls: function () {
    datastore.runQuery({
      datasetId: datasetId,
      query: {
        kinds: [{ name: __FIXME__ }], // fill entity kind
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
        var title = properties.__FIXME__.values[0].stringValue; // fill property name
        var completed = properties.__FIXME__.values[0].booleanValue == true; // fill property name
        console.log('ID %d: %s - %s', id, title, completed && 'DONE' || 'TODO');
      });
    });
  }
};
