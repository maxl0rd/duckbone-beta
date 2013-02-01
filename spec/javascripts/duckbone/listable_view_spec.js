describe("Duckbone.ListableView", function () {

  var subject, collection, view, newModel, ViewClass, subViewClass;

  var dataFixture = [
    {id: 1, pet: "cat", age: 10},
    {id: 2, pet: "dog", age: 5},
    {id: 3, pet: "monkey", age: 2}
  ];

  beforeEach(function() {
    // Sub view
    var subViewClass = Backbone.View.extend({
      tagName: 'li',
      template: Duckbone.Handlebars.compile('{{pet}} aged {{age}}'),
    });
    Duckbone.include(subViewClass.prototype, Duckbone.TemplateableView);

    // Collection
    collection = new Duckbone.Collection();
    collection.model = Backbone.Model;
    collection.reset(dataFixture);

    // ListableView class
    ViewClass = Backbone.View.extend({
      viewClass: subViewClass,
      tagName: 'ol'
    });
    Duckbone.include(ViewClass.prototype, Duckbone.ListableView);
  });

  describe('.initialize', function() {
    beforeEach(function() {
      subject = new ViewClass({ collection: collection });
    });

    it("creates its subviews", function() {
      expect(_.keys(subject.children).length).toEqual(subject.collection.length);
    });

    it("creates DOM elements for its subviews", function() {
      expect($(subject.el).find('li').length).toEqual(subject.collection.length);
    });
  });

  describe('collection.add', function() {
    beforeEach(function() {
      subject = new ViewClass({ collection: collection });
    });

    it("adds a new view when a model is added to the collection", function() {
      newModel = new Backbone.Model({id: 4, pet: "fish", age: "1"});
      subject.collection.add(newModel);
      var newView = subject.children[newModel.cid];
      expect(newView.model.id).toEqual(newModel.id);
      expect($(subject.el).find('li').length).toEqual(subject.collection.length);
    });

    it("maintains the collection's sort order", function() {
      subject.collection.comparator = function(model) {
        return model.get('age');
      };
      subject.collection.reset(dataFixture);
      subject.collection.add(new Backbone.Model({id: 4, pet: "donkey", age: 3}));
      expect($(subject.el).find('li').eq(1).html()).toEqual('donkey aged 3');
    });
  });

  describe('collection.remove', function() {
    beforeEach(function() {
      subject = new ViewClass({ collection: collection });
    });

    it("removes the view when a model is removed from the collection", function() {
      var removeModel = subject.collection.get(3);
      subject.collection.remove(removeModel);
      expect(_.keys(subject.children).length).toEqual(subject.collection.length);
      expect($(subject.el).find('li').length).toEqual(subject.collection.length);
    });
  });

  describe('collection.reset', function() {
    beforeEach(function() {
      subject = new ViewClass({ collection: collection });
    });

    it("resets and re-renders itself when the collection is reset", function() {
      subject.collection.reset({
        id: 4, pet: "donkey", age: 5
      });
      expect(_.keys(subject.children).length).toEqual(subject.collection.length);
      expect($(subject.el).find('li').length).toEqual(subject.collection.length);
      expect($(subject.el).find('li:nth-child(1)').html()).toEqual('donkey aged 5');
    });

    it("respects the sort order of the collection", function() {
      subject.collection.comparator = function(model) {
        return model.get('age');
      };
      subject.collection.reset(dataFixture);
      expect($(subject.el).find('li').eq(0).html()).toEqual('monkey aged 2');
      expect($(subject.el).find('li').eq(1).html()).toEqual('dog aged 5');
      expect($(subject.el).find('li').eq(2).html()).toEqual('cat aged 10');
    });
  });

});