(function() {

  // Mixin for any form field that can validate itself

  Duckbone.ValidateableField = {
    isValidateableField: true,

    // Bind the change event to the validator
    // The "validate" option can be either a string key to an existing validator
    // or any function that returns true or false
    // The "invalidMessage" option will display in the error span

    bindValidation: function(validateEvent) {
      if (this.options.validate || this.options.required) {
        var field = this;
        validateEvent = validateEvent || this.options.validateEvent || 'change';

        var mouseTarget = $(window);
        var mousedownAt = null;
        var mousedownHandler = function() {
          mousedownAt = new Date();
        };

        if (this.form.view && this.form.view.isBindableView) {
          this.form.view.weakBindTo(mouseTarget, 'mousedown', mousedownHandler);
        } else {
          mouseTarget.bind('mousedown', mousedownHandler);
        }

        $(field.el).bind(validateEvent, function() {
          if (mousedownAt && (new Date()) - mousedownAt < 10) {
            _.log("Delaying validation until mouseup");
            // If a mouse button is depressed, wait until mouseup to validate
            // to keep the page from jumping out from under the user's mouse button
            var f = function() {
              mouseTarget.unbind('mouseup', f);
              _.log("Validating");
              field.validate();
            };
            mouseTarget.bind('mouseup', f);
          } else {
            // Otherwise validate immediately
            field.validate();
          }
        });
      }
    },

    // Validate this field
    // If options.required then value must be present
    // Otherwise, validate method must return true
    // If "silent" will not show validation

    validate: function(method, silent) {
      silent = silent || false;
      if (!silent) this.clearErrors();
      this.valid = true;
      if (!this.options.validate && this.options.required) {
        this.options.validate = 'required';
        this.options.invalidMessage = this.options.invalidMessage || "Required"
      }
      if (!this.options.validate) return true;
      method = method || this.options.validate;
      if (typeof method == "string") method = Duckbone.forms.validators[method];
      var invalidMessage = this.options.invalidMessage || "Invalid";
      if (method.call(this, this.get()) == false) this.valid = false;
      if (!this.valid && !silent) {
        this.addError(invalidMessage);
      } else {
        var val = this.get();
        if (Duckbone.ModelHelpers.isValidAttribute(val)) this.set(val);
      }
      return this.valid;
    },

    // Display a validation error on this field

    addError: function(message) {
      this.valid = false;
      var errorListNew = false;
      if (!this.errorList) {
        this.errorList = $('<ul>').addClass('error');
        newErrorList = true;
      }
      this.errorList.append($('<li>').html(message));
      if (newErrorList) {
        var error_div = $(this.el).parents('form').find('div.' + this.name + '_errors').get(0);
        if (error_div) {
          $(error_div).append(this.errorList);
        } else {
          $(this.el).after(this.errorList);
        }
      }
    },

    // Wipe all errors

    clearErrors: function() {
      if (this.errorList) {
        this.errorList.remove();
        this.errorList = null;
      }
    }
  };

}).call(this)