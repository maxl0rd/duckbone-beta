// Route
// =====
//
// A route object is passed to a RouteableApplication's `mapRoutes` method,
// defining the routeAction that is taken when a route is triggered.
//
// An implicit Route instance is created for views that are directly routed.
//
// The current route instance is always available at the global `Duckbone.route`.

(function() {

  Duckbone.Route = function(options) {
    _.extend(this, options);
    this.resolveViewClass();
  };

  Duckbone.Route.extend = Backbone.Router.extend;

  _.extend(Duckbone.Route.prototype, Backbone.Events, {

    isRoute: true,

    // Call routeAction, with the encoded query params in the final argument expanded into an object.

    routeActionWithQueryParams: function() {
      var args = _.toArray(arguments);
      var params = args.pop();
      var paramsObject = _(params.split('&')).reduce(function(memo, pair) {
        memo[pair.split('=')[0]] = pair.split('=')[1]; return memo;
      }, {});
      return this.routeAction.apply(this, args.concat(paramsObject));
    },

    routeAction: function() {
      throw('Abstract method routeAction called. Route subclass should define own routeAction.');
    },

    loadView: function(options) {
      this.application.loadView(this.viewClass, options);
    },

    fetchCollectionWithParams: function(collection, params, options) {
      collection.params = collection.params || {page: 1};
      _.extend(collection.params, params);
      return collection.fetch(options);
    },

    resolveViewClass: function() {
      if (typeof this.viewClass == "string") {
        this.viewClass = Duckbone.helpers.stringToGlobal(this.viewClass);
      }
    },
  });

})();

