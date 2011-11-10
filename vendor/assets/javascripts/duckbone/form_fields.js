(function() {

  // {{#form "edit_goal"}} ... {{/form}}
  // Block helper to create a form tag and give it a name and a class

  Handlebars.registerHelper('form', function(name, block) {
    var className = name;
    className = className.replace(/^(new_)(.*)/, "$2").replace(/^(edit_)(.*)/, "$2");
    if (className != name) className += ' ' + name;
    return '<form action="#" name="'+name+'" class="'+className+'">\n' + block(this) + '\n</form>';
  });

  // {{form_error_banner "Woopsie doodles! There's a problem."}}

  Handlebars.registerHelper('form_error_banner', function(text) {
    text = text || "Please fix the errors below";
    return new Handlebars.SafeString('<div class="error_banner" style="display: none">' + text + '</div>');
  });

  // {{form_error "title"}}
  // Explicitly place the form error el rather than the default location
  // (otherwise it will be implicitly placed after the element)

  Handlebars.registerHelper('form_error', function(name) {
    return new Handlebars.SafeString('<div class="'+ name + '_errors"></div>');
  });

  // {{form_label "field_name" "Label text..."}}
  // If label text is omitted, then prettyify the field name and use that

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
    return new Handlebars.SafeString('<label data-field-name="'+name+'">'+text+'</label>');
  });

  // {{form_text "title"}}

  Handlebars.registerHelper('form_text', function(name) {
    return new Handlebars.SafeString('<input class="form_text" type="text" name="'+name+'"/>');
  });

  // {{form_select "goal"}}
  // Helper to create a form select field

  Handlebars.registerHelper('form_select', function(name) {
    return new Handlebars.SafeString('<select class="form_select" name="'+name+'"></select>');
  });

  // {{form_radio_set "how_saved"}}
  // Helper to create a radio set

  Handlebars.registerHelper('form_radio_set', function(name) {
    return new Handlebars.SafeString('<div class="form_radio_set" name="'+name+'"></div>');
  });

  // {{form_checkbox "accept_terms"}}
  // Helper to create a checkbox option

  Handlebars.registerHelper('form_checkbox', function(name) {
    return new Handlebars.SafeString('<input class="form_checkbox" type="checkbox" name="'+name+'"/>');
  });

  // {{form_textarea "body"}}
  // Helper to create a textarea

  Handlebars.registerHelper('form_textarea', function(name) {
    return new Handlebars.SafeString('<textarea class="form_textarea" name="'+name+'"></textarea>');
  });

  // {{form_password "password"}}
  // Helper to create a password input

  Handlebars.registerHelper('form_password', function(name) {
    return new Handlebars.SafeString('<input class="form_password" type="password" name="'+name+'"></input>');
  });

  // {{form_submit "my_submit"}}
  // Helper to create a submit input

  Handlebars.registerHelper('form_submit', function(name, text) {
    if (typeof text == 'undefined') text = "Save";
    if (typeof text == 'object') text = "Save";
    return new Handlebars.SafeString('<button class="form_submit" name="'+name+'">'+text+'</button>');
  });

  // Base class for all form fields
  // A Backbone view with BindableField and ValidateableField
  // Custom initializer. User afterInitialize() to extend.

  Duckbone.FormFieldBase = Backbone.View.extend();
  _.extend(Duckbone.FormFieldBase.prototype, Duckbone.BindableField, Duckbone.ValidateableField, {

    initialize: function(options) {
      this.name = this.options.name || $(this.el).attr('name');
      this.form = this.options.form;
      $(this.el).attr(options.elAttributes);
      this.afterInitialize();
      this.createChildren();
      this.bindToModel();
      this.bindToDOM();
      this.bindValidation();
    },

    // Extend this with specific field init behaviors
    afterInitialize: function(options) {},

    // Extend this if the field creates additional DOM elements
    createChildren: function() {}

  });

  // TextFormField

  Duckbone.TextFormField = Duckbone.FormFieldBase.extend({
    type: "text",
    changeEvent: "change"
  });

  // SelectFormField

  Duckbone.SelectFormField = Duckbone.FormFieldBase.extend({
    type: "select",
    createChildren: function() {
      var opts = this.options.selectOptions;
      var selectOptions = (typeof opts == "function") ? opts.call(this) : opts;
      for (var opt in selectOptions) {
        var optionEl = $('<option></option>').attr({value: opt});
        optionEl.html(selectOptions[opt]);
        $(this.el).append(optionEl);
      }
    }
  });

  // RadioSetFormField

  Duckbone.RadioSetFormField = Duckbone.FormFieldBase.extend({
    type: "radio_set",
    changeEvent: "change",
    createChildren: function() {
      var opts = this.options.selectOptions;
      var selectOptions = (typeof opts == "function") ? opts.call(this) : opts;
      for (var opt in selectOptions) {
        var fieldId = this.form.name + '_' + this.name + '_' + opt;
        var optionEl = $('<div><input type="radio"/><label for="' + fieldId + '" class="radio_label"></label></div>');
        $(optionEl).find('input').attr({id: fieldId, name: this.name, value: opt});
        $(optionEl).find('label').html(this.options.selectOptions[opt]);
        $(this.el).append(optionEl);
      }
    },
    get: function() {
      return $(this.el).find('input:checked').attr('value');
    },
    set: function(newValue) {
      // Wipe existing selection
      var checkedRadio = $(this.el).find('input:checked').get(0)
      if (checkedRadio) checkedRadio.checked = false;
      // Find the desired new selection. Only set it if it exists
      var radio = $(this.el).find('input[value="'+newValue+'"]').get(0);
      if (radio) radio.checked = true;
    },
    // Override this so that it binds to the child inputs instead of the main el
    bindDOMChangeHandler: function() {
      var field = this;
      var model = this.model;
      var attr = this.options.modelAttribute;
      var attrToSet = {};
      var changeEvent = this.changeEvent || 'change';
      $(field.el).find('input').bind(changeEvent, function() {
        attrToSet[attr] = field.get();
        model.set(attrToSet, {silent: true});
        model.trigger("form_change:"+attr);
        $(this.el).trigger('change'); // fake form change event
      });
    }
  });

  // CheckboxFormField

  Duckbone.CheckboxFormField = Duckbone.FormFieldBase.extend({
    type: "checkbox",
    get: function() {
      return $(this.el).is(':checked');
    },
    set: function(modelValue) {
      $(this.el).attr({checked: modelValue});
    }
  });

  // TextAreaFormField

  Duckbone.TextAreaFormField = Duckbone.FormFieldBase.extend({
    type: "textarea",
    changeEvent: "change"
  });

  // PasswordFormField

  Duckbone.PasswordFormField = Duckbone.FormFieldBase.extend({
    type: "password",
    changeEvent: "change"
  });

  // SubmitFormField
  // Does not extend FormFieldBase since it's not a BindableField

  Duckbone.SubmitFormField = Backbone.View.extend();
  _.extend(Duckbone.SubmitFormField.prototype, Duckbone.BindableField, {
    type: "submit",
    initialize: function() {
      this.form = this.options.form;
      this.name = this.options.name;
      this.spinnerEl = $(this.el).next('img.ajax_loading');
      $(this.el).bind('click', _.bind(this.bindDisableAndSpin, this));
      this.submitForm = (typeof this.options.submitForm == "undefined") ? true : this.options.submitForm;
    },
    bindDisableAndSpin: function(e) {
      e.preventDefault();
      // Don't double up bindings
      this.form.model.unbind('sync:create', this.disableAndSpin);
      this.form.model.unbind('sync:update', this.disableAndSpin);
      // Don't disable and spin until the sync starts
      this.form.model.bind('sync:create', this.disableAndSpin, this);
      this.form.model.bind('sync:update', this.disableAndSpin, this);
      if (this.submitForm) this.form.submit();
    },
    disableAndSpin: function() {
      this.form.model.unbind('sync:create', this.disableAndSpin);
      this.form.model.unbind('sync:update', this.disableAndSpin);
      if (this.spinnerEl) $(this.spinnerEl).fadeIn();
      $(this.el).addClass('loading');
      $(this.el).unbind('click');
      $(this.el).bind('click', this.stealClick);
      this.form.model.bind('sync:complete', this.syncComplete, this);
    },
    stealClick: function(e) {
      // Don't submit again ... we're BUSY!
      e.preventDefault();
      return false;
    },
    syncComplete: function() {
      $(this.el).unbind('click');
      $(this.el).removeClass('loading');
      if (this.spinnerEl) $(this.spinnerEl).fadeOut();
      $(this.el).bind('click', _.bind(this.bindDisableAndSpin, this));
    }

  });

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