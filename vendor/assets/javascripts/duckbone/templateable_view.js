/**
# Duckbone.TemplateableView

This mixin enables any view to use Duckbone Handlebars templates. Most views in a
typical application should use templates and this mixin is included in Duckbone.View.

This file also defines many additional Handlebars helpers that provide additional
Duckbone-specific functionality.

## Usage

To assign a template to a view, do one of the following

- Define the View's `templateName` property. This should be the same as the file name in the
  templates folder, with slashes changed to underscores. So "posts/post" => "posts_post".
  This is the preferred usage.
- Define the View's `templateData` property as a raw string Handlebars template
- Define the View's `template` property as a compiled Handlebars template

Templates are *always* rendered in the context of the View's `model` property.

Use the Duckbone helpers to provide additional functionality:

- {{#if}} now understands functions, so you can use any function that returns a Boolean value
- {{#each}} now understands Collections, so you can iterate over a Collection's models with it
- {{attribute}} will automatically include Model attributes
- {{attr "foo"}} includes a Model attribute and also updates on any model changes
- {{child "fooView"}} includes another view

### Overriding the Default Render Function

The view lifecycle provides a default render function for you that renders the template. If you
need to do more work in render, just redefine it, calling `renderTemplate()` somewhere.

    render: function() {
      this.renderTemplate();
      // do other stuff here, like ...
      return this
    }

### Using Sub-Views

When a view includes another view, use the following technique:

- Define the subview in the parent's `createChildren` callback. The view lifecycle will call this
  automatically during renderTemplate. Assign the subview to the parent, ie `this.mySubView`
- Use the `{{child}}` helper in the parent's template, ie {{child "mySubView"}}
- Teardown is automatic

For example:

    ParentView = Duckbone.View.extend({
      templateData: '<div>Parent View</div>
        <div class="childStuff">{{child "childView"}}</div>',
      createChildren: function() {
        {
          childView: new Duckbone.View()
        }
      }
    })

*/
(function() {

  // ### Template Registry

  // Create a template registry that only lives in this context
  var templateRegistry = new Duckbone.TemplateRegistry();

  Duckbone.TemplateableView = {

    // ### Mixin

    // #### property isTemplateableView
    // Indicates the presence of this mixin
    isTemplateableView: true,

    // ##### function included
    // Also includes ViewLifecycleExtensions and NestableView
    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
      if (!this.isNestableView) {
        Duckbone.include(this, Duckbone.NestableView);
      }
    },

    // #### property templateRegistry
    // Give every TemplateableView access to the global template registry.
    // This can be overridden to specify a different source of templates.
    templateRegistry: templateRegistry,

    // #### function getTemplate
    // - templateName - the string name of the template in the templateRegistry
    // - allowEmpty - if true, don't set a "missing template" template on not-found
    // - returns - a compiled Handlebars template
    //
    // Finds the template in the View's templateData, options or the templateRegistry.
    // Returns a "missing template" if none is found, unless `allowEmpty` is true.
    getTemplate: function(templateName, allowEmpty) {
      this.templateData = this.options.templateData || this.templateData || null;
      if (this.templateData) {
        this.template = Duckbone.Handlebars.compile(this.templateData);
      } else {
        templateName = templateName || this.options.templateName || this.templateName || "";
        this.template = this.templateRegistry.get(templateName);
        if (!this.template && !allowEmpty) {
          this.template = Duckbone.Handlebars.compile("<div>Missing Template \"" + templateName + "\"</div>");
        }
      }
      return this.template
    },

    // #### function renderTemplate
    // - context - the object to use as a template context, defaulting to the view's `model` property
    // - returns - the view itself, for compatibility with the `render` return convention
    //
    // The template can be found in any of the following places:
    //  `this.options.template`, `this.template`, `this.templateName`, `this.options.templateName`.
    // Then it renders the template in the context of its model.
    // The output replaces the entire html content of the view's container element.
    // Pass a different context param to render from a different context.
    // ie `this.renderTemplate({some_different: "data"});`
    // Attempts to replicate typical server-side templating behavior in which
    // errors in development will show as error messages in place in the template,
    // and errors in a production environments will result in a server error.
    // Also prints useful error messages to the console.
    renderTemplate: function(context) {

      // Set up context and template
      var context = context || this.model || {};
      if (_.isFunction(this.options.template)) {
        this.template = this.options.template;
      } else if (!this.template) {
        this.getTemplate();
      }
      if (!this.template) throw("renderTemplate called without a template.")

      // Remove any existing child views
      this.removeNestedViews();

      // Unbind any previous data bindings
      if (this.isBindableView) this.unbindAttributes();

      // Render the HTML template, and if it fails, output as much info as possible
      // 500 Error on exceptions in production
      try {
        $(this.el).empty().html(this.template(context));
      } catch(e) {
        _.log("Handlebars threw an exception rendering your template:");
        _.log(e.message);
        _.log("Context:");
        _.log(context);
        if (Duckbone.Rails.isDevelopment()) {
          $(this.el).html('<div class="duckbone_error">Handlebars exception: ' + e.message + '</div>');
        } else {
          Duckbone.serverError();
          throw(e);
        }
      }

      // Establish any data-bindings that are defined by {{attr "attribute"}} helpers
      if (this.isBindableView && context instanceof Backbone.Model) {
        $(this.el).find('span[data-bind]').each(_.bind(function(i, span) {
          var attr = $(span).attr('data-bind').slice(5); // ie data-bind="attr_title"
          var binding = 'span[data-bind="attr_' + attr + '"]';
          this.bindAttribute(context, attr, binding);
        }, this));
      }

      // Create the child views
      this.setupNestedViews();

      // Include child views where they belong in the DOM
      $(this.el).find('*[data-child-view]').each(_.bind(function(i, div) {
        var childName = $(div).attr('data-child-view');
        var child = this.children[childName]
        if (child instanceof Backbone.View) {
          $(div).replaceWith(child.el); // swap placeholder for childView
          $(child.el).attr({'data-child-view': childName});
          child.delegateEvents();
        } else {
          throw("Unknown child view " + childName);
        }
      }, this));

      // Assign a descriptive class name to the element
      var templateName = this.options.templateName || this.templateName;
      if (this.templateName) {
        $(this.el).addClass(this.templateName);
      }

      // Mark rendered and return self, so the final call in render in coffee returns itself by convention
      this.templateRendered = true;
      return this
    },

    // #### function renderTemplateOnce
    // - context - the template rendering context
    // - returns - the view itself
    //
    // Calls `renderTemplate` if it hasn't been called before.  This is useful in a
    // custom render method if you want to render a template when the view is initialized
    // and then use DOM manipulation to keep the HTML up to date in subsequent renders.
    renderTemplateOnce: function (context) {
      if (!this.templateRendered) this.renderTemplate(context);
      return this;
    }

  }

  // ### Handlebars Helpers

  // #### helper {{#if}}
  // Allow #if to reference a function property that returns true or false.
  Handlebars.helpers['oldIf'] = Handlebars.helpers['if']
  Handlebars.registerHelper('if', function(context, fn, inverse) {
    var condition = typeof context === "function" ? context.call(this) : context;
    return Handlebars.helpers['oldIf'].call(this, condition, fn, inverse);
  });

  // #### helper {{#each}}
  // Improve the standard `each` helper so that it understands Backbone collections.
  // This will iterate over the models in a Backbone collection.
  Handlebars.helpers['oldEach'] = Handlebars.helpers['each']
  Handlebars.registerHelper('each', function(context, fn, inverse) {
    if (context.models) {
      context = context.models;
    }
    return Handlebars.helpers['oldEach'].call(this, context, fn, inverse);
  });

  // #### helper {{attr}}
  // The "attr" helper renders a model's attribute, and binds the view to any changes on that
  // attribute. Handlebars can automatically find attributes as paths, so this is only necessary
  // if you want to bind to changes.
  Handlebars.registerHelper('attr', function(attribute) {
    return new Handlebars.SafeString(
      '<span data-bind="attr_' + Handlebars.Utils.escapeExpression(attribute) + '">' +
      Handlebars.Utils.escapeExpression(this.get(attribute)) +
      '</span>'
    );
  });

  // #### helper {{child}}
  // The "child" helper indicates where sub-views should be included in a template.
  // `renderTemplate()` will look for a view with this name defined as a prop on the parent view
  // and replace this placeholder element.
  Handlebars.registerHelper('child', function(childName) {
    return new Handlebars.SafeString(
      '<script type="text/x-placeholder" data-child-view="' + Handlebars.Utils.escapeExpression(childName) + '"></script>'
    );
  });

}).call(this);

