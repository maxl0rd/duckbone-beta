describe("Duckbone.Syncable", function() {

  var subject, server, modelClass, collectionClass, jqXHR;

  beforeEach(function() {
    server = sinon.fakeServer.create();

    modelClass = Backbone.Model.extend();
    Duckbone.include(modelClass.prototype, Duckbone.Syncable);

    collectionClass = Backbone.Collection.extend();
    Duckbone.include(collectionClass.prototype, Duckbone.Syncable);

  });

  describe("Syncable Model", function() {

    beforeEach(function() {
      subject = new modelClass();
      subject.id = "3";
      subject.urlRoot = "/goals";
    });

    // The server will only respond with a 200
    // if the ajax request is made to the given URL with the correct method

    it("should form restful json urls for read", function() {
      server.respondWith('GET', '/goals/3',
        [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
      jqXHR = subject.fetch();
      server.respond();
      expect(jqXHR.status).toEqual(200);
    });

    it("should form restful json urls for update", function() {
      server.respondWith('PUT', '/goals/3',
        [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
      jqXHR = subject.save();
      server.respond();
      expect(jqXHR.status).toEqual(200);
    });

    it("should form restful json urls for delete", function() {
      server.respondWith('DELETE', '/goals/3',
        [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
      jqXHR = subject.destroy();
      server.respond();
      expect(jqXHR.status).toEqual(200);
    });

    // Use spies to ensure callbacks are called

    it("should call the success handler on success", function() {
      server.respondWith('GET', '/goals/3', [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
      var success = sinon.spy();
      subject.fetch({success: success});
      server.respond();
      expect(success.called).toBeTruthy();
    });

    it("should call the error handler on error", function() {
      Duckbone.unbind('sync:500'); // Silence the alert
      server.respondWith([500, {}, "Server Error"]);
      var error = sinon.spy();
      subject.fetch({error: error});
      server.respond();
      expect(error.called).toBeTruthy();
    });

    it("should trigger a sync:read event on model.fetch", function() {
      var handler = sinon.spy();
      subject.bind('sync:read', handler);
      subject.fetch();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:create event on a new model save", function() {
      var handler = sinon.spy();
      delete subject.id
      subject.bind('sync:create', handler);
      subject.save();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:update event on an existing model save", function() {
      var handler = sinon.spy();
      subject.bind('sync:update', handler);
      subject.save();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:delete event on a model delete", function() {
      var handler = sinon.spy();
      subject.bind('sync:delete', handler);
      subject.destroy();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:success event when it is a 200", function() {
      server.respondWith('GET', '/goals/3',
        [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
      var handler = sinon.spy();
      subject.bind('sync:success', handler);
      subject.fetch();
      server.respond();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:complete event when it is done", function() {
      server.respondWith('GET', '/goals/3',
        [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
      var handler = sinon.spy();
      subject.bind('sync:complete', handler);
      subject.fetch();
      server.respond();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:invalid event when it is a 422", function() {
      server.respondWith('PUT', '/goals/3',
        [422, {'Content-Type': 'application/json'},  is.jasmine.responses.goal_error])
      var handler = sinon.spy();
      subject.bind('sync:invalid', handler);
      subject.save();
      server.respond();
      expect(handler.called).toBeTruthy();
    });

    it("should trigger a sync:error event when it is a 404", function() {
      server.respondWith('PUT', '/goals/3',
        [404, {'Content-Type': 'application/json'},  "Not found"])
      var handler = sinon.spy();
      subject.bind('sync:error', handler);
      subject.save();
      server.respond();
      expect(handler.called).toBeTruthy();
    });

    it("should add the errors to the model when invalid", function() {
      server.respondWith('PUT', '/goals/3',
        [422, {'Content-Type': 'application/json'},  is.jasmine.responses.goal_error])
      subject.save();
      server.respond();
      expect(subject.errors).toBeDefined();
    });

  });

  describe("Syncable Collection", function() {

     beforeEach(function() {
       subject = new collectionClass();
       subject.url = "/goals";
     });

     // The server will only respond with a 200
     // if the ajax request is made to the given URL with the correct method
     // The collection will only add the model if it is successfully saved

     it("should form restful json urls for create", function() {
       server.respondWith('POST', '/goals',
         [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
       var model = new modelClass();
       subject.create(model);
       server.respond();
       expect(subject.first()).toEqual(model);
     });

     it("should form restful json urls for the models it creates", function() {
       server.respondWith('POST', '/goals',
         [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
       server.respondWith('PUT', '/goals/3',
         [200, {'Content-Type': 'application/json'}, is.jasmine.responses.goal])
       var model = new modelClass();
       subject.create(model);
       server.respond();
       model = subject.first();
       expect(model.isNew()).toBeFalsy();
       jqXHR = model.save();
       server.respond();
       expect(jqXHR.status).toEqual(200);
     });

  });

});