describe("Duckbone.ErrorList", function() {
  it("starts out without base errors", function() {
    expect(list.hasBaseMessages()).not.toBeTruthy();
  });

  it("starts with empty base errors", function() {
    expect(list.baseMessages()).toEqual([]);
  });

  it("listens for error events", function() {
    model.triggerBaseMessages();
    expect(list.hasBaseMessages()).toBeTruthy();
  });

  it("clears errors after the model changes", function() {
    model.triggerBaseMessages();
    model.triggerChange();
    expect(list.hasBaseMessages()).not.toBeTruthy();
  });

  it("returns base messages", function() {
    var errors = ["one", "two"];
    model.triggerBaseMessages(errors);
    expect(list.baseMessages()).toEqual(errors);
  });

  it("triggers change events when errors are added", function() {
    var changeTriggered = false;
    list.bind("change", function () { changeTriggered = true; });
    model.triggerBaseMessages();
    expect(changeTriggered).toBeTruthy();
  });

  it("triggers change events when errors are cleared", function() {
    var changeTriggered = false;
    list.bind("change", function () { changeTriggered = true; });
    model.triggerChange();
    expect(changeTriggered).toBeTruthy();
  });

  it("ignores non-JSON responses", function() {
    model.triggerInvalidResponse();
    expect(list.baseMessages()).toEqual([]);
  });

  beforeEach(function() {
    model = new FakeModel();
    list = new Duckbone.ErrorList(model);
  });

  var FakeModel = function() {};
  _.extend(FakeModel.prototype, Backbone.Events, {
    triggerBaseMessages: function(errors) {
      this.trigger("error", model, responseWithBaseMessages(errors));
    },

    triggerInvalidResponse: function() {
      var invalidResponse = { responseText: 'not JSON' };
      this.trigger("error", model, invalidResponse);
    },

    triggerChange: function() {
      this.trigger("change");
    }
  });

  var responseWithBaseMessages = function(errors) {
    var errorString = JSON.stringify(errors || ["error"]);
    return { responseText: '{"errors":{"base":' + errorString + '}}' };
  }

  var list, model;
});
