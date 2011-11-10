(function() {

  // Duckbone.BindableField
  // This module enables a view to act as a form element that can bind bi-directionally to a model.
  // For example, an input field in a form can both reflect the model's state,
  // and also update it based on a user's input.
  // Any custom form field types used by an EditableView should include this module.

  Duckbone.BindableField = {
    isBindableField: true,

    // If data must be transformed to or from the DOM, 
    // then override these methods to provide different behavior

    modelToDomTransform: function(modelValue) {
      return modelValue ? modelValue : "";
    },
    domToModelTransform: function(domValue) {
      return domValue;
    },

    // Override get and set to provide even more non-standard behaviors.
    // If jQuery.val() does not do the right thing for your form field,
    // then override these functions to move data in and out of the DOM element

    get: function() {
      return this.domToModelTransform($(this.el).val());
    },
    set: function(value) {
      $(this.el).val(this.modelToDomTransform(value));
    },

    // Bind changes on the model to this field's DOM element.
    // Subscribe to "change:attribute" events on the model.
    // Call this function in initialize() to establish the binding in this direction.

    bindToModel: function(attr) {
      attr = attr || this.modelAttribute || this.options.modelAttribute || this.name || this.options.name;
      if (attr) {
        this.modelAttribute = attr;
      } else {
        throw("Duckbone.BindableField.bindToModel() called without a modelAttribute");
      }
      var field = this;
      var model = this.model;
      var changeEvent = 'change:'+attr;
      model.bind(changeEvent, function() {
        if (model.get(attr) != field.get() && Duckbone.ModelHelpers.isValidAttribute(model.get(attr))) 
          field.set(model.get(attr));
      });
      field.set(model.get(attr));
    },

    // Bind changes to this field's DOM element to model.set
    // This will trigger a "change:attribute" event on the model.
    // Call this function in initialize() to establish the binding in this direction.

    bindToDOM: function(attr, changeEvent) {
      attr = attr || this.modelAttribute || this.options.modelAttribute || this.name || this.options.name;
      if (attr) {
        this.modelAttribute = attr;
      } else {
        throw("Duckbone.BindableField.bindToDOM() called without a modelAttribute");
      }
      var changeEvent = this.changeEvent || this.options.changeEvent || 'change';
      var field = this, model = this.model;
      $(field.el).bind(changeEvent, function() {
        modelSet(model, attr, field.get());
      });
      modelSet(model, attr, field.get());
    }

  };
  
  // Internal
  
  // Make sure to never set a model value to undefined.
  // Undefined attributes are dropped when serialized to JSON,
  // which will have the wrong effect on the rails side.
  // These attrs will be ignored instead of validated against a null value.
  
  function modelSet(model, attr, val, silent) {
    silent = silent || false;
    if (typeof val == 'undefined') {
      _.log("Attempt to set model attribute " + attr + " to undefined");
      val = null;
    }
    var attrs = {};
    attrs[attr] = val;
    model.set(attrs, {silent: silent});
  }

}).call(this);