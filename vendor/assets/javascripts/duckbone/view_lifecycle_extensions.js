(function() {

  // This module adds default initialize() and remove() methods to any View class.
  // These methods try to call all of the initializers on all other Duckbone mixins
  // that are present on the View class. These are called in the correct order, so
  // that everything instantiates smoothly, without the developer needing to write initialize().

  // All of the Duckbone mixins ending in -View also mix in this module,
  // as a dependency in their included() callback.

  // These methods will not be set if the developer has previously defined them,
  // and mixing this in will have no effect.

  // There are several callback hooks available that can be defined on the object:

  // - beforeCreateChildViews() => called before ListView creates its children
  // - beforeClone() => called before EditableView clones its model for editing
  // - beforeTwirl() => called before TemplateableView calls twirl()
  // - afterCreateForm() => called after EditableView renders its form elements
  // - afterInitialize() => called after all other initializations are complete
  // - beforeRemove() => called before the View is removed
  // - afterRemove() => called after the View is removed

  var tryMethod = function(obj, method) {
    if (obj[method]) obj[method].call(obj);
  }

  var defaultInitialize = function () {

    this.application = this.options.application;

    if (this.isListableView) {
      tryMethod(this, 'beforeCreateChildViews'); // User optionally defines this
      this.createChildViews();
      this.bindCollectionEvents();
    }
    if (this.isEditableView) {
      tryMethod(this, 'beforeClone'); // User optionally defines this
      this.cloneModelForEditing();
      tryMethod(this, 'afterClone'); // User optionally defines this
    }
    if (this.isTemplateableView) {
      this.twirl();
    }
    tryMethod(this, 'createChildren'); // User optionally defines this
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
  };

  var defaultRender = function() {

    if (this.isTemplateableView) {
      this.twirl();
    }
    if (this.isStylizeableView) {
      this.applyStyles();
    }
    return this;
  };

  var defaultRemove = function() {
    if (this.isEditableView) this.expireClone();
    tryMethod(this, 'beforeRemove'); // User optionally defines this
    if (this.isBindableView) this.removeWeakBindings();
    Backbone.View.prototype.remove.call(this);
    tryMethod(this, 'afterRemove'); // User optionally defines this
    return this;
  };

  Duckbone.ViewLifecycleExtensions = {
    hasViewLifecycleExtensions: true,

    included: function() {
      this.initialize = this.hasOwnProperty('initialize') ? this.initialize : function() {
        defaultInitialize.call(this);
      }
      this.render = this.hasOwnProperty('render') ? this.render : function() {
        defaultRender.call(this);
      }
      this.remove = this.hasOwnProperty('remove') ? this.remove : function() {
        defaultRemove.call(this);
      }
    }
  }

}).call();
