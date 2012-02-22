(function(){

  Duckbone.ErrorList = function(model) {
    this.model = model;
    this.messages = {};
    this.model.bind("change", this.clearMessages, this);
    this.model.bind("error", this.updateMessages, this);
  };

  _.extend(Duckbone.ErrorList.prototype, Backbone.Events, {
    hasBaseMessages: function() {
      return !_.isEmpty(this.messages.base);
    },

    clearMessages: function() {
      this.messages = {};
      this.trigger("change");
    },

    updateMessages: function(model, response) {
      this.messages = JSON.parse(response.responseText).errors;
      this.trigger("change");
    },

    baseMessages: function() {
      return this.messages.base || [];
    }
  });

}).call();
