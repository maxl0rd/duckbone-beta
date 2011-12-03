describe("Duckbone.View", function() {

  var subject, ViewClass, template;

  beforeEach(function() {
    template = Duckbone.Handlebars.compile('<div>I am a {{animal}}</div>');
    ViewClass = Duckbone.View.extend({
      template: template,
      model: new Backbone.Model({animal: 'cat'})
    });
    subject = new ViewClass();
  });

  it("Should render its template", function() {
    window.subject = subject;
    expect($(subject.el).html()).toEqual('<div>I am a cat</div>');
  });

});