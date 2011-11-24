/**
# Form Fields

This file defines all of the typical web form fields generally used with an EditableView.
It registers the Handlebars helpers to template a form, as well as the Backbone View classes
for each field type.

### Building Form Templates

Define a form template for each EditableView using the given Handlebars helpers. It is easiest
to name each form field with the name of its corresponding model attribute. Define each
form field's options in the view's `fields` object, as described in the docs for EditableView.
For example:

    <h1>New Post</h1>
    {{#form new_post}}
      {{form_label "headline" "Post Headline"}}
      {{form_text "headline"}}
      {{form_label "body" "Post Body"}}
      {{form_textarea "body"}}
      {{form_label "category" "Post Category"}}
      {{form_select "category"}}
      {{form_submit "new_post" "Create Post"}}
    {{/form}}

### Custom Field Types

Extend the class `Duckbone.FormFieldBase` to create additional field types. Add additional
functionality to `afterInitialize` and `createChildren`. Override `get` and `set` to interact
with the model.

Study the class `Duckbone.RadioSetFormField` for an example of a complex new field type.
*/

(function() {

  // ### Handlebars Helpers

  // #### helper {{#form}}
  // - name - the form's `name` attribute
  // - block - a block template containing the body of the form
  //
  // Block helper to create a form tag. It's name attribute will be set to the given name,
  // and its class will be set to the same. In the event that the form is named in Rails-style
  // `new_foo` or `edit_foo`, then the class `foo` will also be added.
  Handlebars.registerHelper('form', function(name, block) {
    var className = name;
    className = className.replace(/^(new_)(.*)/, "$2").replace(/^(edit_)(.*)/, "$2");
    if (className != name) className += ' ' + name;
    return '<form action="#" name="'+name+'" class="'+className+'">\n' + block(this) + '\n</form>';
  });

  // #### helper {{form\_error\_banner}}
  // - text - the text to display in the form's error banner
  //
  // This helper creates a div containing a form error banner. This banner is shown
  // whenever the form is submitted and found to be invalid.
  Handlebars.registerHelper('form_error_banner', function(text) {
    text = text || "Please fix the errors below";
    return new Handlebars.SafeString('<div class="error_banner" style="display: none">' + Handlebars.Utils.escapeExpression(text) + '</div>');
  });

  // #### helper {{form\_error}}
  // - name - the form field for which to display validation errors
  //
  // Explicitly place the form error el rather than in the default location.
  // Otherwise it will be implicitly placed after the element.
  Handlebars.registerHelper('form_error', function(name) {
    return new Handlebars.SafeString('<div class="'+ Handlebars.Utils.escapeExpression(name) + '_errors"></div>');
  });

  // #### helper {{form\_label}}
  // - name - the name of the associated form field
  // - text - the text for the label
  //
  // Creates an HTML `<label>` tag that is associated to the given form field.
  // If label text is omitted, then the prettified form field name is used.
  // For example, `new_account_application` will become "New Account Application".
  Handlebars.registerHelper('form_label', function(name, text) {
    if (typeof text == 'object') {
      text = name; // text is empty. use name
      text = text.replace(/^(.)/, function(c) {
        return c.toUpperCase(); // capitalize first character
      });
      text = text.replace(/(\_[a-z])/g, function($1) {
        return $1.toUpperCase().replace('_',' '); // capitalize each next word, replace _ with space
      });
    }
    return new Handlebars.SafeString('<label data-field-name="'+Handlebars.Utils.escapeExpression(name)+'">'+Handlebars.Utils.escapeExpression(text)+'</label>');
  });

  // #### helper {{form\_text}}
  // - name - the form field name
  //
  // Create an HTML tag of type `<input type="text">`
  Handlebars.registerHelper('form_text', function(name) {
    return new Handlebars.SafeString('<input class="form_text" type="text" name="'+Handlebars.Utils.escapeExpression(name)+'"/>');
  });

  // #### helper {{form\_select}}
  // - name - the form field name
  //
  // Create an empty HTML `<select>` tag. The form field view is responsible for populating
  // the child `option` elements according to its `selectOptions` property.
  Handlebars.registerHelper('form_select', function(name) {
    return new Handlebars.SafeString('<select class="form_select" name="'+Handlebars.Utils.escapeExpression(name)+'"></select>');
  });

  // #### helper {{form\_radio\_set}}
  // - name - the form field name
  //
  // The Duckbone radio set field is a high level abstraction on top of a collection of
  // HTML `<input type="radio>"` tags, that allows the developer to treat the entire radio
  // set as a single form field. The helper creates a container which is populated by the view.
  Handlebars.registerHelper('form_radio_set', function(name) {
    return new Handlebars.SafeString('<div class="form_radio_set" name="'+Handlebars.Utils.escapeExpression(name)+'"></div>');
  });

  // #### helper {{form\_checkbox}}
  // - name - the form field name
  //
  // Create an HTML tag of type `<input type="checkbox">`.
  Handlebars.registerHelper('form_checkbox', function(name) {
    return new Handlebars.SafeString('<input class="form_checkbox" type="checkbox" name="'+Handlebars.Utils.escapeExpression(name)+'"/>');
  });

  // #### helper {{form\_textarea}}
  // - name - the form field name
  //
  // Create an HTML tag of type `<textarea>`.
  Handlebars.registerHelper('form_textarea', function(name) {
    return new Handlebars.SafeString('<textarea class="form_textarea" name="'+Handlebars.Utils.escapeExpression(name)+'"></textarea>');
  });

  // #### helper {{form\_password}}
  // - name - the form field name
  //
  // Create an HTML tag of type `<input type="password">`.
  Handlebars.registerHelper('form_password', function(name) {
    return new Handlebars.SafeString('<input class="form_password" type="password" name="'+Handlebars.Utils.escapeExpression(name)+'"></input>');
  });

  // #### helper {{form\_submit}}
  // - name - the form field name, generally set to the same as the name of the form itself
  //
  // Create an HTML tag of type `<button>` for triggering form submission.
  Handlebars.registerHelper('form_submit', function(name, text) {
    if (typeof text == 'undefined') text = "Save";
    if (typeof text == 'object') text = "Save";
    return new Handlebars.SafeString('<button class="form_submit" name="'+Handlebars.Utils.escapeExpression(name)+'">'+Handlebars.Utils.escapeExpression(text)+'</button>');
  });

  // #### helper {{form\_submit\_with\_spinner}}
  // - name - the form field name, generally set to the same as the name of the form itself
  //
  // Create an HTML tag of type `<button>` for triggering form submission.
  // Also creates a small invisible spinner graphic, which the form submit view can use.
  Handlebars.registerHelper('form_submit_with_spinner', function(name, text, path) {
    path = (typeof path == 'object') ? '/assets/ajax_loader.gif' : path;
    if (typeof text == 'undefined') text = "Save";
    if (typeof text == 'object') text = "Save";
    var out = '<button class="form_submit" name="'+name+'">'+text+'</button>';
    out += '<img src="' + path + '" class="ajax_loading '+name+'_loading" style="display: none"/>';
    return new Handlebars.SafeString(out);
  });

  // ### Duckbone.FormFieldBase
  //
  // This provides a base class for all form fields defined in this file, or extended by the developer.
  // It extends Backbone View with BindableField and ValidateableField.
  Duckbone.FormFieldBase = Backbone.View.extend();

  _.extend(Duckbone.FormFieldBase.prototype, Duckbone.BindableField, Duckbone.ValidateableField, {

    // #### function initialize
    // - options - `Backbone.View` initialization options
    //
    // Initializes all of the functionality in BindableField and ValidateableField. Calls the hooks
    // for further extension.
    initialize: function(options) {
      this.name = this.options.name || $(this.el).attr('name');
      this.form = this.options.form;
      if (options.elAttributes) $(this.el).attr(options.elAttributes);
      this.afterInitialize(options);
      this.createChildren();
      this.bindToModel();
      this.bindToDOM();
      this.bindValidation();
    },

    // #### function afterInitialize
    // - options - `Backbone.View` initialization options
    //
    // Provides a hook for the developer to add additional functionality to subclasses.
    afterInitialize: function(options) {},

    // #### function afterInitialize
    // Provides a hook for the developer to add additional functionality to subclasses.
    // This method is used when the field must add additional elements to the DOM
    // to implement its functionality.
    createChildren: function() {}

  });

  // ### TextFormField
  Duckbone.TextFormField = Duckbone.FormFieldBase.extend({

    // #### property type
    type: "text",
    stripWhitespace: true

  });

  // ### SelectFormField
  Duckbone.SelectFormField = Duckbone.FormFieldBase.extend({

    // #### property type
    type: "select",

    // #### function createChildren
    // Adds all of the child `<option>` elements to the `<select>` element,
    // as defined by the field's `selectOptions` property.
    createChildren: function() {
      var opts = this.options.selectOptions;
      var selectOptions = (typeof opts == "function") ? opts.call(this) : opts;
      for (var opt in selectOptions) {
        var optionEl = $('<option></option>').attr({value: opt});
        optionEl.html(Handlebars.Utils.escapeExpression(selectOptions[opt]));
        $(this.el).append(optionEl);
      }
    }
  });

  // ### RadioSetFormField
  Duckbone.RadioSetFormField = Duckbone.FormFieldBase.extend({

    // #### property type
    type: "radio_set",

    // #### function createChildren
    // Adds all of the child radio button elements to the field,
    // as defined by the field's `selectOptions` property.
    createChildren: function() {
      var opts = this.options.selectOptions;
      var selectOptions = (typeof opts == "function") ? opts.call(this) : opts;
      for (var opt in selectOptions) {
        var fieldId = this.form.name + '_' + this.name + '_' + opt;
        var optionEl = $('<div><input type="radio"/><label for="' + fieldId + '" class="radio_label"></label></div>');
        $(optionEl).find('input').attr({id: fieldId, name: this.name, value: opt});
        $(optionEl).find('label').html(Handlebars.Utils.escapeExpression(this.options.selectOptions[opt]));
        $(this.el).append(optionEl);
      }
      var el = this.el;
      $(this.el).find('input').bind('change', function() { // Retrigger input changes on top level div
        $(el).trigger('change');                           // which triggers our normal bindings to happen
      });
    },

    // #### function get
    // - returns - the value of the field.
    //
    // Overrides the super to return the value of the selected radio element
    get: function() {
      return $(this.el).find('input:checked').attr('value');
    },

    // #### function set
    // - newValue - the new field value
    //
    // Overrides the super to select the matching radio element
    set: function(newValue) {
      var checkedRadio = $(this.el).find('input:checked').get(0) // Find existing selection
      if (checkedRadio) checkedRadio.checked = false; // Wipe existing selection
      var radio = $(this.el).find('input[value="'+newValue+'"]').get(0); // Find the desired new selection.
      if (radio) radio.checked = true; // Set new selection
    }

  });

  // ### CheckboxFormField
  Duckbone.CheckboxFormField = Duckbone.FormFieldBase.extend({

    // #### property type
    type: "checkbox",

    get: function() {
      return $(this.el).is(':checked');
    },

    set: function(modelValue) {
      $(this.el).attr({checked: modelValue});
    }
  });

  // ### TextAreaFormField
  Duckbone.TextAreaFormField = Duckbone.FormFieldBase.extend({

    // #### property type
    type: "textarea",
    stripWhitespace: true

  });

  // ### PasswordFormField
  Duckbone.PasswordFormField = Duckbone.FormFieldBase.extend({

    // #### property type
    type: "password",

  });

  // ### SubmitFormField
  // Does not extend FormFieldBase since it's not a BindableField
  Duckbone.SubmitFormField = Backbone.View.extend();

  _.extend(Duckbone.SubmitFormField.prototype, Duckbone.BindableField, {

    // #### property type
    type: "submit",

    // #### function initialize
    // - options - Backbone.View options
    //
    // Sets up the submit button. Pass `submitForm: false` and the button will not
    // submit the form, otherwise it will naturally submit the form.
    // Additionally, a submit form field may be defined _outside_ of the form itself,
    // and the form may be passed in as an option to enable the button to submit it.
    initialize: function(options) {
      this.form = options.form;
      this.name = options.name;
      this.spinnerEl = $(this.el).next('img.ajax_loading');
      $(this.el).bind('click', _.bind(this.bindDisableAndSpin, this));
      this.submitForm = (typeof options.submitForm == "undefined") ? true : options.submitForm;
    },

    // #### function bindDisableAndSpin
    // Bind the method `disableAndSpin` in response to a button click. If the form is valid,
    // and it calls `Model.save()` then the handler will fire.
    bindDisableAndSpin: function(e) {
      e.preventDefault();
      this.form.model.unbind('sync:create', this.disableAndSpin); // Don't double up bindings
      this.form.model.unbind('sync:update', this.disableAndSpin);
      this.form.model.bind('sync:create', this.disableAndSpin, this); // Disable and spin
      this.form.model.bind('sync:update', this.disableAndSpin, this); // if syncing starts
      if (this.submitForm) this.form.submit();
    },

    // #### function disableAndSpin
    // Add the class 'loading' to the button, which the developer should use to make the button
    // appear disabled. Also, this method steals all subsequent clicks on the button until the
    // sync completes, to provide double click protection.
    disableAndSpin: function() {
      this.form.model.unbind('sync:create', this.disableAndSpin);
      this.form.model.unbind('sync:update', this.disableAndSpin);
      if (this.spinnerEl) $(this.spinnerEl).fadeIn();
      $(this.el).addClass('loading');
      $(this.el).unbind('click');
      $(this.el).bind('click', this.stealClick);
      this.form.model.bind('sync:complete', this.syncComplete, this);
    },

    // #### function stealClick
    stealClick: function(e) {
      e.preventDefault(); return false;
    },

    // #### function syncComplete
    // Unbind handlers and restore normal state.
    syncComplete: function() {
      $(this.el).unbind('click');
      $(this.el).removeClass('loading');
      if (this.spinnerEl) $(this.spinnerEl).fadeOut();
      $(this.el).bind('click', _.bind(this.bindDisableAndSpin, this));
    }
  });

  // ### Field Types Registry
  //
  // Create a registry of all form field types. Add additional user-defined field types here.
  Duckbone.forms.fieldTypes = {
    text: Duckbone.TextFormField,
    select: Duckbone.SelectFormField,
    radio_set: Duckbone.RadioSetFormField,
    checkbox: Duckbone.CheckboxFormField,
    textarea: Duckbone.TextAreaFormField,
    password: Duckbone.PasswordFormField,
    submit: Duckbone.SubmitFormField
  };

}).call(this);