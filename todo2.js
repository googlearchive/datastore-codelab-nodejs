#! /usr/bin/env node

var googleapis = require('googleapis'),
    authclient = new googleapis.OAuth2Client(),
    datasetId = 'gcd-codelab',
    compute = new googleapis.auth.Compute(),
    datastore = null,
    todoListName = null;

var usage = 'usage todo.js <todolist> <add|get|del|edit|ls> [todo-title|todo-id]';
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

var __TODO__ = null;

var commands = {
  add: function(todoText) {
    datastore.blindwrite({
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
      console.log('%d: TODO %s', key.path[1].id, todoText);
    });    
  },
  get: function(todoId, callback) {
    datastore.lookup({
      datasetId: datasetId,
      keys: [{
        path: [{
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
  del: function(todoId) {
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        delete: [{
          path: [{
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
  edit: function(id, text, done) {
    done = done === 'true';
    datastore.blindwrite({
      datasetId: datasetId,
      mutation: {
        __TODO__: [{ // fill mutation name
          key: {
            path: [,{
              kind: 'TodoList',
              name: todoListName,
            },{
              kind: __TODO__, // fill entity key kind
              id: __TODO__ // fill entity key id
            }]
          },
          properties: {
            __TODO__ : { // fill property name
              values: [{
                stringValue: __TODO__ // fill property value
              }]
            },
            __TODO__: { // fill property name
              values: [{
                booleanValue: __TODO__ // fill property value
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
          name: __TODO__, // fill entity kind
        }],
        filter: {
          propertyFilter: {
            property: {
              name: '__key__'
            },
            operator: 'hasAncestor',
            value: {
              keyValue: {
                path: [{
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
        var id = entity.key.path[1].id;
        var properties = entity.properties;
        var title = properties.__TODO__.values[0].stringValue; // fill property name
        var done = properties.__TODO__.values[0].booleanValue == true; // fill property name
        console.log('%d: %s %s', id, done && 'DONE' || 'TODO', title);
      });

    });
  }
};
