(function() {

 Duckbone.StylizeableView = {
    isStylizeableView: true,

    // Also include ViewLifecycleExtensions

    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
    },

    // Apply stylesheets that are contained on the view itself
    // These only apply to elements that are children of the view
    // Add them to the styles property as a hash of jquery selectors and css
    // Use the selector 'el' to apply styles to the root element
    // 'el.className' also works
    // styles: {
    //   'el':      {'padding': '5px'},
    //   'el.hot':  {'color': 'red'},
    //   'b.money': {'color': 'green'},
    //   'li':      {'margin': '10px'}
    // }

    // Apply the CSS to children of the view. Formatted as above

    applyStyles: function(styles) {
      styles = styles || this.styles || {};
      var tagName, className
      for (var selector in styles) {
        tagName = selector.split('.')[0];
        className = selector.split('.')[1];
        if (selector == 'el') {
          $(this.el).css(styles['el']);
        } else if (tagName == 'el' && className && $(this.el).hasClass(className)) {
          $(this.el).css(styles[selector]);
        } else {
          $(this.el).find(selector).css(styles[selector]);
        }
      }
    }

  }

}).call(this);