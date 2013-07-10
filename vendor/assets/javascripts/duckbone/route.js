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

    resolveViewClass: function() {
      if (typeof this.viewClass == "string") {
        this.viewClass = Duckbone.helpers.stringToGlobal(this.viewClass);
      }
    },
  });

})();

