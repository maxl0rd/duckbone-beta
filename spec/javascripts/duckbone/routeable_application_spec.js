describe("Duckbone.RouteableApplication", function() {

  it("triggers viewLoaded after the view is appended", function() {
    var application = createDuckboneApplication();
    var viewClass = Backbone.View.extend({}, { layout: MockLayout });
    var viewLoaded = false;
    application.bind('viewLoaded', function() { viewLoaded = true; })
    application.loadView(viewClass);
    expect(viewLoaded).toBeTruthy();
  })

  it("renders a view within its layout", function() {
    var mainViewConstructor = Backbone.View.extend({}, { layout: MockLayout });
    var application = loadView(mainViewConstructor);
    expect(application.mainView instanceof mainViewConstructor).toBeTruthy();
    expect(application.layoutView instanceof MockLayout).toBeTruthy();
    expect(application.mainContainer[0].children[0]).toEqual(application.layoutView.el);
    expect(application.mainContainer[0].children.length).toEqual(1);
    expect(application.layoutView.mainView).toEqual(application.mainView);
  });

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

  it("renders a view without any layout", function() {
    var application = createDuckboneApplication();
    var mainViewConstructor = Backbone.View.extend({}, {});
    var mainView = application.loadView(mainViewConstructor);
    expect(application.mainView).toEqual(mainView);
    expect(application.mainContainer[0].children[0]).toEqual(mainView.el);
    expect(application.mainContainer[0].children.length).toEqual(1);
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

  var loadView = function(viewConstructor) {
    var application = createDuckboneApplication();
    application.loadView(viewConstructor);
    return application;
  };

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

  var MockLayout = defineMockLayoutConstructor();
});
