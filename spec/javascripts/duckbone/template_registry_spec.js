describe("Duckbone.TemplateRegistry", function () {

  var templates;

  var templatesDataFixture = {
    "template1" : "<div>Template One</div>",
    "template2" : "<div>Template Two</div>",
    "template3" : "<div>Template Three {{> partial1}} </div>",
    "template4" : "<div>Template Four {{> folder__partial2}} </div>",
  };

  var partialsDataFixture = {
    "partial1" : "<span>Partial One</span>",
    "folder__partial2" : "<span>Partial Two</span>"
  }

  beforeEach(function(){
    templates = new Duckbone.TemplateRegistry({
      templatesData: templatesDataFixture,
      partialsData: partialsDataFixture
    });
  });

  it("compiles partials and templates", function() {
    templates.compile();
    expect(_.keys(templates.compiledTemplates).length).toEqual(4);
    expect(templates.partialsCompiled).toBeTruthy();
    expect(templates.templatesCompiled).toBeTruthy();
  });

  it("fetches and renders the right template", function() {
    var template = templates.get("template1");
    var output = template.call();
    expect(output).toEqual(templatesDataFixture['template1']);
  });

  it("renders partials", function() {
    templates.compile();
    var template = templates.get("template3");
    var output = template.call();
    expect(output).toEqual("<div>Template Three <span>Partial One</span> </div>");
  });

  it ("renders partials in subfolders", function() {
    templates.compile();
    var template = templates.get("template4");
    var output = template.call();
    expect(output).toEqual("<div>Template Four <span>Partial Two</span> </div>");
  });

  // Find a better way to test this without dirtying existing app templates
  it ("finds templates stored in Duckbone.TemplatesData by default", function() {
    Duckbone.TemplatesData = Duckbone.TemplatesData || {};
    _.extend(Duckbone.TemplatesData, templatesDataFixture);
    Duckbone.PartialsData = Duckbone.PartialsData || {};
    _.extend(Duckbone.PartialsData, partialsDataFixture);
    templates = new Duckbone.TemplateRegistry();
    var template = templates.get("template1");
    var output = template.call();
    expect(output).toEqual(templatesDataFixture['template1']);
  })

});