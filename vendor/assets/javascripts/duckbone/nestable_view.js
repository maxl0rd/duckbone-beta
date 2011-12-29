/**
# Duckbone.NestableView

In the Duckbone View lifecycle, it is critical that the appropriate setup and teardown
happens for all views. Without this, weak bindings will not get unbound and many other
"zombie code" bugs will plague the developer. NestableView provides automated setup and
teardown of child views. This is primarily used by TemplateableView, and its `{{child}}` helper.

This mixin is included in `Duckbone.View`.

# Usage

Provide a `createChildren` method that returns an object containing child view
instances by name. For example:

    createChildren: function() {
      return {
        myStuff: new StuffView({model: user.stuff})
      }
    }

The `renderTemplate` method of TemplateableView will call
`setupNestedViews()` and `removeNestedViews()` as needed.
*/

(function() {

  Duckbone.NestableView = {

    // #### property isNestableView
    // Indicates the presence of this mixin
    isNestableView: true,

    // #### function setupNestedViews
    // Call `createChildren` and assign the returned views to the `children` property.
    setupNestedViews: function() {
      if (this.createChildren) {
        this.children = this.createChildren();
      }
    },

    // #### function removeNestedViews
    // Call `remove` on each child view.
    removeNestedViews: function() {
      if (this.children) {
        _.each(this.children, function(child) {
          child.remove();
        });
        delete this.children;
      }
    }
  }

})();