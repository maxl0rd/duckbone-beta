describe("Duckbone.ModelHelpers", function() {

  var subject, collection, modelClass, server;

  beforeEach(function() {
    server = sinon.fakeServer.create();
    modelClass = Backbone.Model.extend();
    Duckbone.include(modelClass.prototype, Duckbone.ModelHelpers);
    subject = new modelClass();
    subject.urlRoot = '/foos';
    subject.set({id: 1});
    collection = new Backbone.Collection();
  });
});