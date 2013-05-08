#! /usr/bin/env node

var gcdHelper = require('./helper');

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
  add: function(title) {
    var mutation = new gcdHelper.MutationBuilder()
      .insertAutoId(
        // Key is a constructor for building a key
        new gcdHelper.Key('TodoList', todoListName, 'Todo'),
        // properties follow
        {title: {stringValue: title}}, // you can pass an object
        {completed: [{booleanValue: false}]} // as well as an array of objects
      ).build();

    var payload = {datasetId: datasetId,
                   mutation: mutation};

    console.log('Now sending the following payload:');
    console.log(JSON.stringify(payload, null, 2));

    datastore.blindwrite(payload).withAuthClient(compute).execute(
      function(err, result) {
        console.assert(!err, err);
        var key = result.mutationResult.insertAutoIdKeys[0];
        console.log('%d: TODO %s', key.path[1].id, title);
      });
  },
  get: function(id, callback) {
    var key = new gcdHelper.Key(
      'TodoList', todoListName,
      'Todo', Number(id)); // id needs to cast to Number

    console.log('Now getting with the following key:');
    console.log(JSON.stringify(key, null, 2));

    datastore.lookup({
      datasetId: datasetId,
      keys: [key]
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
    var mutation = new gcdHelper.MutationBuilder()
      .delete(
        new gcdHelper.Key('TodoList', todoListName, 'Todo', Number(id))
      ).build();

    console.log('Now sending the following mutation object:');
    console.log(JSON.stringify(mutation, null, 2));

    datastore.blindwrite({
      datasetId: datasetId,
      mutation: mutation
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: DEL', id);
    });
  },
  edit: function(id, title, completed) {
    completed = completed === 'true';

    var mutation = new gcdHelper.MutationBuilder()
      .update(
        new gcdHelper.Key('TodoList', todoListName, 'Todo', Number(id)),
        {title: {stringValue: title}},
        {completed: [{booleanValue: completed}]}
      ).build();

    var payload = {datasetId: datasetId,
                   mutation: mutation};

    console.log('Now sending the following payload:');
    console.log(JSON.stringify(payload, null, 2));

    datastore.blindwrite({
      datasetId: datasetId,
      mutation: mutation
    }).withAuthClient(compute).execute(function(err, result) {
      console.assert(!err, err);
      console.log('%d: %s %s', id, completed && 'DONE' || 'TODO', title);
    });
  },
  ls: function () {
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
        var id = entity.key.pathElements[1].id;
        var properties = entity.properties;
        var title = properties.title.values[0].stringValue;
        var completed = properties.completed.values[0].booleanValue == true;
        console.log('%d: %s %s', id, completed && 'DONE' || 'TODO', title);
      });

    });
  },
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
