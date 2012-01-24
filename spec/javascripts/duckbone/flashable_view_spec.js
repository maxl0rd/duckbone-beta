describe("Duckbone.FlashableView", function() {
  var flashesSelector = "#flashesContainer";

  beforeEach(function () {
    var flashesContainer = $('<div id="flashesContainer"></div>');
    $("body").append(flashesContainer);
  });

  afterEach(function () {
    $(flashesSelector).remove();
  });

  it("renders a flash within its selector", function() {
    var flashableViewConstructor = Backbone.View.extend({});
    Duckbone.include(Backbone.View.prototype, Duckbone.FlashableView);
    var flashableView = new flashableViewConstructor();
    flashableView.configureFlash({
      container: flashesSelector,
      noticeDuration: 0,
      fadeDuration: 0
    });
    flashableView.flashNotice("Hello", 1000);
    expect($(flashesSelector).text()).toContain("Hello");
  });
});
