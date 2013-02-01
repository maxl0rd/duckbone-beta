describe("Duckbone Form View System", function() {

  var subject, el, template, renderedTemplate, TestView, model;

  var templateFixture = '<div>{{#form "pets"}}\
    <div>Title: {{form_text "my_text_field"}}</div>\
    <div>My pet: {{form_select "my_select_field"}}</div>\
    <div>His food: {{form_radio_set "my_radio_set_field"}}</div>\
    <div>Life story: {{form_textarea "my_textarea_field"}}</div>\
    <div>I agree to these terms: {{form_checkbox "my_checkbox_field"}}</div>\
    <div>Enter password: {{form_password "my_password_field"}}</div>\
    <div>{{form_submit "my_submit_field"}}</div>\
  {{/form}}</div>';

  var fieldsFixture = {
    my_text_field: {modelAttribute: "title"},
    my_select_field: {
      modelAttribute: "pet",
      selectOptions: {fido: "The Dog", cosmo: "The Cat", frank: "The Fish"}
    },
    my_radio_set_field: {
      modelAttribute: "food",
      selectOptions: {dogFood: "Bone", catFood: "Fish", fishFood: "Muck"}
    },
    my_textarea_field: {modelAttribute: "lifeStory"},
    my_password_field: {modelAttribute: "password"},
    my_checkbox_field: {modelAttribute: "agree"},
  };

  var modelFixture = {
    title: "My doghouse",
    price_cents: "1000",
    pet: "fido",
    food: "dogFood",
    password: "petsRkewl",
    lifeStory: "Once apon a time...",
    agree: false
  };

  beforeEach(function() {
    template = Duckbone.Handlebars.compile(templateFixture);
    renderedTemplate = template({});
    TestView = Backbone.View.extend({
      fields: fieldsFixture
    });
    Duckbone.include(TestView.prototype, Duckbone.EditableView);
  });

  describe("Duckbone.FormManager", function() {

    beforeEach(function() {

     var formView = new TestView({
       el: renderedTemplate,
       model: new Backbone.Model(modelFixture)
     });
     subject = formView.form;
    });

    it("Creates its FormManager", function() {
      expect(subject instanceof Duckbone.FormManager).toBeTruthy();
    });

    it("Creates form field objects for all of its field elements", function() {
      expect(subject.fields['my_text_field'].type).toEqual("text");
      expect(subject.fields['my_select_field'].type).toEqual("select");
      expect(subject.fields['my_radio_set_field'].type).toEqual("radio_set");
      expect(subject.fields['my_textarea_field'].type).toEqual("textarea");
      expect(subject.fields['my_password_field'].type).toEqual("password");
      expect(subject.fields['my_checkbox_field'].type).toEqual("checkbox");
      expect(subject.fields['my_submit_field'].type).toEqual("submit");
    });

  });

  describe("Duckbone.EditableView", function() {

    describe(".cloneModelForEditing", function() {

      describe("with a normal model", function() {
        beforeEach(function() {
          subject = new TestView({
            el: renderedTemplate,
            model: new Backbone.Model(modelFixture)
          });
        });

        it ("clones the model", function() {
          expect(subject.originalModel).toBeDefined();
          expect(subject.originalModel.id).toEqual(subject.model.id);
          expect(subject.isModelCloned()).toBeTruthy();
        });
      });

      describe("with an associable model", function() {
        var associableModel, cloneSpy;

        beforeEach(function() {
          associableModel = new Backbone.Model(modelFixture);
          associableModel.cloneWithAssociations = function() { return this.clone(); };
          cloneSpy = sinon.spy(associableModel, 'cloneWithAssociations');

          subject = new TestView({
            el: renderedTemplate,
            model: associableModel
          });
        });

        it("calls cloneWithAssociations if present", function() {
          expect(cloneSpy.called).toBeTruthy();
        });
      })
    });

    xit("Should bind to sync events on the model", function() {
      var saved = false;
      subject.modelSaved = function() {saved = true;}
      subject.model.trigger('sync:success');
      expect(saved).toBeTruthy();
    });

    // These need to be be written...
    // They require validation tests on the form fields and form manager first

    xit("Binds to the form submission", function() {

    });

    xit("Should submit if the form is valid", function() {

    });

    xit("Should not submit if the form is invalid", function() {

    });

    it("should add itself to a collection when afterSaveDestination is set", function() {
      var collection = new Duckbone.Collection();
      var SubjectTestView = TestView.extend({
        afterSaveDestination: {
          collection: collection
        }
      });

      subject = new SubjectTestView({
        el: renderedTemplate,
        model: new Backbone.Model(modelFixture)
      });

      subject.model.trigger('sync:success');

      expect(collection.first().cid).toEqual(subject.originalModel.cid);
    });

    it("should add itself as an association when afterSaveDestination is set", function() {
      var otherModel = new Duckbone.Model();

      otherModel.hasOne({
        subjectModel: {model: Backbone.Model}
      });

      var SubjectTestView = TestView.extend({
        afterSaveDestination: {
          model: otherModel,
          association: 'subjectModel'
        }
      })

      subject = new SubjectTestView({
        el: renderedTemplate,
        model: new Backbone.Model(modelFixture)
      });

      subject.model.trigger('sync:success');

      expect(otherModel.subjectModel.cid).toEqual(subject.originalModel.cid);
    });

    it("Can render base errors in a view without other children", function() {
      var model = new Duckbone.Model();
      var testViewClass = Duckbone.FormView.extend({
        templateData: '{{child "_baseErrors"}}'
      });
      var testView = new testViewClass({ model: model });
      expect(testView.el).toContain("div[data-child-view=_baseErrors]");
    });

    it("Can render base errors in a view with other children", function() {
      var model = new Duckbone.Model();
      var childView = new Duckbone.View({ templateData: "hello" });
      var testViewClass = Duckbone.FormView.extend({
        templateData: '{{base_errors}}{{child "myChild"}}',
        createChildren: function() {
          return {
            myChild: childView
          };
        }
      });
      var testView = new testViewClass({ model: model });
      expect(testView.el).toContain("div[data-child-view=_baseErrors]");
      expect(testView.el).toContain("div[data-child-view=myChild]:contains('hello')");
    });
  });

});
