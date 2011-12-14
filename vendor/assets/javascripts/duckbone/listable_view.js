(function() {

  Duckbone.ListableView = {
    isListableView: true,

    tagName: 'ul',
    className: 'listable_view',

    // Also include ViewLifecycleExtensions

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

    render: function(force) {
      if (!this._viewsRendered || force) {
        this.renderItems();
        this.bindCollectionEvents();
        this._viewsRendered = true;
      }
      return this;
    },

    createNestedViews: function() {
      return _.reduce(this.collection.models, function(views, model) {
        views[model.cid] = new this.viewClass({model: model});
        return views;
      }, {}, this);
    },

    // Create a view for each model in the collection
    renderItems: function() {
      ensureViewClass(this);
      ensureCollection(this);
      // Create all of the children views
      this.setupNestedViews();
      // add their el's to a fragment first
      var fragment = document.createDocumentFragment();
      _.each(this.nestedViews, function(view) {
        fragment.appendChild(view.el);
      });
      // Then add the fragment to the DOM. This cuts down on page redraws
      this.el.appendChild(fragment);
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

    // Remove all child views (without destroying the models in the collection)

    // Call fetch on the collection to refresh its contents
    // The reset event will cause this view to completely redraw

    refresh: function(options) {
      options = options || {};
      this.empty();
      this.collection.fetch();
    },

    // Retrieve the view for a given model

    getViewByModel: function(model) {
      return this.nestedViews[model.cid];
    }

  };

  // Internal

  // The collection events to bind to which list methods

  var collectionEventHandlers = {
    'reset': collectionReset,
    'add': collectionAdd,
    'remove': collectionRemove
  };

  // Default handler for when the collection is reset

  function collectionReset() {
    this.removeNestedViews();
    this.render(true);
  };

  // Default handler for when a model is added to the collection

  function collectionAdd(model) {
    var view = new this.viewClass({model: model});
    this.nestedViews[model.cid] = view;
    var el = this.nestedViews[model.cid].el;
    var position = _(this.collection.models).indexOf(model);
    if (position == 0) {
      $(this.el).prepend(this.nestedViews[model.cid].el);
    } else {
      var previousElement = $(this.el).children().eq(position-1);
      $(previousElement).after(el);
    }
  };

  // Default handler for when a model is removed from the collection

  function collectionRemove(model) {
    this.nestedViews[model.cid].remove();
    delete this.nestedViews[model.cid];
  };

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