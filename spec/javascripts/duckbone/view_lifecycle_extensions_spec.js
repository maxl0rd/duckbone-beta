describe("Duckbone.ViewLifecycleExtensions", function() {

  var subject, ViewClass;

  it("Should add the initialize method when it does not exist", function() {
    ViewClass = Backbone.View.extend();
    Duckbone.include(ViewClass.prototype, Duckbone.ViewLifecycleExtensions);
    subject = new ViewClass();
    expect(subject.constructor.prototype.hasOwnProperty('initialize')).toBeTruthy();
  });

  it("Should not add the initialize method when it exists", function() {
    var initializeFunction = function() {
      this.initialized = true;
    };
    ViewClass = Backbone.View.extend({
      initialize: initializeFunction
    });
    Duckbone.include(ViewClass.prototype, Duckbone.ViewLifecycleExtensions);
    subject = new ViewClass();
    expect(subject.constructor.prototype.initialize).toEqual(initializeFunction);
    expect(subject.initialized).toBeTruthy();
  });

  it("Should also add initialize when included as a dependency by another module", function() {
    var OtherModule = {
      included: function() {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
    }
    ViewClass = Backbone.View.extend();
    Duckbone.include(ViewClass.prototype, OtherModule);
    expect(subject.constructor.prototype.hasOwnProperty('initialize')).toBeTruthy();
  });

  it("Should call all of its init lifecycle callbacks", function() {
    ViewClass = Backbone.View.extend({
      beforeClone: sinon.spy(),
      afterInitialize: sinon.spy(),
      beforeRemove: sinon.spy(),
      afterRemove: sinon.spy()
    });
    Duckbone.include(ViewClass.prototype, Duckbone.ViewLifecycleExtensions);
    subject = new ViewClass();
    expect(subject.afterInitialize.called).toBeTruthy();
  });

  it("Should call all of its lifecycle callbacks when everything is mixed in", function() {
    ViewClass = Backbone.View.extend({
      template: Duckbone.Handlebars.compile('<div>Ohai</div>'),
      beforeClone: sinon.spy(),
      createChildren: sinon.spy(),
      afterInitialize: sinon.spy(),
      beforeRemove: sinon.spy(),
      afterRemove: sinon.spy()
    });
    Duckbone.include(ViewClass.prototype, Duckbone.TemplateableView, Duckbone.ListableView,
      Duckbone.StylizeableView, Duckbone.BindableView, Duckbone.EditableView);
    subject = new ViewClass({
      model: new Backbone.Model()
    });
    expect(subject.createChildren.called).toBeTruthy();
    expect(subject.afterInitialize.called).toBeTruthy();
    expect(subject.beforeClone.called).toBeTruthy();
  });

});