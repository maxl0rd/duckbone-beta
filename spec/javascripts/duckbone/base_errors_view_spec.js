describe("Duckbone.BaseErrorsView", function() {
  it("starts out empty", function() {
    expect(view.el).not.toHaveSomeContent();
  });

  it("renders errors when they're added", function() {
    errorList.setBaseMessages(["one", "two"]);
    expect(view.el).toContain("ul.error li:contains('one')");
    expect(view.el).toContain("ul.error li:contains('two')");
  });

  it("empties when errors are cleared", function() {
    errorList.setBaseMessages(["one", "two"]);
    errorList.clearBaseMessages();
    expect(view.el).not.toHaveSomeContent();
  });

  beforeEach(function() {
    errorList = new FakeErrorList();
    view = new Duckbone.BaseErrorsView({ model: errorList });
  });

  var FakeErrorList = function() {
    this.messages = {};
  };
  _.extend(FakeErrorList.prototype, Backbone.Events, {
    hasBaseMessages: function() {
      return !_.isEmpty(this.messages);
    },

    baseMessages: function() {
      return this.messages;
    },

    setBaseMessages: function(messages) {
      this.messages = messages;
      this.trigger("change");
    },

    clearBaseMessages: function() {
      this.setBaseMessages([]);
    }
  });

  var view, errorList;
});
