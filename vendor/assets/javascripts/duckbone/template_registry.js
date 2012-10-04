/**
# Duckbone.TemplateRegistry
The TemplateRegistry manages a set of packaged template data and serves
compiled templates to be used by TemplateableView.
*/
(function() {

  // Template Data is by default in Duckbone.TemplatesData
  var TEMPLATES_DATA = "TemplatesData";
  var PARTIALS_DATA = "PartialsData";

  // ### TemplateRegistry
  Duckbone.TemplateRegistry = function(options) {
    options = options || {};
    this.compiledTemplates = {};
    this.templatesData = options.templatesData;
    this.partialsData = options.partialsData;
    this.templatesCompiled = false;
    this.partialsCompiled = false;
  }

  _.extend(Duckbone.TemplateRegistry.prototype, {

    // #### function refresh
    // Discard all compiled templates, and look for new templates
    refresh: function() {
      this.compiledTemplates = {};
      this.templatesCompiled = false;
      this.partialsCompiled = false;
      locateTemplates(this);
    },

    // #### function compile
    // Compile all templates found in the registry immediately
    compile: function() {
      compileTemplates(this);
    },

    // #### function get
    // - src - a template name
    // - returns - the compiled template for the given name
    //
    // Note that a side effect of calling `get` is that all partials are compiled,
    // since Handlebars requires this before compiling any templates.
    // However, get will only compile the desired template as needed.
    get: function(src) {
      locateTemplates(this);
      compilePartials(this);
      compileTemplates(this, src);
      return this.compiledTemplates[src];
    }
  });

  // Internal functions

  function locateTemplates(context) {
    if (!context.templatesData) {
      context.templatesData = Duckbone[TEMPLATES_DATA];
    }
    if (!context.partialsData) {
      context.partialsData = Duckbone[PARTIALS_DATA];
    }
  }

  function compileTemplates (context, src) {
    if (context.templatesCompiled) return;
    locateTemplates(context);
    compilePartials(context);
    if (context.templatesData && src) {
      // compile one template
      context.compiledTemplates[src] = compileTemplate(context.templatesData[src], src);
    } else if (context.templatesData) {
      // compile all of them
      _.each(_.keys(context.templatesData), function(key) {
        context.compiledTemplates[key] = compileTemplate(context.templatesData[key], key);
      }, context);
      context.templatesCompiled = true;
    }
  }

  function compilePartials(context) {
    if (context.partialsCompiled) return;
    locateTemplates(context);
    if (context.partialsData) {
      _.each(_.keys(context.partialsData), function(key) {
        Handlebars.registerPartial(key, compileTemplate(context.partialsData[key], key));
      }, context);
      context.partialsCompiled = true;
    }
  }

  function compileTemplate(templateData, src) {
    src = src || "";
    if (templateData !== undefined) {
      try {
        return Duckbone.Handlebars.compile(templateData);
      } catch (e) {
        _.log("Syntax Error in Template " + src);
        _.log(e.message);
        return Duckbone.Handlebars.compile('<div class="duckbone_error">Syntax Error in Template ' + src + '<div class="duckbone_message">' + e.message + '</div></div>');
      }
    }
  }

}).call(this);