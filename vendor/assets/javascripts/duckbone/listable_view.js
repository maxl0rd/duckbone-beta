/**
# Duckbone.ListableView

ListableView provides all of the functionality necessary to create a "container" view that
cleanly manages a collection of identical sub-views.

## Usage

Instantiate the view with a `collection` property of models, and a `viewClass`. The ListableView manages an
instance of `viewClass` for each model in its collection. It is also easy to lazy load models, as the ListableView
can be created at any time, and child views will only be created when models are loaded into the collection.

The view's tag is a `<ul>` by default, but this may be changed by setting the view's `tagName` property as usual.
Typically the tag for the `viewClass` will be set to `<li>`.

There is a base class that mixes in ListableView, called `Duckbone.ListView`.

Example:

    TicketView = Duckbone.View.extend({
      tagName: 'li',
      templateData: '<div>Ticket {{id}}</div>'
    });
    TicketsListView = Duckbone.ListView.extend({
      viewClass: TicketView
    });

    ticketsView = new TicketsListView({
      collection: new Duckbone.Collection()
    });
    ticketsView.collection.fetch();

### Collection Events

The view responds to the following events:

- Responds to collection _reset_ by completely re-rendering itself
- Responds to collection _add_ by inserting the new view into the list, respecting the collection's sort order
- Responds to collection _remove_ by removing the corresponding view

This functionality can be overridden by redefining the `collectionEvents` property. String method names, or
callback functions may be provided for any event that can be issued by the collection. Note that defining
`collectionEvents` will override _all_ default behavior, not individually per event.

For example:

    TicketsListView = Duckbone.ListView.extend({
      viewClass: TicketView,
      collectionEvents: {
        'reset': 'myResetHandler',
        'add': 'myFancyAddHandler',
        'remove': function() { ... },
        'myCustomEvent': function() { ... }
      }
      myResetHandler: function() { ... }
      // ... etc ...
    });

*/

(function() {

  Duckbone.ListableView = {

    // ### Mixin

    // #### property isListableView
    // Indicates the presence of this mixin
    isListableView: true,

    // #### function included
    // Also include ViewLifecycleExtensions, BindableView, and NestableView
    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
      if (!this.isBindableView) {
        Duckbone.include(this, Duckbone.BindableView);
      }
      if (!this.isNestableView) {
        Duckbone.include(this, Duckbone.NestableView);
      }
    },

    // #### property tagName
    // Tells Backbone to create a `<ul>` list element. Can be overridden.
    tagName: 'ul',

    // #### property className
    // Tells Backbone to use this class name. Can be overriden.
    className: 'listable_view',

    // #### function render
    // - force - forces a re-render even if the view is already rendered
    render: function(force) {
      if (!this._viewsRendered || force) {
        renderItems.call(this);
        if (!this._collectionEventsBound) {
          this.bindCollectionEvents();
          this._collectionEventsBound = true;
        }
        this._viewsRendered = true;
      }
      return this;
    },

    // #### function createChildren
    // Creates a child view for each model in the collection, in a way compatible with NestableView
    createChildren: function() {
      return _.reduce(this.collection.models, function(views, model) {
        views[model.cid] = new this.viewClass({model: model});
        return views;
      }, {}, this);
    },

    // Bind default behaviors to collection events
    // Can also override or extend behavior by calling with a hash of event names and callbacks
    // Callbacks are always called in the context of the ListableView
    // usage:
    // bindCollectionEvents({
    //  reset: function() { // do stuff }
    //  add: 'myMethod' // or a method on this class
    // });

    bindCollectionEvents: function(eventHandlers) {
      var handler;
      ensureCollection(this);
      eventHandlers = eventHandlers || this.collectionEvents || collectionEventHandlers;
      for (var event in eventHandlers) {
        handler = eventHandlers[event];
        if (typeof handler == 'string') handler = this[handler];
        if (typeof handler != 'function') {
          throw ('Duckbone.ListableView.bindCollectionEvents() called with bad handler for ' + event )
        }
        this.weakBindTo(this.collection, event, handler, this);
      }
    },

    // #### function getViewByModel
    // - model - a model instance in the view's collection
    // - returns - the view corresponding to the given model instance
    getViewByModel: function(model) {
      return this.children[model.cid];
    }

  };

  // Internal

  // #### function renderItems
  // Renders each individual view
  function renderItems() {
    ensureViewClass(this);
    ensureCollection(this);
    this.setupNestedViews(); // Create all of the children views
    var fragment = document.createDocumentFragment();
    _.each(this.children, function(view) {
      fragment.appendChild(view.el); // add their el's to a fragment first
    });
    this.el.appendChild(fragment); // Then add the fragment to the DOM
  }

  // Bind default handlers to these collection events
  var collectionEventHandlers = {
    'reset': collectionReset,
    'add': collectionAdd,
    'remove': collectionRemove
  };

  // Default handler for when the collection is reset
  function collectionReset() {
    this.removeNestedViews();
    this.render(true);
  }

  // Default handler for when a model is added to the collection
  // The new view is inserted in the correct sort order
  function collectionAdd(model) {
    var view = new this.viewClass({model: model});
    this.children[model.cid] = view;
    var position = _(this.collection.models).indexOf(model);
    if (position == 0) {
      $(this.el).prepend(view.el);
    } else {
      var previousElement = $(this.el).children().eq(position-1);
      $(previousElement).after(view.el);
    }
  }

  // Default handler for when a model is removed from the collection
  function collectionRemove(model) {
    this.children[model.cid].remove();
    delete this.children[model.cid];
  }

  // Ensure that the view has obtained its view and collection objects
  // Check in its "options" property first, then in the object itself,
  // and then default to a new object
  function ensureViewClass(context) {
    context.viewClass = context.options.viewClass || context.viewClass || new Backbone.View();
  };
  function ensureCollection(context) {
    context.collection = context.options.collection || context.collection || new Backbone.Collection();
  };

}).call(this);