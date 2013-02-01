describe("Duckbone.AssociableModel", function() {

  var SubjectModel, AssociatedModel, AssociatedCollection;

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

  describe(".hasOne", function() {

    describe("initializing with association data", function() {
      beforeEach(function() {
        subject = new SubjectModel(fixture);
        subject.hasOne({associated_model: {model: AssociatedModel}});
      });

      it("creates a setter on the association name", function() {
        expect(typeof subject.setAssociatedModel).toEqual('function');
      });

      it("creates the associated model", function() {
        expect(subject.associatedModel).toBeDefined();
        expect(subject.associatedModel instanceof AssociatedModel).toBeTruthy();
      });

      it("moves the attributes to the associated model", function() {
        expect(subject.associatedModel.attributes.title).toEqual(fixture.associated_model.title);
        expect(subject.associatedModel.attributes.associated_model).toEqual(undefined);
      });

      it("creates a reciprocal belongsTo relation", function() {
        expect(subject.associatedModel.subject).toBeDefined();
      });
    });

    describe("initializing without association data", function() {
      beforeEach(function() {
        subject = new SubjectModel();
        subject.hasOne({associated_model: {model: AssociatedModel}});
      });

      it("creates a null property for the association", function() {
        expect(subject.hasOwnProperty('associatedModel')).toBeTruthy()
        expect(subject.associatedModel).toEqual(null);
      });
    });

    describe(".set", function() {
      describe("with an associated model", function() {
        beforeEach(function() {
          subject = new SubjectModel(fixture);
          subject.hasOne({associated_model: {model: AssociatedModel}});
        });

        it("updates the association when its attribute changes", function() {
          var associationIdBefore = subject.associatedModel.cid;
          subject.set({associated_model: {title: 'The New Title'}});
          var associationIdAfter = subject.associatedModel.cid;
          expect(subject.associatedModel.get('title')).toEqual('The New Title');
          expect(associationIdAfter).toEqual(associationIdBefore);
          expect(subject.attributes.associated_model).toBeUndefined();
        });

        it("updates the association and triggers a change event when the setter is passed an object", function() {
          var callback = sinon.spy();
          subject.bind('change:associatedModel', callback);
          subject.setAssociatedModel({foo: 'bar'});
          expect(subject.associatedModel instanceof AssociatedModel).toBeTruthy();
          expect(callback.called).toBeTruthy();
        });

        it("creates the association when the attribute changes", function() {
          subject.set({associated_model: {title: 'The New Title'}});
          expect(subject.associatedModel instanceof AssociatedModel).toBeTruthy();
          expect(subject.associatedModel.get('title')).toEqual('The New Title');
          expect(subject.attributes.associated_model).toBeUndefined();
        });

        it("just adds the model when the setter is passed a model", function() {
          var newModel = new Duckbone.Model();
          subject.setAssociatedModel(newModel);
          expect(subject.associatedModel.cid).toEqual(newModel.cid);
        });

        it("triggers a remove event when the setter is used", function() {
          var callback = sinon.spy();
          subject.bind('remove:associatedModel', callback);
          subject.setAssociatedModel();
          expect(callback.called).toBeTruthy();
        });

        it("dooes not trigger an add event when the setter is passed nothing", function() {
          var callback = sinon.spy();
          subject.bind('add:associatedModel', callback);
          subject.setAssociatedModel();
          expect(callback.called).toBeFalsy();
        });
      });

      describe("with an empty associated model", function() {
        beforeEach(function() {
          subject = new SubjectModel();
          subject.hasOne({associated_model: {model: AssociatedModel}});
        });

        it("does not trigger a remove event", function() {
          var callback = sinon.spy();
          subject.bind('remove:associatedModel', callback);
          subject.setAssociatedModel({foo: 'bar'});
          expect(callback.called).toBeFalsy();
        });

      });

    });
  });

  describe(".hasMany", function() {

    describe("initializing with association data", function() {
      beforeEach(function() {
        subject = new SubjectModel(fixture);
        subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
      });

      it("creates an instance of the collection association", function() {
        expect(subject.associatedCollection instanceof AssociatedCollection).toBeTruthy();
        expect(subject.associatedCollection.length).toEqual(3);
      });

      it("moves the attributes to the associated collection", function() {
        expect(subject.associatedCollection.length).toEqual(fixture.associated_collection.length);
        expect(subject.associatedCollection.first().get('title')).toEqual("Item One");
      });

      it("creates a reciprocal belongsTo relation", function() {
        expect(subject.associatedCollection.subject.cid).toEqual(subject.cid);
      });

      it("creates a reciprocal belongsTo relation for the collection's models", function() {
        expect(subject.associatedCollection.at(0).subject.cid).toEqual(subject.cid);
      });
    });

    describe("initializing without association data", function() {
      beforeEach(function() {
        subject = new SubjectModel();
        subject.hasMany({associated_collection: {collection: AssociatedCollection}});
      });

      it("creates an empty collection", function() {
        expect(subject.associatedCollection instanceof AssociatedCollection).toBeTruthy();
        expect(subject.associatedCollection.length).toEqual(0);
      });
    });

    describe('.add', function() {
      beforeEach(function() {
        subject = new SubjectModel(fixture);
        subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
      });

      it("creates a reciprocal belongsTo relation for the collection's models on add", function() {
        var fourthItem = new AssociatedModel({id: 4, title: "Item Four"});
        expect(fourthItem.subject).toBeNull();
        subject.associatedCollection.add(fourthItem);
        expect(fourthItem.subject.cid).toEqual(subject.cid);
      });
    });

    describe('.reset', function() {
      beforeEach(function() {
        subject = new SubjectModel(fixture);
        subject.hasMany({associated_collection: {collection: AssociatedCollection, belongsTo: 'subject'}});
      });

      it("creates a reciprocal belongsTo relation for the collection's models on reset", function() {
        var fourthItem = new AssociatedModel({id: 4, title: "Item Four"});
        expect(fourthItem.subject).toBeNull();
        subject.associatedCollection.reset([fourthItem]);
        expect(fourthItem.subject.cid).toEqual(subject.cid);
      });
    });

    describe('.set', function() {
      beforeEach(function() {
        subject = new SubjectModel(fixture);
        subject.hasMany({associated_collection: {collection: AssociatedCollection}});
      });

      it("updates the association when its attribute changes", function() {
        subject.set({associated_collection: [
          {id: 4, title: "Item Four"},
          {id: 5, title: "Item Five"}
        ]});
        expect(subject.associatedCollection.length).toEqual(2);
        expect(subject.associatedCollection.first().get('id')).toEqual(4);
        expect(subject.attributes.associated_collection).toBeUndefined();
      });
    });

  });

  describe(".cloneWithAssociations", function() {
    var clone;

    beforeEach(function() {
      subject = new SubjectModel(fixture);
      subject.hasOne({associated_model: {model: AssociatedModel}});
      clone = subject.cloneWithAssociations();
    });

    it("clones the model", function() {
      expect(clone.id).toEqual(subject.id);
      expect(clone.get('title')).toEqual(subject.get('title'));
      expect(clone.cid).not.toEqual(subject.cid);
    });

    it("copies the associations to the clone", function() {
      expect(clone.associatedModel.cid).toEqual(subject.associatedModel.cid);
    });
  });

});