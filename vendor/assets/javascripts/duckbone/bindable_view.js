// BindableView
// =====================
//
// This mixin enables any view to selectively data-bind to changes in the model.
// Many developers prefer this approach over re-rendering an entire view on each model
// change event.
//
// ## Usage
//
// Mix Duckbone.BindableView into any View that needs to use declarative data-binding
// to model attributes.
//
// ### Data Binding
//
// Data bindings should be defined in the `attributeChanges` object. The binding value
// can be a string selector, in which case the html of that selector is replaced with
// the model value. It can also be a callback function, which is simply executed,
// in the context of the view. For example:
//
//     attributeChanges: {
//       'attribute': 'span.attribute',
//       'title': 'div.title',
//       'amount': function(val) {
//         $(this.el).find('span.amount').html('$'+val);
//       }
//     }
//
// BindableView also mixes in Duckbone.ViewlifecycleExtensions to assist in creating
// and tearing down bindings. If you are using the lifecycle, then bindings will be
// created and destroyed for you. If not, call `bindAttributes()` in the view's
// initialize method to establish the bindings. And call `removeWeakBindings()` in the
// view's remove() method.
//
// ### Weak Binding
//
// BindableView uses "weak bindings" which are intended to be unbound when the view is
// removed. This prevents zombie callbacks from wreaking havoc as a model gets passed from
// view to view. All of the bindings defined in `attributeChanges` use weak binding.

(function(){

  Duckbone.BindableView = {

    // ### Mixin

    // #### property isBindableView
    // Identifies a view that has BindableView mixed in.
    isBindableView: true,

    // #### function included
    // Also mix in Duckbone.ViewLifecycleExtensions
    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
    },

    // #### function bindAttributes
    // - model - the model to bind to, defaulting to `this.model`
    // - returns - nothing
    //
    // Establishes the bindings declared in `this.attributeChanges`.
    bindAttributes: function(model) {
      if (!this.attributeChanges) return;
      model = model || this.model || new Backbone.Model();
      for (var attr in this.attributeChanges) {
        this.bindAttribute(model, attr, this.attributeChanges[attr]);
      }
    },

    // #### function bindAttribute
    // - model - the model to bind to, defaulting to `this.model`
    // - attr - the model attribute to bind to
    // - binding - the jQuery selector or binding callback
    // - returns - nothing
    //
    // Bind a single attribute to the supplied model.
    // The binding param can either be a string selector,
    // in which case the html of that selector is replaced with the model value
    // or a callback function, which is simply executed, in the context of the view.
    // If the view is already rendered, then initial values will be set
    // to the current state of the model at the time of this call.
    bindAttribute: function(model, attr, binding) {
      // Get model
      model = model || this.model || new Backbone.Model();
      var attrValue = Handlebars.Utils.escapeExpression(model.get(attr));
      var handler;
      if (typeof binding == "function") {
        // The binding is a callback function. Set value now.
        binding.call(this, attrValue);
        handler = function() {
          binding.call(this, Handlebars.Utils.escapeExpression(model.get(attr)));
        }
      } else if (typeof binding == "string") {
        // The binding is a selector. Set value now.
        $(this.el).find(binding).html(attrValue);
        handler = function () {
          $(this.el).find(binding).html(Handlebars.Utils.escapeExpression(model.get(attr)));
        }
      }
      this._attributeBindings = this._attributeBindings || [];
      var e = 'change:'+attr;
      this._attributeBindings.push([model, e, handler]);
      this.weakBindTo(model, e, handler, this);
    },

    // #### function unbindAttributes
    // Unbind all previously-bound attributes.  Used internally to clean up for
    // re-rendering a template
    unbindAttributes: function() {
      if (this._attributeBindings) {
        _(this._attributeBindings).each(function(binding) {
          // There is no individual unbind for weakBindings.  The housekeeping
          // to clean up the metadata would be more expensive than attempting
          // to unbind all at teardown for most use cases, so we just do a raw
          // unbind.
          binding[0].unbind(binding[1], binding[2]);
        });
        delete this._attributeBindings;
      }
    },

    // #### function bindLiveTimestamps
    // - seconds - number of seconds to wait before updating again
    // - returns - nothing
    //
    // If you are using the {{live_timestamp}} helper, then call this function
    // to begin updating those timestamps once per minute.
    bindLiveTimestamps: function(seconds) {
      seconds = seconds || 60;
      var updateTimestamps = _.bind(function() {
        $(this.el).find('span[data-live-timestamp]').each(_.bind(function(i, span) {
          var millis = parseInt($(span).attr('data-live-timestamp'));
          var pretty = Duckbone.helpers.dateToPrettyTimeAgo(new Date(millis));
          $(span).html(pretty);
        }, this))
      }, this);
      updateTimestamps();
      this._updateLiveTimeStampsInterval = setInterval(updateTimestamps, seconds * 1000);
    },

    // #### unbindLiveTimestamps
    // Stop updating timestamps.
    unbindLiveTimestamps: function() {
      clearInterval(this._updateLiveTimeStampsInterval);
    }

  };

  // #### helper {{live\_timestamp}}
  // Creates a partial that can be used to insert a live timestamp.
  // Bindable view can use this to update it once per minute.
  // The timestamp must be in a format natively parseable by Date.
  // usage {{live_timestamp "created_at"}}
  if (Handlebars) {
    Handlebars.registerHelper("live_timestamp", function(timestamp) {
      var stamp = Duckbone.Handlebars.getAttr(this, timestamp);
      if (!stamp) return "";
      var date = new Date(stamp);
      if (!date) return "";
      return new Handlebars.SafeString(
        '<span data-live-timestamp="' + date.getTime() + '">' +
        Duckbone.helpers.dateToPrettyTimeAgo(date) + '</span>'
      );
    });
  }

}).call(this);