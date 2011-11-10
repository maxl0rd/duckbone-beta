(function() {
  // Heavily inspired by SproutCore's use of Handlebars

  Duckbone.Handlebars = {};

  Duckbone.Handlebars.JavaScriptCompiler = function() {};
  ctor = function() {};
  ctor.prototype = Handlebars.JavaScriptCompiler.prototype;
  Duckbone.Handlebars.JavaScriptCompiler.prototype = new ctor();
  Duckbone.Handlebars.JavaScriptCompiler.prototype.compiler = Duckbone.Handlebars.JavaScriptCompiler;

  Duckbone.Handlebars.JavaScriptCompiler.prototype.nameLookup = function(parent, name, type) {
    if (type === 'context') {
      return "Duckbone.Handlebars.getAttr(" + parent + ", " + this.quotedString(name) + ");";
    } else {
      return Handlebars.JavaScriptCompiler.prototype.nameLookup.call(this, parent, name, type);
    }
  };


  Duckbone.Handlebars.getAttr = function(object, key) {
    if (/^[0-9]+$/.test(name)) {
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

  Duckbone.Handlebars.compile = function(string, options) {
    var ast = Handlebars.parse(string);
    var environment = new Handlebars.Compiler().compile(ast, options);
    return new Duckbone.Handlebars.JavaScriptCompiler().compile(environment, options);
  };
}).call();
