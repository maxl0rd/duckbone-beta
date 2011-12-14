/**
# Duckbone.EditableView

This module can be added to any view that contains form elements.
It will take over the form found in its template and all of its fields,
providing most of the functionality that is needed for taking and saving user input.

## Usage

To use EditableView, take the following steps:

- Include Duckbone.Syncable in the model you are editing, either directly or through a base class.
- Use the supplied Handlebars helpers to add form fields to your template.
- Add a "fields" object to your view to define the form's behavior.
- The `initialize()` method provided by Duckbone.ViewLifecycleExtensions will take care of the rest of form setup.
- Provide additional functionality in the `afterInitialize()` method

### Defining Fields

The `fields` object is made up of keys that map to fields in your form.
The key of each field should be identical to the `name` attribute in the field DOM element.
The provided Handlebars form field helpers use this convention.

There are some standard attributes that can be added to all fields:

- `modelAttribute` - this indicates which attribute of the model this field binds to.
  It defaults to the same as the form field name, so it is best to map field names exactly
  to attribute names if possible.
- `elAttributes` - a set of html attributes that will be added to the field,
  ie. size, maxLength, placeholder, rows, cols, etc.
- `validate` - a string representing one of the validators,
  ie. 'email', 'phone', etc.
- `validate` - or a callback function returning a boolean indicating field validity
- `required` - validates that content was entered into the field

Additionally, some fields take special options. Select and Radio Set fields accept:

- `selectOptions` - an object representing ids and values of the selection options
- `selectOptions` - or a function that returns the above object

A Submit Button accepts:

- `submitForm` - a boolean that determines whether the submit button automatically
  submits the form or not. The developer may deactivate this and bind his own behavior.

### The Form Manager

The EditableView's default initializer calls `Duckbone.EditableView.createForm()` which
creates the FormManager object, `this.form`, on the view. The FormManager creates views
for each form field, and binds all event behaviors. The developer may interact with each
field individually by calling `this.form.getField("field_name")`.

### Form Binding Behavior

Each form field will automatically bind changes on itself to its model. This behavior is
defined by each form field type, and implemented by Duckbone.BindableField.

Each field will also bind its validation check, if defined. This behavior is defined on
all form field types, and implemented by Duckbone.ValidateableField.

Form submission events are captured by the EditableView's FormManager,
and `Duckbone.FormManager.submit()` is called instead. This method will first ensure that
the form is valid, and then save the model. Otherwise, invalid fields will show their errors.

To define alternate behavior on form submission, it is simplest to simply omit any submit buttons
inside the form itself, and bind form submission to another button defined outside of the form itself.

### Default Model Sync Behavior

Be default, the following events trigger these behaviors on the form:

- _form submit_ - Validations are run, and if the form is valid, `model.save()` is called
- _model sync:create_ - All validation errors are cleared
- _model sync:update_ - All validation errors are cleared
- _model sync:invalid_ - The errors object in the response is inspected and
  errors are displayed on all invalid fields
- _model sync:success_ - No default operation. The user should bind appropriate behavior,
  ie. providing feedback or navigating to the next page.

### Defining Additional Model Sync Behavior

Create a `modelSyncEvents` object, in which the keys are model events, and the values
string names of methods on the view. The callbacks will be run in the context of the view.

If you wish to redefine default behavior, the easiest approach is to
override `defaultModelSyncSavingHandler` or `defaultModelSyncInvalidHandler`.

### Cloning Models

Editable view clones the given model to create a scratch model to work with in the form.
When the model is saved, then all attributes from the scratch model are copied back to
the original model. The approach has a number of advantages:

- The original model does not change until the form is completed
- The original model is not changed if a form is abandoned
- All event handlers are bound to the clone and do not need to be cleaned up
- Temporary form values do not need to persist on the original model

This clone is created by `cloneModelForEditing()` in the default initializer created by
ViewLifecycleExtensions. If you are not using the lifecycle for some reason, then call this
method by hand.

If a model has additional properties or associations that are necessary for the form to function,
then the developer should override the model's `clone()` method so that it creates a clone with
the desired properties.

### After Save Destination

When the EditableView's model is successfully saved, the original model can be assigned to
an afterSaveDestination. The model can be added to a collection, or set as a property on another model.
Define the view's `afterSaveDestination` property as an object in which the key is either
`collection` or `model`. If it is a model, also define the `association` key with the value the
string name of the property. If there are multiple after save destinations, then an array of these
objects may also be given.

Usage examples:

    view.afterSaveDestination = {
      collection: myCollectionObject
    };
    view.afterSaveDestination = {
      model: myModelObject,
      association: 'propertyName'
    };
    view.afterSaveDestination = [
      {collection: myCollectionObject},
      {model: myModelObject, association: 'propertyName'}
    ];

*/

