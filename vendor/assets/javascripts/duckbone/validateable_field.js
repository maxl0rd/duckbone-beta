// ValidateableField
// =================
//
// This module is included in any form field view that provides validation
// capabilities as part of an EditableView. It provides methods to bind, run, and
// display the results of validations.
//
// EditableView considers client-side validations to a view-level responsibility and
// so the existing Backbone Model validation facilities are not used. The form and its
// fields itself are validated, rather than the model, since the same model can have
// different validation requirements in different editing contexts. So the model always
// reflects the data entered into the view, even if that input is invalid.
//
// ### Usage
//
// This functionality is generally called by the FormManager itself during initialization,
// and as part of the process of validating an entire form before submission. However,
// in special cases the developer might call `validate` or `addError` on the field as needed.

(function() {

  Duckbone.ValidateableField = {

    // #### property isValidateableField
    // Indicates a view with this mixin included
    isValidateableField: true,

    // #### function bindValidation
    // - validateEvent - the DOM event to trigger form validation, defaults to _change_.
    // - el - the DOM element to bind to, defaulting to the view's top level element
    // - returns nothing
    //
    // Bind the change event to the validator
    // The "validate" option can be either a string key to an existing validator
    // or any function that returns true or false
    // The "invalidMessage" option will display in the error span
    bindValidation: function(validateEvent, el) {

      // Setup
      var method = this.options.validate || this.options.required;
      if (!method) return; // bomb out if this field is not configured to validate
      var field = this;
      validateEvent = validateEvent || this.options.validateEvent || 'change';
      el = el || this.el;

      // Fix the problem where clicking submit creates new validation elements
      // that cause the submit button to jump around on the page.
      // Record the last mouse down time, and if it was very recent,
      // then delay validation until the mouse up event.
      var mouseTarget = $(window), mousedownAt = null;
      var mousedownHandler = function() {
        mousedownAt = new Date()
      };
      var mouseupHandler = function() {
        mouseTarget.unbind('mouseup', mouseupHandler);
        field.validate();
      };
      if (this.form.view && this.form.view.isBindableView) {
        this.form.view.weakBindTo(mouseTarget, 'mousedown', mousedownHandler);
      } else {
        mouseTarget.bind('mousedown', mousedownHandler);
      }

      // Bind to the validation event
      $(el).bind(validateEvent, function() {
        if (mousedownAt && (new Date()) - mousedownAt < 10) {
          mouseTarget.bind('mouseup', mouseupHandler); // wait for mouseup to validate
        } else {
          field.validate(); // validate immediately
        }
      });
    },

    // #### function validate
    // - method - the validation method to use. Accepts any string key present in
    //   `Duckbone.forms.validators`, or a function that returns true or false.
    //  The function will be called in the context of the field, and passed its
    //  current value.
    // - silent - a boolean indicating whether to display the validation errors.
    //   Defaults to true.
    // - returns - a boolean indicating whether the field is valid or not. Fields
    //   without validation methods will always return true.
    //
    // Validates this field using either the given method, or the method previously
    // configured on the field by the form. If the field is invalid, the invalid message
    // will be added to its DOM, unless `silent` is true.
    validate: function(method, silent) {
      silent = silent || false;
      var originalValidity = this.valid;
      if (!silent) this.clearErrors();
      this.valid = true; // assume valid unless method fails
      if (!this.options.validate && this.options.required) {
        this.options.validate = 'required';
        this.options.invalidMessage = this.options.invalidMessage || "Required"
      }
      method = method || this.options.validate;
      if (typeof method == "string") method = Duckbone.forms.validators[method];
      if (!method) return true; // no validation
      var invalidMessage = this.options.invalidMessage || "Invalid";
      if (method.call(this, this.get()) == false) this.valid = false;
      if (!this.valid && !silent) {
        this.addError(invalidMessage);
      } else {
        var val = this.get();
        if (Duckbone.ModelHelpers.isValidAttribute(val)) this.set(val);
      }
      if (this.valid != originalValidity) this.form.trigger('fieldValidityChanged', this);
      return this.valid;
    },

    // #### addError
    // - message - the error message to display on the field.
    // - returns - nothing
    //
    // Display a validation error on this field. The error will be added to a
    // `ul` list of errors immediately after the form field. This element may
    // be styled by the developer as needed. Custom form fields can override
    // this method to provide additional display behavior as needed.
    // If the handlebars helper {{form_error}} is used, then this method will
    // append the errors to that element.
    addError: function(message) {
      if (!this.errorList) {
        this.errorList = $('<ul>').addClass('error');
        var error_div = $(this.el).parents('form').find('div.' + this.name + '_errors').get(0);
        if (error_div) {
          $(error_div).append(this.errorList);
        } else {
          $(this.el).after(this.errorList);
        }
      }
      this.errorList.append($('<li>').html(Handlebars.Utils.escapeExpression(message)));
    },

    // #### clearErrors
    // Clear all error messages.
    clearErrors: function() {
      if (this.errorList) {
        this.errorList.remove();
        this.errorList = null;
      }
    }
  };

}).call(this)
