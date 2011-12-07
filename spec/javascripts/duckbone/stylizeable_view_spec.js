describe('Duckbone.StylizableView', function() {

  var subject, testViewClass;
  var templateFixture = '<div>My <b>pet</b> is a <span class="pet">cat</span></div>';

  beforeEach(function() {
    testViewClass = Backbone.View.extend();
    _.extend(testViewClass.prototype, Duckbone.TemplateableView, Duckbone.StylizeableView);
    _.extend(testViewClass.prototype, {
      template: Duckbone.Handlebars.compile(templateFixture),
      styles: {
        'el': {color: 'blue'},
        'el.hot': {color: 'rgb(204, 0, 0)'},
        'b': {color: 'green'},
        'span.pet': {color: 'red'}
      },
      initialize: function() {
        this.render();
      },
      render: function() {
        this.renderTemplate();
        this.applyStyles();
        return this;
      },
    });
    subject = new testViewClass();
  });

  it("Applies styles on init render", function() {
    var boldColor = $(subject.el).find('b').css('color');
    expect(boldColor).toEqual('green');
    var spanColor = $(subject.el).find('span.pet').css('color');
    expect(spanColor).toEqual('red');
  });

  it("Applies styles when rendering again", function() {
    subject.render();
    var boldColor = $(subject.el).find('b').css('color');
    expect(boldColor).toEqual('green');
    var spanColor = $(subject.el).find('span.pet').css('color');
    expect(spanColor).toEqual('red');
  });

  it("Applies styles to the root element", function() {
    subject.render();
    var elColor = $(subject.el).css('color');
    expect(elColor).toEqual('blue');
  });

  it("Applies class-based styles to the root element", function() {
    $(subject.el).addClass('hot');
    subject.render();
    var elColor = $(subject.el).css('color');
    expect(elColor).toEqual('rgb(204, 0, 0)');
  });

});
