/**
# Duckbone.BindableField

This module enables a view to act as a form element that can bind bi-directionally to a model.
For example, an input field in a form can both reflect the model's state, and also update it
based on a user's input. The abstract form field base class `Duckbone.FormFieldBase` includes
this module, and any custom form field types used by an EditableView should also include this module.
*/

(function() {

  Duckbone.BindableField = {

    // #### property isBindableField
    // Indicates a view with this mixin included
    isBindableField: true,

    // ### Model/DOM Translation
    // If `jquery.val()` does not do the right thing for your form field, then
    // override the `get` and `set` functions to move data in and out of the DOM element.
    // If `jquery.val()` works, but the data must be transformed in or out of the model,
    // then simply override `modelToDomTransform` and `domToModelTransform`.

    // #### function get
    // - returns - The current value of the form field's DOM element
    get: function() {
      return this.domToModelTransform($(this.el).val());
    },

    // #### function set
    // - value - the new value to set the form field's DOM element to
    // - returns - nothing
    set: function(value) {
      $(this.el).val(this.modelToDomTransform(value));
    },

    // #### function modelToDomTransform
    // - modelValue - the given model value
    // - returns - the transformed value to set on the DOM element
    modelToDomTransform: function(modelValue) {
      return modelValue ? modelValue : "";
    },

    // #### function domToModelTransform
    // - domValue - the given DOM element value
    // - returns - the transformed value to set on the model
    domToModelTransform: function(domValue) {
      return domValue;
    },

    // ### Binding

    // #### function bindToModel
    // - attr - the model attribute to bind to, falling back first to the view's `modelAttribute`,
    //   and then to the form field's `name` attribute.
    // - returns - nothing
    //
    // This method initializes the form field's value to the model value,
    // and then continually updates on any changes to that model attribute.
    // The DOM element will only be updated if the model attribute is a valid value
    // (non-undefined, non-NaN) and different from the existing field value.
    // This behavior arrests the circular firing of change events.
    bindToModel: function(attr) {
      attr = attr || this.modelAttribute || this.options.modelAttribute || this.name || this.options.name;
      if (!attr) throw("Duckbone.BindableField.bindToModel() called without a modelAttribute");
      this.modelAttribute = attr;
      var field = this, model = this.model, changeEvent = 'change:'+attr;
      model.bind(changeEvent, function() { // bind to model changes
        var newValue = model.get(attr);
        if (newValue != field.get() && Duckbone.ModelHelpers.isValidAttribute(newValue))
          field.set(newValue);
      });
      field.set(model.get(attr)); // initialize field to model value
    },

    // #### function bindToDOM
    // - attr - the model attribute to bind to, falling back first to the view's `modelAttribute`,
    //   and then to the form field's `name` attribute.
    // - changeEvent - the DOM event on the view's element to bind to changes.
    //   Defaults to 'change' which works for most input-style fields.
    // - el - the DOM element to bind to, defaulting to the view's top level element
    //
    // This method initializes the model's value to the form field value,
    // and then continually updates on any further changes to the field.
    // The model will generally be set to `null` on an empty field, not undefined.
    bindToDOM: function(attr, changeEvent, el) {
      attr = attr || this.modelAttribute || this.options.modelAttribute || this.name || this.options.name;
      if (!attr) throw("Duckbone.BindableField.bindToDOM() called without a modelAttribute");
      this.modelAttribute = attr;
      var changeEvent = this.changeEvent || this.options.changeEvent || 'change';
      el = el || this.el; // by default, bind to the parent element
      var field = this, model = this.model;
      $(el).bind(changeEvent, function() { // bind to DOM changes
        modelSet(model, attr, field.get());
      });
      modelSet(model, attr, field.get()); // initialize model to field value
    }
  };

  // ### Internal Functions

  // Make sure to never set a model value to undefined.
  // Undefined attributes are dropped when serialized to JSON,
  // which will have the wrong effect on the rails side.
  // These attrs will be ignored instead of validated against a null value.
  function modelSet(model, attr, val, silent) {
    silent = silent || false;
    if (typeof val == 'undefined') val = null;
    Duckbone.ModelHelpers.setOne.call(model, attr, val, {silent: silent});
  }

}).call(this);