/**
# Handlebars Extensions
Provides additional functionality to the Handlebars core as needed by Duckbone.
Parts of this are heavily inspired by SproutCore's use of Handlebars.
*/

(function() {

  Duckbone.Handlebars = {};

  // Extend the existing JavaScriptCompiler
  Duckbone.Handlebars.JavaScriptCompiler = function() {};
  ctor = function() {};
  ctor.prototype = Handlebars.JavaScriptCompiler.prototype;
  Duckbone.Handlebars.JavaScriptCompiler.prototype = new ctor();
  Duckbone.Handlebars.JavaScriptCompiler.prototype.compiler = Duckbone.Handlebars.JavaScriptCompiler;

  // Extend nameLookup to use `getAttr`
  Duckbone.Handlebars.JavaScriptCompiler.prototype.nameLookup = function(parent, name, type) {
    if (type === 'context') {
      return "Duckbone.Handlebars.getAttr(" + parent + ", " + this.quotedString(name) + ");";
    } else {
      return Handlebars.JavaScriptCompiler.prototype.nameLookup.call(this, parent, name, type);
    }
  };

  // Extend name resolution so that Backbone model attributes are detected when specified
  // as normal Handlebars paths, for example "{{mymodel/myattribute}}"
  Duckbone.Handlebars.getAttr = function(object, key) {
    if (/^[0-9]+$/.test(key)) {
      return object[parseInt(key)];
    }
    if (object[key] != undefined) {
      if (typeof object[key] == 'function') {
        return object[key].call(object);
      } else {
        return object[key];
      }
    }
    return object.get(key);
  }

  // Use the extended JavascriptCompiler
  Duckbone.Handlebars.compile = function(string, options) {
    var ast = Handlebars.parse(string);
    var environment = new Handlebars.Compiler().compile(ast, options);
    return new Duckbone.Handlebars.JavaScriptCompiler().compile(environment, options);
  };
}).call();
