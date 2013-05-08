
function Key() {
  'use strict';
  if (! (this instanceof Key)) {
    throw new TypeError('Key must be called with "new" statement.');
  }
  this.path = [];
  for (var i = 0; i < arguments.length; i += 2) {
    // level4
    var kind = arguments[i];
    var name_or_id = arguments[i+1];
    var pathElement = {kind: kind};
    if (typeof name_or_id == 'string') {
      pathElement.name = name_or_id;
    } else if (typeof name_or_id == 'number') {
      pathElement.id = name_or_id;
    }
    this.path.push(pathElement);
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

exports.Key = Key;
exports.MutationBuilder = MutationBuilder;
