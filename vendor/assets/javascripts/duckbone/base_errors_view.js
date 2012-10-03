(function () {

  Duckbone.BaseErrorsView = Duckbone.View.extend({
    afterInitialize: function() {
      this.weakBindTo(this.model, "change", _.bind(this.render, this));
    },

    render: function() {
      $(this.el).empty();
      if (this.model.hasBaseMessages()) {
        var list = $('<ul class="error"></ul>');
        _.each(this.model.baseMessages(), function (message) {
          list.append($("<li/>").text(message));
        });
        $(this.el).append(list);
      }
    }
  });

}).call();
