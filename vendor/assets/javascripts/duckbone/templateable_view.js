// TemplateableView
// ================
//
// This mixin enables any view to use Duckbone Handlebars templates. Most views in a
// typical application should use templates and this mixin is included in Duckbone.View.
//
// This file also defines many additional Handlebars helpers that provide additional
// Duckbone-specific functionality.
//
// ## Usage
//
// To assign a template to a view, do one of the following
//
// - Define the View's `templateName` property. This should be the same as the file name in the
//   templates folder, with slashes changed to underscores. So "posts/post" => "posts_post".
//   This is the preferred usage.
// - Define the View's `templateData` property as a raw string Handlebars template
// - Define the View's `template` property as a compiled Handlebars template
//
// Templates are *always* rendered in the context of the View's `model` property.
//
// Use the Duckbone helpers to provide additional functionality:
//
// - {{#if}} now understands functions, so you can use any function that returns a Boolean value
// - {{#each}} now understands Collections, so you can iterate over a Collection's models with it
// - {{attribute}} will automatically include Model attributes
// - {{attr "foo"}} includes a Model attribute and also updates on any model changes
// - {{child "fooView"}} includes another view
//
// ### Overriding the Default Render Function
//
// The view lifecycle provides a default render function for you that renders the template. If you
// need to do more work in render, just redefine it, calling `renderTemplate()` somewhere.
//
//     render: function() {
//       this.renderTemplate();
//       // do other stuff here, like ...
//       return this
//     }
//
// ### Using Sub-Views
//
// When a view includes another view, use the following technique:
//
// - Define the subview in the parent's `createChildren` callback. The view lifecycle will call this
//   automatically during renderTemplate. Assign the subview to the parent, ie `this.mySubView`
// - Use the `{{child}}` helper in the parent's template, ie {{child "mySubView"}}
// - Teardown is automatic
//
// For example:
//
//     ParentView = Duckbone.View.extend({
//       templateData: '<div>Parent View</div>
//         <div class="childStuff">{{child "childView"}}</div>',
//       createChildren: function() {
//         {
//           childView: new Duckbone.View()
//         }
//       }
//     })

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
    renderTemplate: function(context) {
      var context = context || this.model || {};
      this.ensureTemplate();
      this.removeNestedViews();
      if (this.isBindableView) this.unbindAttributes();
      try {
        // Render the handlebars template
        $(this.el).empty().html(this.template(context));
      } catch(e) {
        this.handleTemplateError(e, context);
      }
      if (this.isBindableView) this.bindAttributesToTemplate(context);
      this.setupNestedViews();
      this.placeChildrenInTemplate();
      this.decorateElement();
      this.templateRendered = true;
      return this
    },

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

    // #### function ensureTemplate
    // Ensures that the view has a valid template property, resolving if necessary.
    ensureTemplate: function() {
      if (_.isFunction(this.options.template)) {
        this.template = this.options.template;
      } else if (!this.template) {
        this.getTemplate();
      }
      if (!this.template) throw("TemplateableView requires a template.")
    },

    // #### function handleTemplateError
    // - error - an exception thrown by Handlebars during template rendering
    // - context - the template's render context
    //
    // In production environments, the normal behavior is to server error and rethrow the exception.
    // In development, output the error to the page and continue.
    handleTemplateError: function(error, context) {
      var templateName = this.templateName || '';
      var errorMessage = "Handlebars error rendering the template " + templateName + '. ';
      _.log(errorMessage);
      _.log(error.message);
      _.log("Context:");
      _.log(context);
      if (Duckbone.Rails.isProduction()) {
        Duckbone.serverError();
        error.message = errorMessage + error.message;
        throw(error);
      } else {
        $(this.el).html('<div class="duckbone_error">Handlebars exception: ' + error.message + '</div>');
      }
    },

    // #### function bindAttributesToTemplate
    // Integrate with BindableView and {{attr}} helpers.
    bindAttributesToTemplate: function(context) {
      context = context || this.model || {};
      if (this.isBindableView && context instanceof Backbone.Model) {
        $(this.el).find('span[data-bind]').each(_.bind(function(i, span) {
          var attr = $(span).attr('data-bind').slice(5); // ie data-bind="attr_title"
          var binding = 'span[data-bind="attr_' + attr + '"]';
          this.bindAttribute(context, attr, binding);
        }, this));
      }
    },

    // #### function placeChildrenInTemplate
    // Integrate with NestableView, placing child views into the rendered template.
    placeChildrenInTemplate: function() {
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
    },

    // #### function decorateElement
    // Provide convenience attributes on the container element.
    // The className is set to the templateName, providing a useful convention for
    // scoping CSS classes. A data-id attribute is also added to every element,
    // indicating which model the view represents.
    decorateElement: function() {
      var templateName = this.options.templateName || this.templateName;
      if (this.templateName) {
        $(this.el).addClass(this.templateName);
      }
      if (this.model && this.model.id) {
        $(this.el).attr({'data-id': this.model.id});
      }
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

