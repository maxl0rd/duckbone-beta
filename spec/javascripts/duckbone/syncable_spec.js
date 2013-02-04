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

    describe('.sync', function() {

      describe('with model.urlRoot defined', function() {

        it("uses restful json urls for read", function() {
          server.respondWith('GET', '/goals/3',
          [200, {'Content-Type': 'application/json'}, '{}'])
          jqXHR = subject.fetch();
          server.respond();
          expect(jqXHR.status).toEqual(200);
        });

        it("uses restful json urls for update", function() {
          server.respondWith('PUT', '/goals/3',
          [200, {'Content-Type': 'application/json'}, '{}'])
          jqXHR = subject.save();
          server.respond();
          expect(jqXHR.status).toEqual(200);
        });

        it("uses restful json urls for delete", function() {
          server.respondWith('DELETE', '/goals/3',
          [200, {'Content-Type': 'application/json'}, '{}'])
          jqXHR = subject.destroy();
          server.respond();
          expect(jqXHR.status).toEqual(200);
        });
      });

      it('does not allow sync to be called again until the first request returns', function() {
        server.respondWith('PUT', '/goals/3',
        [200, {'Content-Type': 'application/json'}, '{}'])
        jqXHR = subject.save();
        expect($.active).toEqual(1);
        var invalidReturnResponse = subject.save();
        expect($.active).toEqual(1);
        expect(invalidReturnResponse).toBeFalsy();
        expect(subject._pendingJqXHR).toBeDefined();
      });

      it('allows sync to be called again after the first request returns', function() {
        server.respondWith('PUT', '/goals/3',
        [200, {'Content-Type': 'application/json'}, '{}'])
        jqXHR = subject.save();
        server.respond();
        expect($.active).toEqual(1);
        expect(subject._pendingJqXHR).not.toBeDefined();
        var jqXHR = subject.save();
        expect($.active).toEqual(2);
        expect(jqXHR).toBeDefined();
      });

      it('allows another sync to be called in the success callback', function() {
        server.respondWith('PUT', '/goals/3',
        [200, {'Content-Type': 'application/json'}, '{}'])
        jqXHR = subject.save({}, {
          success: function() {
            expect(subject._pendingJqXHR).toBeUndefined();
          }
        });
        server.respond();
      });
    });

    describe('.fetch', function() {

      it("calls the success handler on success", function() {
        server.respondWith('GET', '/goals/3', [200, {'Content-Type': 'application/json'}, '{}'])
        var success = sinon.spy();
        subject.fetch({success: success});
        server.respond();
        expect(success.called).toBeTruthy();
      });

      it("calls the error handler on error", function() {
        Duckbone.unbind('sync:500'); // Silence the alert
        server.respondWith([500, {}, "Server Error"]);
        var error = sinon.spy();
        subject.fetch({error: error});
        server.respond();
        expect(error.called).toBeTruthy();
      });

      it("triggers a sync:read event on model.fetch", function() {
        var handler = sinon.spy();
        subject.bind('sync:read', handler);
        subject.fetch();
        expect(handler.called).toBeTruthy();
      });

      it("triggers a sync:complete event when it is done", function() {
        server.respondWith('GET', '/goals/3',
        [200, {'Content-Type': 'application/json'}, '{}'])
        var handler = sinon.spy();
        subject.bind('sync:complete', handler);
        subject.fetch();
        server.respond();
        expect(handler.called).toBeTruthy();
      });

      it("triggers a sync:success event when it is a 200", function() {
        server.respondWith('GET', '/goals/3',
        [200, {'Content-Type': 'application/json'}, '{}'])
        var handler = sinon.spy();
        subject.bind('sync:success', handler);
        subject.fetch();
        server.respond();
        expect(handler.called).toBeTruthy();
      });

    });

    describe('.save', function() {

      describe('when valid', function() {
        it("triggers a sync:create event on a new model save", function() {
          var handler = sinon.spy();
          delete subject.id
          subject.bind('sync:create', handler);
          subject.save();
          expect(handler.called).toBeTruthy();
        });

        it("triggers a sync:update event on an existing model save", function() {
          var handler = sinon.spy();
          subject.bind('sync:update', handler);
          subject.save();
          expect(handler.called).toBeTruthy();
        });
      });

      describe('when invalid', function() {
        it("triggers a sync:error event when it is a 404", function() {
          server.respondWith('PUT', '/goals/3',
          [404, {'Content-Type': 'application/json'},  "Not found"])
          var handler = sinon.spy();
          subject.bind('sync:error', handler);
          subject.save();
          server.respond();
          expect(handler.called).toBeTruthy();
        });

        it("triggers a sync:invalid event when it is a 422", function() {
          server.respondWith('PUT', '/goals/3',
          [422, {'Content-Type': 'application/json'},  '{}'])
          var handler = sinon.spy();
          subject.bind('sync:invalid', handler);
          subject.save();
          server.respond();
          expect(handler.called).toBeTruthy();
        });

        it("adds the errors to the model when it is a 422", function() {
          server.respondWith('PUT', '/goals/3',
          [422, {'Content-Type': 'application/json'},  '{}'])
          subject.save();
          server.respond();
          expect(subject.errors).toBeDefined();
        });
      });
    });

    describe('.destroy', function() {

      it("triggers a sync:delete event on a model delete", function() {
        var handler = sinon.spy();
        subject.bind('sync:delete', handler);
        subject.destroy();
        expect(handler.called).toBeTruthy();
      });

    });

  });

  describe("Syncable Collection", function() {

    beforeEach(function() {
      subject = new collectionClass();
      subject.url = "/goals";
    });

    describe(".create", function() {
      it("makes an ajax POST", function() {
        server.respondWith('POST', '/goals',
        [200, {'Content-Type': 'application/json'}, '{}'])
        var model = new modelClass();
        subject.create(model);
        server.respond();
        expect(subject.first()).toEqual(model);
      });
    });

    describe(".url", function() {
      it("forms restful json urls for the models it creates", function() {
        server.respondWith('POST', '/goals',
        [200, {'Content-Type': 'application/json'}, '{id: 1}'])
        server.respondWith('PUT', '/goals/3',
        [200, {'Content-Type': 'application/json'}, '{id: 1}'])
        var model = new modelClass();
        subject.create(model);
        server.respond();
        model = subject.first();
        jqXHR = model.save();
        server.respond();
        expect(jqXHR.status).toEqual(200);
      });
    });

  });

});