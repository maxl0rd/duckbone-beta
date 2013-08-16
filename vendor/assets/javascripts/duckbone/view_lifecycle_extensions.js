// ViewLifeCycleExensions
// ======================

// This module adds default initialize(), render(), and remove() methods to any View class.
// These methods call any lifecycle hooks on other Duckbone mixins
// that are present on the View class. These are called in the correct order, so
// that everything instantiates smoothly, without the developer needing to write initialize().

// All of the Duckbone mixins ending in -View also mix in this module,
// as a dependency in their included() callback.

// There are several callback hooks available that can be defined on the object:

// - beforeClone() => called before EditableView clones its model for editing
// - afterClone() => called after EditableView clones its model for editing
// - afterCreateForm() => called after EditableView renders its form elements
// - afterInitialize() => called after all other initializations are complete
// - beforeRemove() => called before the View is removed
// - afterRemove() => called after the View is removed

(function() {

  Duckbone.ViewLifecycleExtensions = {
    hasViewLifecycleExtensions: true,

    initialize: function () {

      this.application = this.options.application;

      if (this.isEditableView) {
        tryMethod(this, 'beforeClone'); // User optionally defines this
        this.cloneModelForEditing();
        tryMethod(this, 'afterClone'); // User optionally defines this
      }
      this.render();
      if (this.isStylizeableView) {
        this.applyStyles();
      }
      if (this.isBindableView) {
        this.bindAttributes();
      }
      if (this.isEditableView) {
        this.bindModelSyncEvents();
        this.createForm();
        tryMethod(this, 'afterCreateForm'); // User optionally defines this
      }
      tryMethod(this, 'afterInitialize'); // User optionally defines this
    },

    render: function() {
      if (this.isTemplateableView) {
        this.renderTemplate();
      }
      if (this.isStylizeableView) {
        this.applyStyles();
      }
      return this;
    },

    remove: function() {
      if (this.isEditableView) this.expireClone();
      tryMethod(this, 'beforeRemove'); // User optionally defines this
      this.removeWeakBindings();
      if (this.isNestableView) this.removeNestedViews();
      Backbone.View.prototype.remove.call(this);
      tryMethod(this, 'afterRemove'); // User optionally defines this
      return this;
    },

    // ### Weak Binding
    // Weak bindings are a key feature of the Duckbone view lifecycle.  Weak bindings
    // may be created against any object that responds to bind() and unbind() - most
    // notably Backbone and jQuery objects.  When a weak binding is made in the context
    // of a view, it will automatically be unbound when that view is removed to prevent
    // zombie callbacks from causing trouble.

    // #### function weakBindToModel
    // Because binding to a view's model is so common, this shortcut method is provided.
    // It has the same method signature as `model.bind()`
    // - event - event to bind to, ie 'change:foo'
    // - callback - callback function
    // - context - optional `this` context for the callback, defaults to the view
    // - returns - nothing
    //
    // Creates a binding on the view's model that is unbound when the view is removed
    weakBindToModel: function(event, callback, context) {
      this.weakBindTo(this.model, event, callback, context);
    },

    // #### function weakBindTo
    // - obj - An object responding to `bind()`, e.g. a jQuery object or anything that
    //   includes Backbone.Events
    // - event - event to bind to, ie 'change:foo'
    // - callback - callback function
    // - context - optional `this` context for the callback, defaults to the view
    // - returns - nothing
    //
    // Creates a binding on the object that is unbound when the view is removed
    weakBindTo: function(obj, event, callback, context) {
      this._weakBindings = this._weakBindings || [];
      this._weakBindings.push([obj, event, callback]);
      obj.bind.apply(obj, _.toArray(arguments).slice(1));
    },

    // #### function removeWeakBindings
    // - returns - nothing
    // Unbinds all weak bindings created by this view
    removeWeakBindings: function() {
      _.each(this._weakBindings, function(binding) {
        binding[0].unbind(binding[1],binding[2]);
      });
      delete this['_weakBindings'];
      if (this.isBindableView) this.unbindLiveTimestamps();
    }
  }

  var tryMethod = function(obj, method) {
    if (obj[method]) obj[method].call(obj);
  }

}).call();
