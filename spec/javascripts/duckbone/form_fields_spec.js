describe("Duckbone Form Fields", function() {

  var subject;

  beforeEach(function() {
    model = new Backbone.Model({
      title: "My doghouse",
      price_cents: 1000,
      pet: "fido",
      food: "dogFood",
      password: "petsRkewl",
      lifeStory: "Once apon a time...",
      agree: false
    });
  });

  describe("Duckbone.TextFormField", function() {

    beforeEach(function() {
      subject = new Duckbone.TextFormField({
        el: $('<input type="text" name="my_text_field"/>').get(0),
        model: model,
        name: "my_text_field",
        modelAttribute: "title",
        elAttributes: {size: 40, placeholder: "foo"},
        form: {view: new Duckbone.View({model: model})}
      });
    });

    it("Assigns the elements html attributes", function() {
      expect($(subject.el).attr('size')).toEqual('40');
      expect($(subject.el).attr('placeholder')).toEqual("foo");
    });
    it("Assigns the initial value to the object", function() {
      expect(subject.get()).toEqual("My doghouse");
    });
    it("Assigns the initial value to the DOM", function() {
      expect($(subject.el).val()).toEqual("My doghouse");
    });
    it("Binds text fields to model changes", function() {
      model.set({title: "My cathouse"});
      expect(subject.get()).toEqual("My cathouse");
    });
    it("Binds the model to text fields changes", function() {
      $(subject.el).val("My cathouse").trigger('change');
      expect(model.get("title")).toEqual("My cathouse");
    });
    it("Should not allow the model to be set to undefined", function() {
      subject.get = function() { return undefined; }
      $(subject.el).val("doesn't matter, it'll be undefined").trigger('change');
      expect(model.get("title")).toEqual(null);
    });
    it("Should strip whitespace by default", function() {
      subject.set("  funk");
      expect(subject.get()).toEqual("funk");
    });
    it("Should not strip whitespace when disabled", function() {
      subject.stripWhitespace = false;
      subject.set("  funk");
      expect(subject.get()).toEqual("  funk");
    });
    it ("Should not strip whitespace when disabled as a field option", function() {
      subject = new Duckbone.TextFormField({
        el: $('<input type="text" name="my_text_field"/>').get(0),
        model: model,
        name: "my_text_field",
        modelAttribute: "title",
        elAttributes: {size: 40, placeholder: "foo"},
        stripWhitespace: false,
        form: {view: new Duckbone.View({model: model})}
      });
      subject.set("  funk");
      expect(subject.get()).toEqual("  funk");
    });
  });

  describe("Duckbone.CheckboxFormField", function() {

    beforeEach(function() {
      subject = new Duckbone.CheckboxFormField({
        el: $('<input type="checkbox" name="my_checkbox_field"/>').get(0),
        model: model,
        name: "my_checkbox_field",
        modelAttribute: "agree",
        form: {view: new Duckbone.View({model: model})}
      });
    });

    it("Assigns the initial values of the model to checkboxes", function() {
      expect(subject.get()).toEqual(false);
      expect($(subject.el).is(':checked')).toEqual(false);
    });

    it("Binds checkbox fields to changes in the model", function() {
      model.set({agree: true});
      expect(subject.get()).toEqual(true);
      expect($(subject.el).is(':checked')).toEqual(true);
    });

    it("Binds model to changes in the checkbox dom", function() {
      $(subject.el).attr({checked: true}).change();
      expect(model.get("agree")).toEqual(true);
    });

  });

  describe("Duckbone.SelectFormField", function() {

    describe("with static options", function() {
      beforeEach(function() {
        subject = new Duckbone.SelectFormField({
          el: $('<select name="my_select_field"></select>').get(0),
          model: model,
          name: "my_select_field",
          modelAttribute: "food",
          selectOptions: {dogFood: "Bone", catFood: "Fish", fishFood: "Muck"},
          form: {view: new Duckbone.View({model: model})}
        });
      });

      it("Assigns the initial values of the model to select boxes", function() {
        expect(subject.get()).toEqual("dogFood");
        expect($(subject.el).val()).toEqual("dogFood");
      });

      it("Binds select fields to changes in the model", function() {
         model.set({food: "catFood"});
         expect(subject.get()).toEqual("catFood");
       });

       it("Binds select fields to changes in the model", function() {
         $(subject.el).val("catFood").change();
         expect(model.get("food")).toEqual("catFood");
       });

       it("updates the fields when told", function() {
          subject.setOptions({horseFood: "Flesh", birdFood: "Brains"});
          expect(model.get("food")).toEqual('horseFood');
          model.set({food: "birdFood"});
          expect(subject.get()).toEqual("birdFood");
       })
    });

    describe("with functional options", function() {
      beforeEach(function() {
        subject = new Duckbone.SelectFormField({
          el: $('<select name="my_select_field"></select>').get(0),
          model: model,
          name: "my_select_field",
          modelAttribute: "food",
          selectOptions: function() {
            return {dogFood: "Bone", catFood: "Fish", fishFood: "Muck"}
          },
          form: {view: new Duckbone.View({model: model})}
        });
      });

      it("Assigns the initial values of the model to select boxes", function() {
        expect(subject.get()).toEqual("dogFood");
        expect($(subject.el).val()).toEqual("dogFood");
      });

      it("Binds select fields to changes in the model", function() {
         model.set({food: "catFood"});
         expect(subject.get()).toEqual("catFood");
       });

       it("Binds select fields to changes in the model", function() {
         $(subject.el).val("catFood").change();
         expect(model.get("food")).toEqual("catFood");
       });

       it("updates the fields when told", function() {
          subject.setOptions(function() { return {horseFood: "Flesh", birdFood: "Brains"} });
          expect(model.get("food")).toEqual('horseFood');
          model.set({food: "birdFood"});
          expect(subject.get()).toEqual("birdFood");
       })
    });
  });

  describe("Duckbone.RadioSetFormField", function() {

    beforeEach(function() {
      var form = new Duckbone.FormManager({
        el: '<form name="my_form"></form>'
      });
      subject = new Duckbone.RadioSetFormField({
        form: form,
        el: $('<div class="radio_set" name="my_radio_set_field"></div>').get(0),
        model: model,
        name: "my_radio_set_field",
        modelAttribute: "food",
        selectOptions: {dogFood: "Bone", catFood: "Fish", fishFood: "Muck"},
        form: {view: new Duckbone.View({model: model})}
      });
    });

    it("Assigns the initial values of the model to radio sets", function() {
      expect(subject.get()).toEqual("dogFood");
      expect($(subject.el).find('input[value="dogFood"]').get(0).checked).toBeTruthy();
      expect($(subject.el).find('input[value="catFood"]').get(0).checked).toBeFalsy();
      expect($(subject.el).find('input[value="fishFood"]').get(0).checked).toBeFalsy();
    });

    it("Binds radio_set fields to changes in the model", function() {
      model.set({food: "catFood"});
      expect(subject.get()).toEqual("catFood");
      expect($(subject.el).find('input[value="dogFood"]').get(0).checked).toBeFalsy();
      expect($(subject.el).find('input[value="catFood"]').get(0).checked).toBeTruthy();
      expect($(subject.el).find('input[value="fishFood"]').get(0).checked).toBeFalsy();
    });

    it("Binds the model to changes in radio_set fields", function() {
      expect(model.get("food")).toEqual("dogFood");
      $(subject.el).find('input[value="dogFood"]').attr('checked', false).trigger('change');
      expect(model.get("food")).toEqual(undefined);
      $(subject.el).find('input[value="catFood"]').attr('checked', true).trigger('change');
      expect(model.get("food")).toEqual("catFood");
    });
  });

});