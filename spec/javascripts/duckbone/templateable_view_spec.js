describe("Duckbone.TemplateableView", function() {

  var subject, templates, testViewClass;
  var templateFixture, modelFixture, expectedOutput, ModelWithBaz;


  var templatesDataFixture = {
    "template1" : "<div>Template One</div>",
    "template2" : "<div>Template Two</div>"
  };
  var partialsDataFixture = {
    "partial1" : "<span>Partial One</span>",
    "folder__partial2" : "<span>Partial Two</span>"
  };

  beforeEach(function() {
    templateFixture = '<div>Template {{attr "foo"}} {{foo}}</div>';
    modelFixture = { foo: "Bar" };
    expectedOutput = /<div>Template <[^>]+>Bar<\/[^>]+> Baz<\/div>/;
    ModelWithBaz = Backbone.Model.extend({
      foo: function() {
        return "Baz";
      }
    });
    testViewClass = Backbone.View.extend(Duckbone.TemplateableView);
    templates = new Duckbone.TemplateRegistry({
      templatesData: templatesDataFixture,
      partialsData: partialsDataFixture
    });
  });

  it ("finds its template when given a templateData attribute", function() {
    subject = new testViewClass();
    subject.templateData = '<div>I am a nice template.</div>';
    subject.getTemplate();
    expect(subject.template()).toEqual('<div>I am a nice template.</div>');
  });

  it ("finds its template when given a templateName", function() {
    subject = new testViewClass({
      templateName: 'template1'
    });
    subject.templateRegistry = templates;
    subject.getTemplate();
    expect(subject.template()).toEqual(templatesDataFixture['template1']);
  });

  it ("renders its template in its model's context", function() {
    subject = new testViewClass({});
    subject.template = Duckbone.Handlebars.compile(templateFixture);
    subject.model = new ModelWithBaz(modelFixture);
    subject.renderTemplate();
    expect($(subject.el).html()).toMatch(expectedOutput);
  });

  it ("renders every item in a collection", function() {
    subject = new testViewClass({});
    subject.model = new Backbone.Model();
    subject.model.items = new Backbone.Collection();
    subject.model.items.add([new Backbone.Model({id: "dog"})]);
    subject.model.items.add([new Backbone.Model({id: "cat"})]);
    var templateData = "<div>{{#each items}}<li>Pet {{id}}</li>{{/each}}</div>";
    var expectedOutput = "<div><li>Pet dog</li><li>Pet cat</li></div>";
    subject.template = Duckbone.Handlebars.compile(templateData);
    subject.renderTemplate();
    expect($(subject.el).html()).toEqual(expectedOutput);
  });

});