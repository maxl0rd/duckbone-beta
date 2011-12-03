describe("Duckbone.AssociableModel", function() {

  var subject, SubjectModel, AssociatedModel, AssociatedCollection;

  var fixture = {
    id: 1,
    title: "Foo",
    associated_model: {
      title: "Test Model"
    },
    different_key: {
      title: "Different Key"
    },
    associated_collection: [
      {id: 1, title: "Item One"},
      {id: 2, title: "Item Two"},
      {id: 3, title: "Item Three"},
    ]
  }

  beforeEach(function() {
    SubjectModel = Duckbone.Model.extend();
    AssociatedModel = Duckbone.Model.extend({
      initialize: function() {
        this.hasOne({
          subject: {model: SubjectModel}
        });
      }
    });
    AssociatedCollection = Duckbone.Collection.extend({
      model: AssociatedModel
    });
  });

  it("should create a null property for the association with no data", function() {
    subject = new SubjectModel();
    subject.hasOne({associated_model: {model: AssociatedModel}});
    expect(subject.hasOwnProperty('associatedModel')).toBeTruthy()
    expect(subject.associatedModel).toEqual(null);
  });

  it("should create the association when passed data", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    expect(subject.associatedModel).toBeDefined();
    expect(subject.associatedModel instanceof AssociatedModel).toBeTruthy();
  });

  it("hasMany should create an empty collection with no data", function() {
    subject = new SubjectModel();
    subject.hasMany({associated_collection: {collection: AssociatedCollection}});
    expect(subject.associatedCollection instanceof AssociatedCollection).toBeTruthy();
    expect(subject.associatedCollection.length).toEqual(0);
  });

  it("hasMany should create an instance of the collection association", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection}});
    expect(subject.associatedCollection instanceof AssociatedCollection).toBeTruthy();
    expect(subject.associatedCollection.length).toEqual(3);
  });

  it("should move the attributes to the associated model", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    expect(subject.associatedModel.attributes.title).toEqual(fixture.associated_model.title);
    expect(subject.associatedModel.attributes.associated_model).toEqual(undefined);
  });

  it("should move the attributes to the associated collection", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection}});
    expect(subject.associatedCollection.length).toEqual(fixture.associated_collection.length);
    expect(subject.associatedCollection.first().get('title')).toEqual("Item One");
  });

  it("hasOne should create a reciprocal belongsTo relation", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel, belongsTo: 'subject'}});
    expect(subject.associatedModel.subject).toBeDefined();
  });

  it("hasMany should create a reciprocal belongsTo relation", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
    expect(subject.associatedCollection.subject).toEqual(subject);
  });

  it("hasMany should create a reciprocal belongsTo relation for the collection's models", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
    expect(subject.associatedCollection.at(0).subject).toEqual(subject);
  });

  it("hasMany should create a reciprocal belongsTo relation for the collection's models on add", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
    var fourthItem = new AssociatedModel({id: 4, title: "Item Four"});
    expect(fourthItem.subject).toBeNull();
    subject.associatedCollection.add(fourthItem);
    expect(fourthItem.subject).toEqual(subject);
  });

  it("hasMany should create a reciprocal belongsTo relation for the collection's models on reset", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
    var fourthItem = new AssociatedModel({id: 4, title: "Item Four"});
    expect(fourthItem.subject).toBeNull();
    subject.associatedCollection.reset([fourthItem]);
    expect(fourthItem.subject).toEqual(subject);
  });

  it("hasOne should update the association when its attribute changes", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    var associationIdBefore = subject.associatedModel.cid;
    subject.set({associated_model: {title: 'The New Title'}});
    var associationIdAfter = subject.associatedModel.cid;
    expect(subject.associatedModel.get('title')).toEqual('The New Title');
    expect(associationIdAfter).toEqual(associationIdBefore);
    expect(subject.attributes.associated_model).toBeUndefined();
  });

  it("hasOne should create the association when the attribute changes if it didn't exist", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    subject.set({associated_model: {title: 'The New Title'}});
    expect(subject.associatedModel instanceof AssociatedModel).toBeTruthy();
    expect(subject.associatedModel.get('title')).toEqual('The New Title');
    expect(subject.attributes.associated_model).toBeUndefined();
  });

  it("hasMany should update the association when its attribute changes", function() {
    subject = new SubjectModel(fixture);
    subject.hasMany({associated_collection: {collection: AssociatedCollection}});
    subject.set({associated_collection: [
      {id: 4, title: "Item Four"},
      {id: 5, title: "Item Five"}
    ]});
    expect(subject.associatedCollection.length).toEqual(2);
    expect(subject.associatedCollection.first().get('id')).toEqual(4);
    expect(subject.attributes.associated_collection).toBeUndefined();
  });

  it("should have a setter on the association name", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    expect(typeof subject.setAssociatedModel).toEqual('function');
  });

  it("should update the assoc and trigger a change event when the setter is passed an object", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    var callback = sinon.spy();
    subject.bind('change:associatedModel', callback);
    subject.setAssociatedModel({foo: 'bar'});
    expect(subject.associatedModel instanceof AssociatedModel).toBeTruthy();
    expect(callback.called).toBeTruthy();
  });

  it("should just add the model when the setter is passed a model", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    var newModel = new Duckbone.Model();
    subject.setAssociatedModel(newModel);
    expect(subject.associatedModel.cid).toEqual(newModel.cid);
  });

  it("should trigger a remove event when the setter is used and it has an existing association", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    var callback = sinon.spy();
    subject.bind('remove:associatedModel', callback);
    subject.setAssociatedModel();
    expect(callback.called).toBeTruthy();
  });

  it("should not trigger a remove event when the setter is used and it has no existing association", function() {
    subject = new SubjectModel();
    subject.hasOne({associated_model: {model: AssociatedModel}});
    var callback = sinon.spy();
    subject.bind('remove:associatedModel', callback);
    subject.setAssociatedModel({foo: 'bar'});
    expect(callback.called).toBeFalsy();
  });

  it("should not trigger an add event when the setter is passed nothing", function() {
    subject = new SubjectModel(fixture);
    subject.hasOne({associated_model: {model: AssociatedModel}});
    var callback = sinon.spy();
    subject.bind('add:associatedModel', callback);
    subject.setAssociatedModel();
    expect(callback.called).toBeFalsy();
  });

});