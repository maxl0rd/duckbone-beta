// StylizeableView
// ===============
//
// Some developers prefer to package their stylesheets in the code along with
// the views that they affect. This technique can avoid the common situation in
// which a monolithic stylesheet devolves into a mess of spaghetti with
// many dependencies that are difficult to resolve. The disadvantage of this
// approach is that it prohibits the use of newer CSS tools such as Compass,
// SASS, LESS, etc. that are easily leveraged through the asset pipeline.
//
// Duckbone.View comes with StylizeableView support, but a project can work
// equally well with or without using it.
//
// ## Usage
//
// Specify styles to be applied to all elements of the view in the `styles`
// property. This object is simply a map of selectors and the styles to apply.
// The syntax should be identical to that which would be passed to `jquery.css()`.
//
// Use the special selector 'el' to apply styles to the root element.
// 'el.className' also works
//
// For example:
//
//     styles: {
//       'el':      {'padding': '5px', 'margin': '5px'},
//       'el.hot':  {'color': 'red'},
//       'b.money': {'color': 'green'},
//       'li':      {'margin': '10px'}
//     }

(function() {

 Duckbone.StylizeableView = {

    // ### Mixin

    // #### property isStylizeableView
    // Indicates the presence of this mixin
    isStylizeableView: true,

    // #### function included
    // Also include ViewLifecycleExtensions
    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
    },

    // #### function applyStyles
    // - styles - a map of styles to apply to the children of this view,
    //   defaulting to the view's `styles` property.
    // - returns - nothing
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