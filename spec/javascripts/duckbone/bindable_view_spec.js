describe("Duckbone.BindableView", function() {

  var subject;
  var templateFixture = '<div>My pet is a <span class="pet"></span></div>';
  var modelFixture = { pet: "cat" };
  var testView, testViewSelector, testViewFunctional;
  var viewOpts = {model: new Backbone.Model(modelFixture)};

  beforeEach(function() {
    testView = Backbone.View.extend({
      templateData: templateFixture,
    });
    Duckbone.include(testView.prototype, Duckbone.TemplateableView, Duckbone.BindableView)
    testViewSelector = testView.extend({
      attributeChanges: {
        'pet': 'span.pet'
      }
    });
    testViewFunctional = testView.extend({
      attributeChanges: {
        'pet': function(newValue) {
          $(this.el).find('span.pet').html(newValue);
        }
      }
    });
  });

  it ("It sets initial value when using selector bindings", function() {
    subject = new testViewSelector(viewOpts);
    expect($(subject.el).html()).toEqual('<div>My pet is a <span class="pet">cat</span></div>');
  });

  it ("It sets initial value when using functional bindings", function() {
    subject = new testViewFunctional(viewOpts);
    expect($(subject.el).html()).toEqual('<div>My pet is a <span class="pet">cat</span></div>');
  });

  it ("It updates when using selector bindings", function() {
    subject = new testViewSelector(viewOpts);
    subject.model.set({pet: 'dog'});
    expect($(subject.el).html()).toEqual('<div>My pet is a <span class="pet">dog</span></div>');
  });

  it ("It updates when using functional bindings", function() {
    subject = new testViewFunctional(viewOpts);
    subject.model.set({pet: 'dog'});
    expect($(subject.el).html()).toEqual('<div>My pet is a <span class="pet">dog</span></div>');
  });

  it ("removeWeakBindings removes weak bindings", function() {
    subject = new testViewFunctional(viewOpts);
    expect(subject.model._callbacks['change:pet'][0]).toBeTruthy();
    subject.removeWeakBindings();
    expect(subject.model._callbacks['change:pet'][0]).toBeFalsy();
    expect(subject._weakBindings).toBeUndefined();
  });

});