(function() {

  Duckbone.EditableView = {

    // ### Mixin

    // #### property isEditableView
    // Indicates a view that includes EditableView
    isEditableView: true,

    // #### function included
    // Also includes ViewLifecycleExtensions, which automatically calls several of these
    // methods during the view's initialize and remove
    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
    },

    // ### Form Set Up

    // #### function createForm
    // Accepts the following options:
    //
    // - el -  the form element to use, defaults to the first form element found on the view.
    // - fields - the fields description object, defaults to `this.fields`
    // - model - the model to bind the form to, defaults to `this.model`
    // - returns - the new FormManager
    //
    // This method creates the view's FormManager which builds all of the form field views.
    createForm: function(options) {
      options = options || {};
      var formElement = options.el || $(this.el).find('form').get(0) || $(this.el).get(0);
      var fieldOptions = options.fields || this.fields || this.options.fields;
      var model = options.model || this.model;
      var form = new Duckbone.FormManager({
        el: formElement,
        fields: fieldOptions,
        model: model || new Backbone.Model(),
        view: this
      });
      this.form = this.form || form;
      return form;
    },

    // #### function bindModelSyncEvents
    // Binds the events triggered by a Syncable-enhanced Model to those default
    // behaviors defined below. Additionally binds user defined model sync events,
    // defined on the view's `modelSyncEvents` property.
    bindModelSyncEvents: function() {
      bindEvents(this, defaultModelSyncEvents);
      if (this.modelSyncEvents) bindEvents(this, this.modelSyncEvents);
    },

    // ### Model cloning

    // #### function cloneModelForEditing
    // This function clones the model for the workspace, and binds a handler to copy back
    // attributes to the original model when saved. It also sets up the model's after save destination.
    // After this method has been called, `this.model` refers to the clone, and `this.originalModel`
    // refers to the original model.
    cloneModelForEditing: function() {
      if (!this.model) throw("Found not, has your model been. Cloned, it can not be.");
      this.originalModel = this.model;
      this.model = this.originalModel.clone();
      this.weakBindToModel('sync:success', function() {
        var attrs = _.clone(this.model.attributes);
        _(this.form.fields).each(function(field) {
          if (field.options.temporary) {
            delete attrs[field.modelAttribute];
          }
        });
        this.originalModel.set(attrs);
        copyToDestination.call(this);
      }, this);
    },

    // #### function expireClone
    // The function is called by the ViewLifecycleExtensions when the view's `remove()` method
    // is called. It expires the clone and makes it unusable by replacing its get and set methods.
    // The developer should be careful not to retain references to the model clone after tearing down the
    // EditableView. It also moves the view's model reference to the originalModel, so that it is
    // accessable to any `afterRemove()` callbacks.
    expireClone: function() {
      if (!this.originalModel) return;
      this.model.clear({silent: true});
      var explode = function() {
        throw('Attempted get/set on expired clone from Duckbone.EditableView. Use original model instead.');
      }
      this.model.set = explode;
      this.model.get = explode;
      this.model = this.originalModel;
      delete this.originalModel;
    },

    // #### function resetModel
    // Discards any edits to the clone, and restore its attributes from the original model.
    resetModel: function() {
      if (!this.originalModel) throw("Cloned not, has your model been. Reset, we can not do.")
      this.model.set(this.originalModel.attributes);
    },

    // ### Default Model Sync Handlers
    // These handlers are automatically bound to the model's sync events.

    // #### function defaultModelSyncSavingHandler
    // Called on either a _sync:create_ or _sync:update_ event. The default behavior is
    // to clear all of the validation error notices on the form.
    defaultModelSyncSavingHandler: function(response) {
      $(this.el).find('div.error_banner').hide();
      _.each(this.form.fields, function(field) {
        if (field.isValidateableField) {
          field.clearErrors();
        }
      }, this);
    },

    // #### function defaultModelSyncInvalidHandler
    // Called on a _sync:invalid_ event. The default behavior is to inspect the
    // validation errors on the model, and add error notices to all invalid fields.
    // It also scrolls the page so that the top of the form is visibile,
    // in the event that it contains an error notice bar.
    defaultModelSyncInvalidHandler: function(response) {
      $(this.el).find('div.error_banner').show();
      _.each(this.model.errors, function(error, modelAttribute) {
        var field = this.form.getFieldForModelAttribute(modelAttribute);
        _.each(this.model.errors[modelAttribute], function(error) {
          if (field && field.isValidateableField) {
              field.addError(error);
          } else {
            _.log("Cannot add error for field " + modelAttribute + ": " + error);
          }
        }, this);
      }, this);
      $(this.el).find('div.error_banner').show();
      scrollToTop(this.el);
    },

    // #### function defaultModelSyncSuccessHandler
    // Called on a _sync:success_ event. No operation. Reserved for future use.
    defaultModelSyncSuccessHandler: function(response) {},

    // #### function defaultModelSyncErrorHandler
    // Called on a _sync:error_ event. No operation. Reserved for future use.
    // Note that SyncableModel will also trigger sync error events on the top level
    // Duckbone object so that the entire application may respond to fatal server errors.
    defaultModelSyncErrorHandler: function(response) {},

    // #### function defaultModelSyncCompleteHandler
    // Called on a _sync:complete_ event. No operation. Reserved for future use.
    defaultModelSyncCompleteHandler: function(response) {}

  };

  // ## FormManager
  // The Form Manager creates all of the subviews for each form field and manages their state and validation.
  // Normally this object is not used much in practice, but in a view one can
  // access individual form fields with it like: `this.form.getField('name')`.
  // The developer may also wish to explicitly set() and get() field values at times.

  // #### Constructor
  // Accepts the following options:
  //
  // - el - the DOM element to use, defaulting to the first form element in the view
  // - fields - the fields description object to use
  // - model - the Backbone Model to bind to, defaulting to a new model
  // - view - a reference to the parent view
  Duckbone.FormManager = function(options) {
    this.el = options.el || $('<form action="#"></form>').get(0);
    this.fieldOptions = _.clone(options.fields) || {};
    this.model = options.model || new Backbone.Model({});
    this.view = options.view;
    this.name = $(this.el).attr('name') || 'untitled_form';
    this.createFields();
  };

  // Mix in Backbone.Events
  _.extend(Duckbone.FormManager.prototype, Backbone.Events);

  _.extend(Duckbone.FormManager.prototype, {

    // #### function createFields
    // Create form field views for all those defined in the fields object on the view.
    createFields: function() {
      // Create all of the model fields
      var field, form = this, name;
      for (name in this.fieldOptions) {
        field = this.createField(name, this.fieldOptions[name]);
      }
      // Create the submit button fields
      $(this.el).find('button.form_submit').each(function() {
        name = $(this).attr('name');
        if (!form.fields[name]) {
          field = new Duckbone.forms.fieldTypes['submit']({
            name: name, el: this, form: form
          });
          form.fields[field.name] = field;
        }
      });
      // Assign ids and names to form labels
      $(this.el).find('label').each(function() {
        var name = $(this).attr('data-field-name');
        if (name && form.fields[name]) $(this).attr('for', idFor(form, form.fields[name]));
      });
    },

    // #### function createField
    // - name - the form field name
    // - fieldOptions - the field description object
    // - returns - the newly created form field view
    //
    // Create an individual form field view for the given field name and options.
    // The field type is either determined by the "type" attribute in options,
    // or by a heuristic in looking at the form field class attribute.
    // Fields defined by Duckbone are classed "form_[type]" by the form helpers.
    createField: function(name, fieldOptions) {
      this.fields = this.fields || {};
      var el, formFieldClass, field;
      el = $(this.el).find(selectorFor(name)).get(0);
      if (el) {
        formFieldClass = (fieldOptions['type']) ? Duckbone.forms.fieldTypes[fieldOptions['type']] : getFormFieldClass(el);
        if (formFieldClass) {
          field = new formFieldClass(_.extend(fieldOptions, {el: el, model: this.model, form: this, name: name} ));
          field.name = name;
          $(field.el).attr('id', idFor(this, field));
        } else {
          throw ("Bad form field type " + name);
        }
      } else {
        throw ("Form field " + name + " defined in view, missing in template")
      }
      this.fields[name] = field;
      return field;
    },

    // #### function getField
    // - name - the form field name
    // - returns - the form field view
    //
    // Return a field view from the form for the given name.
    // The developer may then use get() and set() on this field to manipulate its value.
    getField: function(name) {
      return this.fields[name];
    },

    // #### function getFieldForModelAttribute
    // - modelAttibute - the attribute on the model
    // - returns - the form field view bound to the given attribute
    //
    // Return the field view that corresponds to the given model attribute.
    getFieldForModelAttribute: function(modelAttribute) {
      return _.detect(this.fields, function (field) {
        return field.modelAttribute == modelAttribute;
      }, this);
    },

    // #### function validate
    // - returns - a boolean indicating the validity of the form
    //
    // Validate all fields in the form according to their validation rules.
    // After this is called, the view will have a boolean property "isValid"
    validate: function() {
      this.isValid = true
      var fieldValid;
      for (var field in this.fields) {
        fieldValid = this.fields[field].validate ? this.fields[field].validate() : true;
        if (!fieldValid) this.isValid = false;
      }
      return this.isValid;
    },

    // #### function submit
    // - options - An options object for `model.save`
    //
    // Submits the form. First validate() is called on all fields,
    // and then if the form is valid, then the model is saved to the server.
    // The given options object is passed directly to `model.save` and can contain
    // `success` and `error` callbacks. However, these callbacks are deferred one tick
    // so that all of the model sync event handlers have run first, and the callbacks
    // are called subsequent to all default form behaviors.
    submit: function(options) {
      if (this.validate()) {
        options = _.clone(options) || {};
        _.each(['success','error'], function(callbackName) {
          if (typeof options[callbackName] == 'function') {
            var originalCallback = options[callbackName];
            options[callbackName] = function(model, response) {
              _.defer(_.bind(originalCallback, model, model, response));
            }
          }
        }, this);
        this.model.save(null, options);
      } else {
        _.log("Form is invalid.")
        $(this.el).find('div.error_banner').show();
        scrollToTop(this.el);
      }
    }
  });

  // ### Internal Functions

  // Copys the model to the final place it should arrive at once it is saved,
  // as defined by the view's 'afterSaveDestination' property.
  // Called by `EditableView.cloneModelForEditing`.
  var copyToDestination = function() {
    var dests = this.afterSaveDestination || this.options.afterSaveDestination;
    if (!dests) return;
    if (!(dests instanceof Array)) {
      dests = [dests];
    }
    _.each(dests, function(dest) {
      if (dest.collection) {
        dest.collection.add(this.originalModel);
      } else {
        var setterName = 'set' + dest.association.slice(0, 1).toUpperCase() + dest.association.slice(1);
        dest.model[setterName].call(dest.model, this.originalModel);
      }
    }, this);
  };

  // Default model sync events that are bound when bindModelSyncEvents() is called
  var defaultModelSyncEvents = {
    'sync:create': 'defaultModelSyncSavingHandler',
    'sync:update': 'defaultModelSyncSavingHandler',
    'sync:success': 'defaultModelSyncSuccessHandler',
    'sync:invalid': 'defaultModelSyncInvalidHandler',
    'sync:error': 'defaultModelSyncErrorHandler',
    'sync:complete': 'defaultModelSyncCompleteHandler'
  };

  // Binds default events to the model
  function bindEvents(view, events) {
    for (var event in events) {
      var method = view[events[event]];
      if (typeof method == 'function') view.weakBindToModel(event, method, view);
    }
  };

  // Concatenates the form and field names into an id for each form field DOM element
  function idFor(formManager, field) {
    return formManager.name + '_' + field.name;
  };

  // Returns a jQuery selector for the given form field name
  function selectorFor(name) {
    return '[name=' + name + ']';
  };

  // Inspects a DOM element and determines the form field type based upon its class name.
  // The handlebars form helpers insert a class name, ie "form_text" or "form_select"
  function getFormFieldClass(el) {
    var type = /^form_(.*)/.exec($(el).attr('class'))[1];
    return Duckbone.forms.fieldTypes[type];
  }

  // ### Scrolling

  // Time to scroll to the top of the form in milliseconds
  var SCROLL_TIME = 400;
  // Easing function to use
  var SCROLL_EASING = 'swing';
  // Number of pixels above the top of the form element we scroll to
  var SCROLL_BREATHING_ROOM = 100;

  // Smooth scrolls the browser window so that the top of the form is visible.
  // Called when a form is invalid and all errors should be shown.
  function scrollToTop(el) {
    var offset = $(el).offset().top;
    offset = (offset > SCROLL_BREATHING_ROOM) ? offset - SCROLL_BREATHING_ROOM : 0;
    $('html body').animate({ scrollTop: offset }, SCROLL_TIME, SCROLL_EASING);
  }

})();
