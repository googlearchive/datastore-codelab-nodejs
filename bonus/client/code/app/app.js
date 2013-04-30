/*global $, ss*/
(function () {
  'use strict';

  var Utils = {
    // https://gist.github.com/1308368
    uuid: function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b},
    pluralize: function (count, word) {
      return count === 1 ? word : word + 's';
    }
  };

  var App = {
    init: function () {
      var self = this;
      this.ENTER_KEY = 13;

      ss.rpc('todo4.getAll', function (todos) {
	self.todos = todos;
	self.cacheElements();
	self.bindEvents();
	self.render();
      });
    },

    cacheElements: function () {
      this.$todoApp = $('#todoapp');
      this.$newTodo = $('#new-todo');
      this.$toggleAll = $('#toggle-all');
      this.$main = $('#main');
      this.$todoList = $('#todo-list');
      this.$footer = this.$todoApp.find('#footer');
      this.$count = $('#todo-count');
      this.$clearBtn = $('#clear-completed');
    },

    bindEvents: function () {
      var list = this.$todoList;

      this.$newTodo.on('keyup', this.create);
      this.$toggleAll.on('change', this.toggleAll);
      this.$footer.on('click', '#clear-completed', this.destroyCompleted);

      list.on('change', '.toggle', this.toggle);
      list.on('dblclick', 'label', this.edit);
      list.on('keypress', '.edit', this.blurOnEnter);
      list.on('blur', '.edit', this.update);
      list.on('click', '.destroy', this.destroy);

      ss.event.on('updateTodos', this.updateTodos);
      ss.event.on('updateTodo', this.updateTodo);
      ss.event.on('removeTodo', this.removeTodo);
    },

    updateTodos: function (todos) {
      App.todos = todos;

      App.render(true);
    },

    updateTodo: function(todo) {
      App.todos[todo.id] = todo;
      App.render(true);
    },

    removeTodo: function(todoId) {
      delete App.todos[todoId];
      App.render(true);
    },

    render: function (preventRpc) {
      var html = $.map(this.todos, function (el) {
	return ss.tmpl.todo.render(el);
      }).join('');

      this.$todoList.html(html);
      this.$main.toggle(!!Object.keys(this.todos).length);
      this.$toggleAll.prop('checked', !this.activeTodoCount());

      this.renderFooter();
    },

    renderFooter: function () {
      var todoCount = Object.keys(this.todos).length;

      var activeTodoCount = this.activeTodoCount();

      var footer = {
	activeTodoCount: activeTodoCount,
	activeTodoWord: Utils.pluralize(activeTodoCount, 'item'),
	completedTodos: todoCount - activeTodoCount
      };

      this.$footer.toggle(!!todoCount);

      this.$footer.html( ss.tmpl.footer.render(footer) );
    },

    toggleAll: function () {
      var isChecked = $(this).prop('checked');

      $.each(App.todos, function (i, val) {
	val.completed = isChecked;
        ss.rpc('todo4.update', val);
      });

      App.render();
    },

    activeTodoCount: function () {
      var count = 0;

      $.each(this.todos, function (i, val) {
	if (!val.completed) {
	  count++;
	}
      });

      return count;
    },

    destroyCompleted: function () {
      var todos = App.todos;
      var l = todos.length;
      while (l--) {
	if (todos[l].completed) {
	  todos.splice(l, 1);
	}
      }
      ss.rpc('todo4.archive');
      App.render();
    },

    // Accepts an element from inside the ".item" div and
    // returns the corresponding todo in the todos array
    getTodo: function (elem, callback) {
      var id = $(elem).closest('li').data('id');
      callback.call(App, id, this.todos[id]);
    },

    create: function (e) {
      var $input = $(this);
      var val = $.trim($input.val());

      if (e.which !== App.ENTER_KEY || !val) {
	return;
      }

      var id = Utils.uuid();
      var todo = {
	id: id,
	title: val,
	completed: false
      };
      App.todos[id] = todo;
      ss.rpc('todo4.update', todo);

      $input.val('');

      App.render();
    },

    toggle: function () {
      App.getTodo(this, function (i, val) {
	val.completed = !val.completed;
        ss.rpc('todo4.update', val);
      });

      App.render();
    },

    edit: function () {
      $(this).closest('li').addClass('editing').find('.edit').focus();
    },

    blurOnEnter: function (e) {
      if (e.keyCode === App.ENTER_KEY) {
	e.target.blur();
      }
    },

    update: function () {
      var val = $.trim($(this).removeClass('editing').val());
      App.getTodo(this, function (id, todo) {
	if (val) {
	  todo.title = val;
          ss.rpc('todo4.update', todo);
	} else {
          ss.rpc('todo4.remove', id);
	  delete this.todos[id];
	}
	this.render();
      });
    },
    
    destroy: function () {
      App.getTodo(this, function (id, todo) {
        ss.rpc('todo4.remove', id);
        delete this.todos[id];
	this.render();
      });
    }
  };

  App.init();
})();
