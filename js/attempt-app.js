/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	
    function uuid () {
        /*jshint bitwise:false */
        var i, random;
        var uuid = '';

        for (i = 0; i < 32; i++) {
            random = Math.random() * 16 | 0;
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += '-';
            }
            uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
        }

        return uuid;
    }
    
    function pluralize (count, word) { //pluralizes!
		return count === 1 ? word : word + 's'; //uses ternary operator like if statement
    }
    
    function store (namespace, data) {
        if (arguments.length > 1) {
            return localStorage.setItem(namespace, JSON.stringify(data));
        } else {
            var store = localStorage.getItem(namespace);
            return (store && JSON.parse(store)) || [];
        }
    }


    todos = store('todos-jquery');
    function init () {
        // todos = store('todos-jquery');
        todoTemplate = Handlebars.compile($('#todo-template').html());
        footerTemplate = Handlebars.compile($('#footer-template').html());
        bindEvents();

        new Router({
            '/:filter': function (filter) {
                filter = filter;
                render();
            }
        }).init('/all');
    }
    function bindEvents () {
        $('#new-todo').on('keyup', create());
        $('#toggle-all').on('change', toggleAll());
        $('#footer').on('click', '#clear-completed', destroyCompleted());
        $('#todo-list')
            .on('change', '.toggle', toggle())
            .on('dblclick', 'label', edit())
            .on('keyup', '.edit', editKeyup())
            .on('focusout', '.edit', update())
            .on('click', '.destroy', destroy());
    }
    function render (todos) {
        var todos = getFilteredTodos();
        $('#todo-list').html(todoTemplate(todos));
        $('#main').toggle(todos.length > 0);
        $('#toggle-all').prop('checked', getActiveTodos().length === 0);
        renderFooter();
        $('#new-todo').focus();
        store('todos-jquery', todos);
    }
    function renderFooter (todos) {
        var todoCount = todos.length;
        var activeTodoCount = getActiveTodos().length;
        var template = footerTemplate({
            activeTodoCount: activeTodoCount,
            activeTodoWord: pluralize(activeTodoCount, 'item'),
            completedTodos: todoCount - activeTodoCount,
            filter: filter
        });

        $('#footer').toggle(todoCount > 0).html(template);
    }
    function toggleAll (e) {
        var isChecked = $(e.target).prop('checked');

        todos.forEach(function (todo) {
            todo.completed = isChecked;
        });

        render();
    }
    function getActiveTodos (todos) {
        return todos.filter(function (todo) {
            return !todo.completed;
        });
    }
    function getCompletedTodos (todos) {
        return todos.filter(function (todo) {
            return todo.completed;
        });
    }
    function getFilteredTodos () {
        if (filter === 'active') {
            return getActiveTodos();
        }

        if (filter === 'completed') {
            return getCompletedTodos();
        }

        return todos;
    }
    function destroyCompleted (todos) {
        todos = getActiveTodos();
        filter = 'all';
        render();
    }

    function indexFromEl (el, todos) {
        var id = $(el).closest('li').data('id');
        var todos = todos;
        var i = todos.length;

        while (i--) {
            if (todos[i].id === id) {
                return i;
            }
        }
    }
    function create (e, todos) {
        var $input = $(e.target);
        var val = $input.val().trim();

        if (e.which !== ENTER_KEY || !val) {
            return;
        }

        todos.push({
            id: uuid(),
            title: val,
            completed: false
        });

        $input.val('');

        render();
    }
    function toggle (e, todos) {
        var i = indexFromEl(e.target);
        todos[i].completed = !todos[i].completed;
        render();
    }
    function edit (e) {
        var $input = $(e.target).closest('li').addClass('editing').find('.edit');
        $input.val($input.val()).focus();
    }
    function editKeyup (e) {
        if (e.which === ENTER_KEY) {
            e.target.blur();
        }

        if (e.which === ESCAPE_KEY) {
            $(e.target).data('abort', true).blur();
        }
    }
    function update (e, todos) {
        var el = e.target;
        var $el = $(el);
        var val = $el.val().trim();

        if (!val) {
            destroy(e);
            return;
        }

        if ($el.data('abort')) {
            $el.data('abort', false);
        } else {
            todos[indexFromEl(el)].title = val;
        }

        render();
    }
    function destroy (e, todos) {
        todos.splice(indexFromEl(e.target, todos), 1);
        render();
    }

	init();
});