// RoutableApplication
// ===================
//
// This mixin adds a page-centric routing system to Backbone's existing URL Router.
// While Backbone's default routing strategy assumes that all route actions will be
// defined on the router itself, RoutableApplication instead delegates its route actions
// to child views that each represent atomic "pages" in the application.
//
// This page-centric concept should be more familiar to Rails developers, and also
// greatly improves code organization for large projects with many separate page views.
//
// The standard Backbone `routes` object is still available, but the developer will likely
// find it confusing to mix the two systems together in practice.
//
// ## Usage
//
// Mix in `Duckbone.RouteableApplication` into your top level application object, which should also
// extend Backbone.Router. Then call `mapRoutes()` in `initialize()`, passing an object that
// represents the routing table. Define the `routeAction` on the view class so that it calls `loadView`
// on itself. For example:
//
//     MyApplication = Backbone.Router.extend({
//       initialize: function() {
//         mapRoutes({
//           '/home':      HomeView,
//           '/posts':     PostsView,
//           '/posts/:id': PostView,
//           '/posts/new': NewPostView
//         });
//       }
//     });
//     Duckbone.include(MyApplication.prototype,
//       Duckbone.RouteableApplication);
//
//     PostView = Backbone.View.extend({
//       initialize: function { ...etc... },
//       render: function() { ...etc... }
//     }, {
//       routeName: 'post',
//       routeAction: function(id, params) {
//         var model = new Post({ id: id });
//         model.fetch({
//           success: function(m) {
//             myapp.loadView(PostView, {model: m});
//           }
//         })
//       }
//     });
//
//     ... etc ...
//
//     $(function() {
//       var myapp = new MyApplication();
//       myapp.setContainer($('#app_container').get(0));
//       Backbone.history.start();
//     });

(function() {

  Duckbone.RouteableApplication = {

    // ### Mixin
    // Indicates the presence of this mixin
    isRouteableApplication: true,

    // ### Methods

    // #### function setContainer
    // - containerElement - sets the the application's main container to the given DOM element
    // - returns - nothing
    //
    // This method must be called before `loadView` can work.
    setContainer: function(containerElement) {
      this.mainContainer = containerElement;
    },

    // #### function mapRoutes
    // - routes - a map of route keys and views
    //
    // Each route key is defined in the same way as the Backbone routes map.
    // The value of each route key is the view class for the route.
    // Each view should have a `routeName` and a `routeAction` defined on its class.
    // If your view prototype has a `templateName`, Duckbone will fall back to using
    // it as a routeName in its absence.
    mapRoutes: function(routingTable) {
      _(routingTable).each(function(routeClass, route) {
        try {
          this.mapRoute(route, routeClass);
        } catch (e) {
          _.log(e);
          throw("Bad route for " + route);
        }
      }, this);
    },

    // #### function mapRoute
    // - route - the Backbone-style route string
    // - routeClass - an appropriately configured subclass of Duckbone.Route or Duckbone.View
    //
    // Defines each individual route for the Backbone router
    mapRoute: function(route, routeClass) {
      if (routeClass.prototype.isRoute) {
        // Use the given route subclass
      } else {
        // Create a route subclass from the class properties on the view
        var viewClass = routeClass;
        routeClass = Duckbone.Route.extend({
          routeName: viewClass.routeName || viewClass.prototype.templateName,
          routeAction: viewClass.routeAction,
          viewClass: viewClass
        });
      }
      validateRoute(route, routeClass);

      // Register it with the Backbone router,
      // and an additional route to handle when it is passed pseudo query params
      var application = this;
      this.route(route, routeClass.prototype.routeName, function() {
        Duckbone.route = new routeClass({
          application: application,
          fragment: route
        });
        Duckbone.route.routeAction.apply(Duckbone.route, arguments);
      });
      this.route(route+'?*params', routeClass.prototype.routeName, function() {
        Duckbone.route = new routeClass({
          application: application,
          fragment: route
        });
        Duckbone.route.routeActionWithQueryParams.apply(Duckbone.route, arguments);
      });
    },

    // #### function loadView
    // - viewClass - the view class to load
    // - options - an options object to be passed to the view initializer
    // - returns - the view
    //
    // Each route action generally results in a call to `loadView()`.
    loadView: function(viewClass, options) {
      this.unloadView();
      this.createViewWithLayout(viewClass, options);
      this.trigger('viewLoaded');
      return this.mainView;
    },

    unloadView: function() {
      if (this._removableFlashes) {
        this._removableFlashes.remove();
        delete this._removableFlashes;
      }
      if (this.mainView) this.mainView.remove();
      delete this.mainView;
    },

    createViewWithLayout: function(viewClass, options) {
      options = options || {};
      options.application = this;
      this.mainView = new viewClass(options);
      this.resetLayout(viewClass.layout);
      this.layoutView.setMainView(this.mainView);
      $(this.layoutView.el).appendTo(this.mainContainer);
    },

    // Reset the layout view for the given new layout class
    // Does nothing if same as existing layout

    resetLayout: function(layoutClass) {
      var layoutConstructor = layoutClass || this.defaultLayout;
      if (!(this.layoutView instanceof layoutConstructor)) {
        if (this.layoutView) this.layoutView.remove();
        this.layoutView = new layoutConstructor();
      }
    },

    // #### function navigate
    // - fragment - the url fragment to navigate to
    // - triggerRoute - true if the router should trigger the route when navigating here
    // - params - optional object of pseudo query params
    //
    // Overrides Backbone's navigate method with a version that clears flash messages,
    // and also accepts optional pseudo query params.
    navigate: function(fragment, triggerRoute, params) {
      // Next time loadView is called, we want to nix all current flashes.
      if (this.isFlashableView) this._removableFlashes = this.activeFlashes();
      // Add psuedo query params if given
      if (params) {
        var urlEncodedOptions = _(_.keys(params)).map(function(p) {return p + '=' + params[p]}).join('&');
        fragment = fragment + "?" + urlEncodedOptions
      }
      Backbone.history.navigate(fragment, triggerRoute);
    },

    // #### function bindNavigationBars
    // Resets css classes on navigation bars on every navigate event.
    // All navigation bars should be lists in a `<nav>` element,
    // and the `<li>` class should be equal to the routeName of the link destination.
    // A `current` class will be assigned to the current route.
    bindNavigationBars: function() {
      this.bind('all', function(e) {
        if (e.split(':')[0] != 'route') return;
        var routeName = e.split(':')[1];
        $('nav ul li').removeClass('current');
        $('nav ul li.'+routeName).addClass('current');
      });
    },

    defaultLayout: Backbone.View.extend({
      setMainView: function(mainView) {
        this.el = mainView.el;
      }
    })
  };

  function validateRoute(route, routeClass) {
    if (!routeClass.prototype.routeName) {
      throw("Missing or bad routeName for " + route);
    }
    if (typeof routeClass.prototype.routeAction != 'function') {
      throw("Missing or bad routeAction for " + route);
    }
  }

}).call();
