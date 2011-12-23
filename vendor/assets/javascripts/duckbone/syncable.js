/**
# Duckbone.Syncable

Duckbone's sync method takes the same method signature as Backbone.sync.
It is directly pluggable into any Model or Collection.
Its default behavior is the same as that described in the Backbone documentation at
<http://documentcloud.github.com/backbone/#Sync>.

## Usage

Mix Syncable into any Model or Collection. It will call Syncable.sync
instead of Backbone.sync for all fetch, save, destroy, etc. methods.

### Create Syncable Compatible Controllers

Duckbone.sync provides additional functionality that is necessary to
properly couple a client-side application to a set of JSON-centric Rails controllers.
To implement this pattern, craft the application's controllers as follows.

- Call `respond_to :json` in the controller, and avoid mixing html and json responses in one controller.
- Respond to GET/index actions with an array of JSONified models.
- Respond to GET/show actions with a single JSON object.
  Set the Backbone.Model's `paramRoot` if you prefer to use a JSON root attribute.
- Respond to successful POST/create and PUT/update actions with the single JSONified model.
- Respond to invalid POST/create and PUT/update actions with a 422 (Unprocessable Entity)
  in the header and the model's errors JSONified in the body.
- Respond to valid DELETE/destroy actions with status 202 (No Content)
- Respond to invalid DELETE/destroy actions with status 422 (Unprocessable Entity)
- Respond to all "not found" errors with status 404
- There is no need to write new or edit actions

For example:

    def update
      @goal = goals.find(params[:id])
      if @goal.update_attributes(params[:goal])
        render :json => @goal
      else
        render :json => {:errors => @goal.errors},
          :status => :unprocessable_entity
      end
    end


### CSRF Codes

Syncable will automatically insert the page's CSRF code into every ajax request.
Be sure that they are present in the page head metadata.

### Server Errors

Syncable will trigger the following events on the top level Duckbone object
whenever server errors happen during sync.
This enables disparate parts of the application to respond to potentially fatal errors.
Any response status greater than or equal to 400 will trigger an error event.
These include:

- 'sync:400' - triggered on 400 error
- 'sync:404' - triggered on 404 not found
- 'sync:500' - triggered on 500 server error

### Ajax Request Events

While Backbone supports jQuery's well known `success` and `error` callbacks,
by themselves these are frequently inadequate for the range of functionality
that must respond to model sync behavior. Syncable uses jQuery promises on
ajax calls to bind all additional behavior. This technique is usually preferred
over the use of the success and error callbacks. Other Duckbone mixins,
notably EditableView, rely heavily on model sync events to bind complex behavior.
The following events are available on all Syncable models and collections:

- 'sync:create' - triggered at the start of a create request
- 'sync:read' - triggered at the start of a read request
- 'sync:update' - triggered at the start of an update request
- 'sync:destroy' - triggered at the start of a destroy request
- 'sync:complete' - triggered at the completion of any request
- 'sync:invalid' - triggered when a request returns invalid (422)
- 'sync:error' - triggered when a request returns an error (ie 404, 500)

### URLs and Customizing Calls

The URL that will be called follows the following order of precedence:

1. The url passed to sync() in the options object
2. The url property or function on the model
3. A url derived from the urlRoot property on the model
4. A url derived from the url of the collection including the model

Note that Duckbone.ModelHelpers improves Backbone.Model's implementation of
urlRoot so that it can also be specified as a function that returns the url root.

### A Note on Security

Many client-side security issues can result from Rails' default behavior
in which JSON serialization of models is completely unconstrained.
Take care to only include information in JSON data that the current user
should have access to. Consider overriding ActiveRecord::Base's as_json()
so that it will either blow up or emit nothing without explicit work by the developer.
*/

