/**

This file contains two model mixins, Duckbone.AssociableModel, and Duckbone.ModelHelpers.
Typically both will be mixed into an application's base model class. Adding them directly
to Backbone.Model will also work, but is perhaps less tidy.

# Duckbone.AssociableModel

Backbone deliberately provides the flexibility for the developer to manage associated models and
collections in any way that makes sense for the application. This flexibility is the
cause of much confusion among beginning developers, and so Duckbone provides this
straightforward framework for managing Rails-like associations.

The simple philosphy behind AssociableModel is that nested objects within JSON data
(or model attributes) are transformed into fully fledged Backbone Models or Collections.
These exists as properties on the original model, in an analagous way to
`has_one` and `has_many` relationships in Rails.

In addition, further changes to those nested attributes result in changes to the associations.
But this relationship is a one way street. Once the attribute data is used to create associated
models, it is removed from the attributes. So changes to associated models are never reflected
in the attributes of the original model.

There is a clear logic behind this approach:

- It is almost always more efficient to serve serialized associations together
  in a single large JSON response.
- Saving back to the server is best done one model at a time. Other strategies involving
  `accepts_nested_attributes_for` or other ad hoc solutions are inefficient and painful.
- The Duckbone templating system does not require associations to be serialized again
  into a monolithic object, as many other templating engines do. Handlebars simply walks
  the path from one model to another as desired.
- Packing models with associations back into monolithic objects is highly prone to problematic
  circular references, and so this is simply avoided.

## Usage

AssociableModel can be mixed into all models and collections that require it,
or extend Backbone.Model and Backbone.Collection themselves if desired.

The `hasOne` and `hasMany` methods take objects from the model's attributes and
move them into a newly created model. This associated model becomes a property on the original
model object, and its name is transformed from rails_underscores to camelCase.

In almost all cases, these functions will be called from the model's initialize method.

### Syntax

Several associations can be created in each call to hasOne or hasMany. A single object is passed.
Each key in the object defines the association name.

In a call to `hasOne`, the `model` key indicates the class of the associated model.
In a call to `hasMany`, the `collection` key indicates the class of the associated collection.

If a reciprocal link is desired on the association, then the `belongsTo` key is set to the name
of the reciprocal association link.

For example:

    var BlogPost = Backbone.Model.extend({
      initialize: function() {
        this.hasOne({
          author: { model: Author },
          main_photo: { model: Photo, belongsTo: 'post' },
        });
        this.hasMany({
          comments: {
            collection: CommentsCollection,
            belongsTo: 'post' }
        });
      }
    });

In use:

    var myPost = new BlogPost({
      headline: "An Evolutionary Basis for Procrastination",
      author: {
        name: "Phillip P. Perkins, MD"
      },
      main_photo: {
        url: "http://www.example.com/sdkjh3987.jpg"
      },
      comments: [
        { user: "username1", body: "Great article!" },
        { user: "username1", body: "Waste of time!" }
      ]
    });

    myPost.get('headline') => "Scientists..."
    myPost.mainPhoto.get('url') => "http://..."
    myPost.mainPhoto.post === myPost => true
    myPost.author.get('name') => "Phillip..."
    myPost.comments.first().get('user') => "username1"
    myPost.comments.first().post === myPost => true
    etc.

### Has One Behavior

When a hasOne association is initially created, the following occurs:

- The created association name is the attribute key transformed into camelCase.
- If there is no data for the association, then a new model is not created, and the association
  is set to null.
- If there is association data in the attribute, then a new Backbone Model is created with that data.
- The original association attribute data is deleted.
- A setter function is created on the model, named "set[association name]", which should be used
  for subsequent reassignments.

When the attribute used to create the association is set again, then the association setter is called instead.

When the setter function is called, the following occurs:

- If a Backbone.Model is passed to the setter, then it replaces the association. Appropriate _add_ and
  _remove_ events are generated. For example, if `setAuthor` is called, then an _add:author_ event will be triggered.
- If an attributes object is passed to the setter, then those attributes are set on the association instead.
  If this results in a model change, then a _change_ event will be triggered, ie _change:author_.
- If the setter is called without arguments, then the association is removed, a _remove_ event triggered,
  and the property set to null.

If a belongsTo relationship is specified:

- The association _must_ also define a hasOne relationship if a belongsTo link is desired.
- A reciprocal link is created on the association back to the original model

### Has Many Behavior

When a hasMany association is initially created:

- The created association name is the attribute key transformed into camelCase.
- A new collection is created of the desired class.
- If there is association data in the attribute, then a set of new models will be added to the collection.

When the original attribute is set again (ie from a call to `model.fetch()`), then the following occurs:

- If the associated collection is a standard Backbone.Collection, then `reset()` is called with the new data.
- If the associated collection has Duckbone.CollectionHelpers included, then `freshen()` will be called instead.
  This method results in the same final state of the collection, except that a number of _add_,
  _change_, and _remove_ events are triggered instead of _reset_. Previously existing models are simply
  updated, instead of being blown away by `reset()`.

If a belongsTo relationship is specified:

- The association _must_ also define a hasOne relationship if a belongsTo link is desired.
- A reciprocal link is created on the associated collection back to the original model.
- A reciprocal link is also created on each model in the associated collection back to the original model.

### Special Cases

If the desired association should have a different name from that naturally occuring in the JSON,
then the model's `parse` method can be overridden to move that attribute.

In the event that the developer absolutely must package associations back together as JSON to save
to the server, then the model's `toJSON` method can be overridden to add the association back
into the JSON.

*/

