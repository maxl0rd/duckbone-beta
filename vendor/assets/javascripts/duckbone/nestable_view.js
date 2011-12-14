/**
# NestableView

NestableView provides automated setup and teardown of child views.  You just provide
a `createNestedViews` method that returns an object containing all of your child view
instances by name, like this

```javascript
createNestedViews: function() {
  return {
    myStuff: new StuffView({model: user.stuff})
  }
}
```

NestableView works hand-in-hand with TemplateableView's {{child}} helper.

*/

(function() {

  Duckbone.NestableView = {

    // #### property isNestableView
    // Indicates a view with this mixin included
    isNestableView: true,

    setupNestedViews: function() {
      if (this.createNestedViews) {
        this.nestedViews = this.createNestedViews();
      }
    },

    removeNestedViews: function() {
      if (this.nestedViews) {
        _.each(this.nestedViews, function(child) {
          child.remove();
        });
        delete this.nestedViews;
      }
    }
  }

})();