(function() {

  Duckbone.Syncable = {

    // #### property isSyncable
    // Identifies a Model or Collection that has Syncable mixed in.
    isSyncable: true,

    // #### function sync(method, model, [options])
    // - method – the CRUD method ("create", "read", "update", or "delete")
    // - model – the model to be saved (or collection to be read)
    // - options – success and error callbacks, and all other jQuery request options
    // - returns - the jqXHR object of the request
    sync: function(method, model, options) {
      var jqXHR;
      var type = methodMap[method];

      // A model may provide a defaultSyncOptions property which is merged into the
      // jQuery request before the call-time options
      var defaultSyncOptions = model.defaultSyncOptions || {};

      // Default JSON-request options.
      var params = _.extend({
        type: type,
        dataType: 'json',
        beforeSend: function( xhr ) {
          var token = $('meta[name="csrf-token"]').attr('content');
          if (token) xhr.setRequestHeader('X-CSRF-Token', token);
        }
      }, defaultSyncOptions, options);

      // workaround IE's aggressive caching of JSON
      if ($.browser.msie) params.cache = false;

      // Ensure URL, and then append .json to it
      if (!params.url) {
        params.url = getUrl(model) || urlError();
      }

      // Ensure that we have the appropriate request data.
      if (!params.data && model && (method == 'create' || method == 'update')) {
        params.contentType = 'application/json';
        var data = {}
        if(model.paramRoot) {
          data[model.paramRoot] = model.toJSON();
        } else {
          data = model.toJSON();
        }
        params.data = JSON.stringify(data)
      }

      // Don't process data on a non-GET request.
      if (params.type !== 'GET') {
        params.processData = false;
      }

      // Add the user credentials if HTTP Auth is used
      if (authenticatedUser.username) {
        params.username = authenticatedUser.username;
        params.password = authenticatedUser.password;
        params.headers = params.headers || {};
        params.headers['Authorization'] = 'Basic ' + encode64(params.username+':'+params.password);
      }

      // Make the request.
      jqXHR = $.ajax(params);

      // Attach the params that were used to make testing easier
      jqXHR.params = params;

      // When it starts, trigger one of the crud events
      // sync:create, sync:read, sync:update, sync:delete
      model.trigger('sync:'+method.toLowerCase());

      // Trigger sync:complete when it's done regardless of outcome
      jqXHR.complete(function(response) {
        model.trigger('sync:complete', jqXHR);
      });

      // When a model is saved, trigger 'sync:success'
      // It will be added to its destinationCollection if it's not already
      jqXHR.success(function(response) {
        delete model.errors;
        model.trigger('sync:success', jqXHR);
      });

      // Broadcast errors to the whole application
      jqXHR.error(function(response) {
        if (response.status >= 400) {
          Duckbone.trigger('sync:'+response.status, jqXHR);
        }
      });

      // Bind an additional callback to set error messages on the model
      jqXHR.error(function(response, condition) {
        if (response.status == 422) {
          var data = JSON.parse(response.responseText);
          if (data.errors) {
            model.errors = data.errors;
          } else {
            model.errors = data;
          }
          model.trigger('sync:invalid', jqXHR);
        } else {
          model.trigger('sync:error', jqXHR);
        }
      });

      return jqXHR;
    }

  };

  // ### HTTP Authentication
  // These methods enable all SyncableModels to use HTTP Authentication.

  // #### setAuthenticatedUser
  // - username - HTTP Auth username
  // - password - HTTP Auth password
  //
  // Call this function with the user's credentials.
  // All subsequent requests will be signed by this user.
  Duckbone.setAuthenticatedUser = function(username, password) {
    authenticatedUser.username = username;
    authenticatedUser.password = password;
  },

  // #### removeAuthenticatedUser
  // Clear the user's credentials.
  Duckbone.removeAuthenticatedUser = function() {
    delete authenticatedUser.username;
    delete authenticatedUser.password;
  }

  // Singleton authenticatedUser which holds the credentials inside this closure
  var authenticatedUser = {};

  // Backbone internal functions used by sync ported here

  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read'  : 'GET'
  };

  function getUrl(object) {
    if (!(object && object.url)) return null;
    return _.isFunction(object.url) ? object.url() : object.url;
  }

  function urlError() {
    throw new Error("A 'url' property or function must be specified");
  }

  // Base 64 Encoder used by Basic Auth. Thank you internet.
  function encode64(input) {
    var keyStr = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" +
                 "ghijklmnopqrstuv" + "wxyz0123456789+/" + "=";
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;
    do {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output +
      keyStr.charAt(enc1) +
      keyStr.charAt(enc2) +
      keyStr.charAt(enc3) +
      keyStr.charAt(enc4);
      chr1 = chr2 = chr3 = "";
      enc1 = enc2 = enc3 = enc4 = "";
    } while (i < input.length);
    return output;
  }

}).call(this);