(function(){

  Duckbone.AssociableModel = {

    // ### Mixin

    // #### property isAssociableModel
    // Indicates a class with AssociableModel included
    isAssociableModel: true,

    // #### function included
    // Creates a new set function that manages the movement of attributes to associated models.
    included: function() {
      if (!this.setWithoutAssociations) {
        this.setWithoutAssociations = this.set
        this.set = setWithAssociations;
      }
    },

    // ### Association Methods

    // #### function hasOne
    // - assocs - an object describing the associations, as described above
    // - returns - nothing
    //
    // Creates a number of given hasOne associations on the model.
    // Each association will be a new Backbone.Model.
    hasOne: function(assocs) {
      _.each(assocs, function(assoc, key) {
        this._associations = this._associations || {};
        this._associations[key] = "hasOne";
        createHasOneAssociation(this, key, assoc['model'], assoc['belongsTo']);
      }, this);
    },

    // #### function hasMany
    // - assocs - an object describing the associations, as described above
    // - returns - nothing
    //
    // Creates a number of given hasMany associations on the model.
    // Each association will be a new Backbone.Collection.
    hasMany: function(assocs) {
      _.each(assocs, function(assoc, key) {
        this._associations = this._associations || {};
        this._associations[key] = "hasMany";
        createHasManyAssociation(this, key, assoc['collection'], assoc['belongsTo']);
      }, this);
    },

    // #### function cloneWithAssociations
    // Returns a clone of this model that also includes references to its associations.
    // If present, this function is used by `FormView.cloneModelForEditing`.
    // Note that the associations themselves are copied, not cloned.
    cloneWithAssociations: function() {
      var dolly = this.clone();
      _.each(this._associations, function(assocType, assocKey) {
        var camelKey = underToCamel(assocKey);
        dolly[camelKey] = this[camelKey];
      }, this);
      return dolly;
    }
  };

  /**
  # Duckbone.ModelHelpers

  This set of helpers provides conveniences for many common situations not already
  covered by Backbone.Model.
  */

  Duckbone.ModelHelpers = {

    // #### function simpleSave
    // - attrs - The attributes to be saved to the server.
    // - returns - the jqXHR object
    //
    // Posts only the given data to the server, leaving existing model attributes unchanged.
    simpleSave: function(attrs) {
      var data = {}
      if (this.id) attrs.id = this.id;
      if(this.paramRoot) {
        data[this.paramRoot] = attrs;
      } else {
        data = attrs;
      }
      var json = JSON.stringify(data);
      return this.save({}, {
        contentType: 'application/json',
        data: json
      });
    },

    // #### function url
    // Overrides Backbone's default url method with a new version that respects a function-style `urlRoot`
    url : function() {
      var urlRoot = (typeof this.urlRoot == 'function') ? this.urlRoot() : this.urlRoot;
      var base = getUrl(this.collection) || urlRoot || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // #### function setOne
    // - attr - the attribute to set
    // - val - the new value
    // - options - same options as for set, ie. `{silent: true}`
    //
    // Sets a single attribute on the model.
    setOne: function(attr, val, options) {
      var attrs = {};
      attrs[attr] = val;
      return this.set(attrs, options);
    },

    // #### function createGetters
    // - Each string in the argument list creates a getter function for that attribute key.
    //
    // Creates simple getter functions for all desired attributes.
    // Getters are renamed in js syntax, so for example: `image_asset_url` becomes `getImageAssetUrl`.
    createGetters: function() {
      var model = this;
      var getterList = arguments;
      var getterFunctions = {};
      _.each(getterList, function(getter) {
        getterFuncName = underToCamel(getter);
        getterFuncName = 'get' + upCaseFirstChar(getterFuncName);
        if (!model[getterFuncName]) {
          getterFunctions[getterFuncName] = function() { return this.get(getter); }
        }
      });
      _.extend(this, getterFunctions);
    },

    // #### function isValidAttribute
    // Determines if an attribute is valid to set, avoiding setting attributes to NaN or undefined.
    // In almost all cases, better compatibility with Rails will be achieved by setting attributes
    // to null instead.
    isValidAttribute: function(val) {
      return (!_.isNaN(val) && !_.isUndefined(val))
    }
  };

  // ### Internal functions

  // Do the work of creating a hasOne association
  function createHasOneAssociation(model, key, modelClass, belongsTo) {
    var setterName = underToCamel('set_'+key);
    var relName = underToCamel(key);
    var setter = function(assocModel, settingUp) { // create the setter
      if (assocModel instanceof Backbone.Model) { // Model case
        if (assocModel === model[relName]) return assocModel; // return if same
        if (model[relName]) {
          model.trigger('remove:'+relName); // trigger if something is removed
          if (belongsTo) model[relName][belongsTo] = null; // delete reciprocal
        }
        model[relName] = assocModel; // set new associated model
        if (belongsTo) callReciprocalSetter(model, model[relName], belongsTo, settingUp);
        model.trigger('add:'+relName);
      } else if (assocModel) { // Attributes Object case
        if (model[relName]) { // Existing model case
          var bubbleChange = function() {
            model.trigger('change:'+relName); // trigger change only if it changes
          };
          model[relName].bind('change', bubbleChange);
          model[relName].set(assocModel); // set new attributes on the association
          model[relName].unbind('change', bubbleChange);
        } else { // New model case
          model[relName] = new modelClass(assocModel); // create the model with the new attributes
          if (belongsTo) callReciprocalSetter(model, model[relName], belongsTo, settingUp);
          model.trigger('add:'+relName);
        }
      } else { // Null case, remove association
        if (model[relName]) { // existing model case
          model.trigger('remove:'+relName);
          if (belongsTo) model[relName][belongsTo] = null; // destroy reciprocal association
        }
        model[relName] = null; // destroy association
      }
      // bind to destroy
      if (model[relName]) {
        model[relName].bind('destroy', function() { setter.call(model); });
      }
      return assocModel;
    } // end setter
    try {
      setter.call(model, model.get(key), true); // call the setter to initialize
    } catch(e) {
      throw('Error creating association for ' + key + ':\n' + e);
    }
    delete model.attributes[key]; // remove associations data from attributes
    model[setterName] = _.bind(setter, model); // bind setter to model
  }

  // Do the work of creating a hasMany association
  function createHasManyAssociation (model, key, assoc, belongsTo) {
    try {
      var relName = underToCamel(key);
      var relData = model.get(key);
      var collection = model[relName] = new assoc(relData); // create the collection
      delete model.attributes[key]; // delete the association data from attributes
      if (belongsTo) {
        collection[belongsTo] = model; // create reciprocal link
        collection.each(function(m) { // create reciprocal link on all models
          callReciprocalSetter(model, m, belongsTo);
        });
        collection.bind('add', function (m) { // on add(), also give new models reciprocal links
          callReciprocalSetter(model, m, belongsTo);
        });
        collection.bind('remove', function (m) { // on remove(), remove reciprocal links
          m[belongsTo] = null;
        });
        collection.bind('reset', function(c) { // on reset(), give all new models reciprocal links
          c.each(function(m) {
            callReciprocalSetter(model, m, belongsTo);
          });
        });
      }
    } catch (e) {
      throw('Error creating association for ' + key + ':\n' + e);
    }
  }

  // Call the setter on a reciprocal association to establish the belongsTo
  function callReciprocalSetter(model, assocModel, belongsTo, settingUp) {
    var setterName = 'set' + belongsTo.slice(0, 1).toUpperCase() + belongsTo.slice(1);
    if (typeof assocModel[setterName] == "function") {
      assocModel[setterName].call(assocModel, model, settingUp);
    } else if (settingUp) {
      assocModel[belongsTo] = model;
    } else { // Complain if a hasOne association has not been defined for the reciprocal link
      _.log("Model:");
      _.log(assocModel);
      throw('To use belongsTo, model must define hasOne for ' + belongsTo);
    }
  }

  // Replacement function for `Model.set` that also manages setting to associations.
  function setWithAssociations(attrs, options) {
    var nonAssocAttrs = {};
    if (attrs instanceof Backbone.Model || !this._associations) {
      nonAssocAttrs = attrs;
    } else {
      _(attrs).each(function(v, k) {
        var assocType = this._associations[k];
        if (assocType == "hasOne") {
          var setterName = underToCamel('set_' + k);
          this[setterName](v);
        } else if (assocType == "hasMany") {
          var relName = underToCamel(k);
          if (typeof this[relName].freshen == "function") {
            this[relName].freshen(v);
          } else {
            this[relName].reset(v);
          }
        } else {
          nonAssocAttrs[k] = v;
        }
      }, this);
    }
    return this.setWithoutAssociations.call(this, nonAssocAttrs, options);
  }

  // Convert `a_rails_var` to `aJavaScriptVar`
  function underToCamel(word) {
    return word.replace(/(\_[a-z])/g, function($1) {
      return $1.toUpperCase().replace('_','');
    });
  }

  // Capitalize the first character
  function upCaseFirstChar(word) {
    return word.replace(/^\w/, function($0) {
      return $0.toUpperCase();
    });
  }

  // Get a URL from a Model or Collection as a property or as a function.
  var getUrl = function(object) {
    if (!(object && object.url)) return null;
    return _.isFunction(object.url) ? object.url() : object.url;
  };

}).call(this);
