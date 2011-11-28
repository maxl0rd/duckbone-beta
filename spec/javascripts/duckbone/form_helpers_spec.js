
describe("Handlebars Form Helpers", function() {

  var subject, template, templateFixture;

  it("Renders a form tag block helper", function() {
    templateFixture = '{{#form "my_form"}} My form {{/form}}';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<form action="#" name="my_form" class="my_form">\n My form \n</form>');
  });

  it("Renders a text input field", function() {
    templateFixture = '<div>My stuff {{form_text "my_field"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <input class="form_text" type="text" name="my_field"/></div>');
  });

  it("Renders a select field", function() {
    templateFixture = '<div>My stuff {{form_select "my_field"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <select class="form_select" name="my_field"></select></div>');
  });

  it("Renders a radio set", function() {
    templateFixture = '<div>My stuff {{form_radio_set "my_field"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <div class="form_radio_set" name="my_field"></div></div>');
  });

  it("Renders an input checkbox field", function() {
    templateFixture = '<div>My stuff {{form_checkbox "my_field"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <input class="form_checkbox" type="checkbox" name="my_field"/></div>');
  });

  it("Renders a textarea", function() {
    templateFixture = '<div>My stuff {{form_textarea "my_field"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <textarea class="form_textarea" name="my_field"></textarea></div>');
  });

  it("Renders an input password field ", function() {
    templateFixture = '<div>My stuff {{form_password "my_field"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <input class="form_password" type="password" name="my_field"></input></div>');
  });

  it("Renders an input submit field ", function() {
    templateFixture = '<div>My stuff {{form_submit "my_field" "Button Text"}}</div>';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<div>My stuff <button class="form_submit" name="my_field">Button Text</button></div>');
  });

  it("Renders fields inside a form", function() {
    templateFixture = '{{#form "my_form"}} My stuff {{form_text "my_field"}}{{/form}}';
    template = Duckbone.Handlebars.compile(templateFixture);
    subject = template({});
    expect(subject).toEqual('<form action="#" name="my_form" class="my_form">\n My stuff <input class="form_text" type="text" name="my_field"/>\n</form>');
  });

});