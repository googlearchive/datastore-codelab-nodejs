#! /usr/bin/env node

var __FIXME__ = null;

var gcdHelper = __FIXME__; // import your external helper library

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
    // You need to send a blindwrite request with an insertAutoId.
    __FIXME__;

  },
  get: function(id, callback) {
    // You need to send a lookup request with a key generated with id.
    __FIXME__;

  },
  del: function(id) {
    // You need to construct the 'delete' mutation object with the
    // given todoId and send a blindwrite request.
    __FIXME__;

  },
  edit: function(id, title, completed) {
    completed = completed === 'true';

    // You need to construct the 'update' mutation object with the
    // given todoId and send a blindwrite request.
    __FIXME__;

  },
  ls: function () {
    // Send a query request with an ancestor filter.
    __FIXME__;

  },
  archive: function() {
    // Transactionally delete all completed todo entries.
    __FIXME__;

  }
};
