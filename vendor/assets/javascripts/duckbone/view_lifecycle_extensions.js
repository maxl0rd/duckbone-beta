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
  // beforeCreateChildViews() => called before ListView creates its children
  // beforeClone() => called before EditableView clones its model for editing
  // beforeTwirl() => called before TemplateableView calls twirl()
  // afterInitialize() => called after all other initializations are complete
  // beforeRemove() => called before the View is removed
  // afterRemove() => called after the View is removed

  var defaultInitialize = function () {

    var tryMethod = _.bind(function(method) {
      if (this[method]) this[method].call(this);
    }, this);

    var tryMethods = _.bind(function(methods) {
      _.each(methods, tryMethod);
    }, this);

    this.application = this.options.application;

    if (this.isListableView) {
      tryMethods([
        'beforeCreateChildViews', // User optionally defines this
        'createChildViews',
        'bindCollectionEvents'
      ]);
    }
    if (this.isEditableView) {
      tryMethods([
        'beforeClone', // User optionally defines this
        'cloneModelForEditing',
        'afterClone' // User optionally defines this
      ])
    }
    if (this.isTemplateableView) {
      tryMethods([
        'beforeTwirl', // User optionally defines this
        'twirl'
      ])
    }
    tryMethod('createChildren'); // User optionally defines this
    if (this.isStylizeableView) {
      tryMethod('applyStyles');
    }
    if (this.isBindableView) {
      tryMethod('bindAttributes');
    }
    if (this.isEditableView) {
      tryMethods([
        'bindModelSyncEvents',
        'createForm',
        'bindFormSubmit'
      ]);
    }
    tryMethod('afterInitialize'); // User optionally defines this
  };

  var defaultRemove = function() {
    var tryMethod = _.bind(function(method) {
      if (this[method]) this[method].call(this);
    }, this);
    if (this.isEditableView) tryMethod('expireClone');
    tryMethod('beforeRemove');
    if (this.isBindableView) tryMethod('removeWeakBindings');
    Backbone.View.prototype.remove.call(this);
    tryMethod('afterRemove');
  };

  Duckbone.ViewLifecycleExtensions = {
    hasViewLifecycleExtensions: true,

    included: function() {
      this.initialize = this.hasOwnProperty('initialize') ? this.initialize : function() {
        defaultInitialize.call(this);
      }
      this.remove = this.hasOwnProperty('remove') ? this.remove : function() {
        defaultRemove.call(this);
      }
    }
  }

}).call();
