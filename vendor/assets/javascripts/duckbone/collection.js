/**
# Duckbone.CollectionHelpers

Provides miscellaneous additions to Backbone.Collection that are
useful in Duckbone.

## Usage

Mix Duckbone.CollectionHelpers into `Backbone.Collection.prototype` or
extend Backbone.Collection into your own base collection class. For example:

    var myapp.Collection = Backbone.Collection.extend();
    Duckbone.include(myapp.Collection, Duckbone.CollectionHelpers);

*/

(function() {

  Duckbone.CollectionHelpers = {

    // #### property hasDuckboneCollectionHelpers
    // indicates the presence of this mixin
    hasDuckboneCollectionHelpers: true,

    // #### function slice
    // - offset - the first arg is the 0-index offset into the ordered collection
    // - length - the second arg is the number of models to return, defaulting to
    //            the rest of the collection after the slice point
    // - returns - an array
    //
    // Returns an array that is a subset of the collection's models.
    // Uses the same method signature as `Array.slice`
    slice: function() {
      return this.models.slice(arguments);
    },

    // #### function toSelectOptions
    // - attr - the model attribute to use for the select option html, defaults to "title"
    // - empty - show an empty slot first
    // - returns - an Object
    //
    // Returns an object suitable for passing to a select or radio field's selectOptions.
    toSelectOptions: function(attr, empty) {
      var options = {};
      attr = attr || 'title';
      if (empty) options[' '] = ' '
      this.each(function(m) {
        options[m.id] = m.get(attr);
      });
      return options;
    },

    // Take an array of raw objects
    // If the ID matches a model in the collection, set that model
    // If the ID is not found in the collection, add it
    // If a model in the collection is no longer available, remove it

    freshen: function(objects) {
      var model;
      // Mark all for removal
      this.each(function(m) {
        m._remove = true;
      });
      // Apply each object
      _(objects).each(function(attrs) {
        model = this.get(attrs.id);
        if (model) {
          model.set(attrs); // existing model
          delete model._remove
        } else {
          this.add(attrs); // new model
        }
      }, this);
      // Now check for any that are still marked for removal
      var toRemove = this.filter(function(m) {
        return m._remove;
      })
      _(toRemove).each(function(m) {
        this.remove(m);
      }, this);
      this.trigger('freshen', this);
    },

    // Override Backbone's fetch method to add 'freshen' capability.
    // just pass freshen: true to non-destructively update a collection from
    // the server
    fetch: function(options) {
      options || (options = {});
      var collection = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        collection[options.add ? 'add' : (options.freshen ? 'freshen' : 'reset')](collection.parse(resp, xhr), options);
        if (success) success(collection, resp);
      };
      var error = options.error;
      options.error = function(resp) {
        if (error) {
          error(collection, resp, options);
        } else {
          collection.trigger('error', collection, resp, options)
        }
      }

      return (this.sync || Backbone.sync).call(this, 'read', this, options);
    }
  }

}).call(this);