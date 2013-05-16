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

// Don't edit me. This is a local variable definition solely for
// preventing syntax errors.
var __FIXME__ = null;

var commands = {
  add: function(title) {
    // This is how to use the `Key` helper. Fill the FIXME part of
    // the `Key` constructor at the bottom of this file.
    datastore.blindWrite({
      datasetId: datasetId,
      mutation: {
        insertAutoId: [{
	  key: new Key('TodoList', todoListName, 'Todo'),
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
    // Create the key from the given id with the `Key` helper.
    var key = __FIXME__;

    datastore.lookup({
      datasetId: datasetId,
      keys: [key]
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
  ls: function () {
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
    datastore.beginTransaction({
      datasetId: datasetId
    }).execute(function(err, result) {
      var tx = result.transaction;
      datastore.runQuery({
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
      }).execute(function(err, result) {
        var keys = [];
        var entityResults = result.batch.entityResults || [];
        entityResults.forEach(function(entityResult) {
          keys.push(entityResult.entity.key);
        });
        datastore.commit({
          datasetId: datasetId,
          transaction: tx,
          mutation: { delete: keys }
        }).execute(function(err, result) {
          console.assert(!err, err);
          keys.forEach(function(key) {
            console.log('ID %d: ARCHIVED', key.path[1].id);
          });
        });
      });
    });
  }
};

function Key() {
  'use strict';
  if (! (this instanceof Key)) {
    throw new TypeError('Key must be called with "new" statement.');
  }
  this.path = [];
  for (var i = 0; i < arguments.length; i += 2) {
    // Fill the implementation in the for loop. `arguments` above is
    // an array like objct which contains all of the arguments. Note
    // that we're looping with `i += 2` increments.

    __FIXME__;

  }
};

function MutationBuilder() {
  'use strict';
  if (! (this instanceof MutationBuilder)) {
    throw new TypeError(
      'MutationBuilder  must be called with "new" statement.');
  }
  this.operations = {};
};

MutationBuilder.prototype.build = function() {
  'use strict';
  var mutation = {};
  var isEmpty = true;
  for (var operationKey in this.operations) {
    isEmpty = false;
    mutation[operationKey] = this.operations[operationKey];
  }
  if (isEmpty) {
    throw new Error('No operation specified.');
  }
  return mutation;
};

MutationBuilder.prototype._addKey = function(operation) {
  if (this.operations[operation] == undefined) {
    this.operations[operation] = [];
  }
  for (var i = 1; i < arguments.length; i++) {
    this.operations[operation].push(arguments[i]);
  }
  return this;
}

MutationBuilder.prototype._addEntry = function(operation) {
  'use strict';
  var properties = {};
  for (var i = 2; i <= arguments.length; i++) {
    for (var propKey in arguments[i]) {
      if (arguments[i][propKey] instanceof Array) {
        properties[propKey] = {values: arguments[i][propKey], multi: true};
      } else {
        properties[propKey] = {values: [arguments[i][propKey]]};
      }
    }
  }
  if (this.operations[operation] == undefined) {
    this.operations[operation] = [];
  }
  this.operations[operation].push({
    key: arguments[1],
    properties: properties
  });
  return this;
};

MutationBuilder.prototype.upsert = function() {
  var newArguments = [].slice.call(arguments);
  newArguments.unshift('upsert');
  return this._addEntry.apply(this, newArguments);
};

MutationBuilder.prototype.update = function() {
  var newArguments = [].slice.call(arguments);
  newArguments.unshift('update');
  return this._addEntry.apply(this, newArguments);
};

MutationBuilder.prototype.insert = function() {
  var newArguments = [].slice.call(arguments);
  newArguments.unshift('insert');
  return this._addEntry.apply(this, newArguments);
};

MutationBuilder.prototype.insertAutoId = function() {
  var newArguments = [].slice.call(arguments);
  newArguments.unshift('insertAutoId');
  return this._addEntry.apply(this, newArguments);
};

MutationBuilder.prototype.delete = function() {
  var newArguments = [].slice.call(arguments);
  newArguments.unshift('delete');
  return this._addKey.apply(this, newArguments);
};
