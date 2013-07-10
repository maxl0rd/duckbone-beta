describe("Duckbone.RouteableApplication", function() {

  describe(".loadView", function() {
    it("triggers viewLoaded after the view is appended", function() {
      var application = createDuckboneApplication();
      var viewClass = Backbone.View.extend({}, { layout: MockLayout });
      var viewLoaded = false;
      application.bind('viewLoaded', function() { viewLoaded = true; })
      application.loadView(viewClass);
      expect(viewLoaded).toBeTruthy();
    })

    it("defines Duckbone.route", function() {
      var application = createDuckboneApplication();
      var mainViewConstructor = Backbone.View.extend();
      application.loadView(mainViewConstructor);
    });

    describe("with a layout", function() {
      it("renders a view within its layout", function() {
        var application = createDuckboneApplication();
        var mainViewConstructor = Backbone.View.extend({}, { layout: MockLayout });
        application.loadView(mainViewConstructor);
        expect(application.mainView instanceof mainViewConstructor).toBeTruthy();
        expect(application.layoutView instanceof MockLayout).toBeTruthy();
        expect(application.mainContainer[0].children[0]).toEqual(application.layoutView.el);
        expect(application.mainContainer[0].children.length).toEqual(1);
        expect(application.layoutView.mainView).toEqual(application.mainView);
      });

      it("doesn't reinitialize the layout for a view that uses the same layout", function() {
        var application = createDuckboneApplication();
        var mainViewConstructor = Backbone.View.extend({}, { layout: MockLayout });
        var firstView = application.loadView(mainViewConstructor);
        var layoutView = application.layoutView;
        var secondView = application.loadView(mainViewConstructor);
        expect(application.layoutView.cid).toEqual(layoutView.cid);
      });

      it("initializes the layout for a view that uses a new layout", function() {
        var application = createDuckboneApplication();
        var firstLayoutConstructor = defineMockLayoutConstructor();
        var secondLayoutConstructor = defineMockLayoutConstructor();
        var firstViewConstructor = Backbone.View.extend({}, { layout: firstLayoutConstructor });
        var secondViewConstructor = Backbone.View.extend({}, { layout: secondLayoutConstructor });
        var firstView = application.loadView(firstViewConstructor);
        var secondView = application.loadView(secondViewConstructor);
        expect(application.layoutView instanceof secondLayoutConstructor).toBeTruthy();
      });

      it("removes the current layout before switching in a new layout", function() {
        var application = createDuckboneApplication();
        var firstLayoutConstructor = defineMockLayoutConstructor();
        var secondLayoutConstructor = defineMockLayoutConstructor();
        var firstViewConstructor = Backbone.View.extend({}, { layout: firstLayoutConstructor });
        var secondViewConstructor = Backbone.View.extend({}, { layout: secondLayoutConstructor });
        var firstView = application.loadView(firstViewConstructor);
        var firstLayout = application.layoutView;
        var secondView = application.loadView(secondViewConstructor);
        expect(firstLayout.removed).toBeTruthy();
      });
    });

    describe("with a default layout", function() {
      it("renders a default layout when present", function() {
        var application = createDuckboneApplication();
        var mainViewConstructor = Backbone.View.extend({}, {});
        application.defaultLayout = MockLayout;
        var mainView = application.loadView(mainViewConstructor);
        expect(application.mainView).toEqual(mainView);
        expect(application.layoutView instanceof MockLayout).toBeTruthy();
        expect(application.mainContainer[0].children[0]).toEqual(application.layoutView.el);
        expect(application.mainContainer[0].children.length).toEqual(1);
        expect(application.layoutView.mainView).toEqual(mainView);
      });
    });

    describe("without a layout", function() {
      it("renders a view without any layout", function() {
        var application = createDuckboneApplication();
        var mainViewConstructor = Backbone.View.extend({}, {});
        var mainView = application.loadView(mainViewConstructor);
        expect(application.mainView).toEqual(mainView);
        expect(application.mainContainer[0].children[0]).toEqual(mainView.el);
        expect(application.mainContainer[0].children.length).toEqual(1);
      });
    });
  });

  var createDuckboneApplication = function() {
    var applicationConstructor = Backbone.Router.extend();
    Duckbone.include(applicationConstructor.prototype, Duckbone.RouteableApplication);
    var application = new applicationConstructor();
    var containerElement = $("<div></div>");
    application.setContainer(containerElement);
    return application;
  };

  var defineMockLayoutConstructor = function() {
    return Backbone.View.extend({
      setMainView: function(mainView) {
        this.mainView = mainView;
      },

      remove: function() {
        this.removed = true;
      }
    }, {});
  };

  var defineMainViewConstructor = function() {
    return Backbone.View.extend({}, {
      routeName: 'my_view_route',
      routeAction: function() {
        this.loadView();
      }
    });
  }

  var defineRouteConstructor = function() {
    return Duckbone.Route.extend({
      routeName: 'my_route',
      routeAction: function() {
        this.loadView();
      },
      viewClass: Backbone.View.extend({})
    });
  }

  var MockLayout = defineMockLayoutConstructor();
});
