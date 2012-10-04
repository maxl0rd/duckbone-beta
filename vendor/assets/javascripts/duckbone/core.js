/**
# Duckbone Core

This file is loaded first and just establishes some namespaces and useful helpers.
*/

(function() {

  // Establish top level namespaces
  window.Duckbone = window.Duckbone || {};
  Duckbone.helpers = Duckbone.helpers || {};
  Duckbone.forms = Duckbone.forms || {};
  Duckbone.TemplatesData = Duckbone.TemplatesData || {};
  Duckbone.PartialsData = Duckbone.PartialsData || {};

  // Establish Rails environment.
  // Default to 'production' if 'environment.js' has not been loaded
  Duckbone.Rails = Duckbone.Rails || {};
  Duckbone.Rails.environment = Duckbone.Rails.environment || 'production';
  _.extend(Duckbone.Rails, {
    isDevelopment: function() { return (this.environment == 'development') },
    isTest: function()        { return (this.environment == 'test')        },
    isProduction: function()  { return (this.environment == 'production')  }
  });

  // The top level Duckbone object dispatches some events
  _.extend(Duckbone, Backbone.Events);

  _.extend(Duckbone, {

    // #### function serverError
    // - message - error message text
    // - returns - nothing
    //
    // Defines default behavior for 500 errors. Log error in development mode.
    // Redirect to 500 page in production.
    serverError: function(message) {
      _.log("500 Server Error");
      if (message) _.log(message);
      if (Duckbone.Rails.isProduction()) {
        window.location = "/500.html"
      }
    },

    // #### function serverError
    // - message - error message text
    // - returns - nothing
    //
    // Default behavior for 404 errors.
    // Log error in development mode.
    // Redirect to 404 page in production.
    fileNotFound: function(message) {
      _.log("404 File Not Found");
      if (message) _.log(message);
      if (Duckbone.Rails.isProduction()) {
        window.location = "/404.html"
      }
    },

    // #### function register
    // - f - a function to register
    // - single - a boolean determining whether it should be single use, defaults to false
    // - returns - the string name of the registered function
    //
    // This util is used to simplify communication with a Flash ExternalInterface.
    // JavaScript callback functions can only be passed as string names,
    // and not as function references. This makes some things really hard,
    // and prohibits the use of anonymous functions.
    // This method wraps up a function and returns its string reference.
    register: function(f, single) {
      single = single || false;
      var funcName = _.uniqueId('regfunc');
      if (_.isUndefined(Duckbone.registeredFunctions)) {
        Duckbone.registeredFunctions = {};
      }
      if (single) {
        f = _.wrap(f, function(func) {
          func(arguments);
          delete Duckbone.registeredFunctions[funcName]
        });
      }
      Duckbone.registeredFunctions[funcName] = f;
      return "Duckbone.registeredFunctions." + funcName
    },

    // #### function wrapMethods
    // - object - the object to wrap methods on, ie a view
    // - wrapper - the wrapper function
    // - the rest of the args can be strings of method names,
    //   or a single array of the method name strings
    // - returns - nothing
    //
    // Wraps all of the given object methods in another function wrapper.
    // In the wrapper, "this" is defined as the original object.
    // For example, it's useful for wrapping all of a
    // Backbone view's event callbacks in a common wrapper.
    wrapMethods: function(object, wrapper) {
      var methods = Array.prototype.slice.call(arguments, 2);
      if (_.isArray(methods[0])) {
        methods = methods[0];
      }
      _.each(methods, function(method) {
        var wrappedFunction = object[method];
        object[method] = function() {
          var args = [wrappedFunction].concat(Array.prototype.slice.call(arguments));
          return wrapper.apply(object, args);
        };
      });
    },

    // #### function log
    // - msg - log message
    // - returns - nothing
    //
    // Suppress logs if console.log is undefined.
    // Suppress logs in production environments.
    log: function(msg) {
      if (Duckbone.Rails.isProduction()) return;
      if (window.console && console.log) console.log(msg);
    },

    // #### function include
    // - obj - the object to extend
    // - remaining arguments are objects from which to mix in properties and methods
    // - returns - nothing
    //
    // This is the core method used to add Duckbone mixins to new classes.
    // It extends a given object with all the properties in the passed-in object(s).
    // It works just like _.extend except that it throws an exception if you pass an undefined object,
    // ie. if you spell a mixin wrong, which you will.
    // Also calls included() on the mixin after mixing in the methods, which
    // can provide additional side-effects.
    include: function(obj) {
      if (typeof obj == "undefined") {
        throw("Attempt to include into undefined object.")
      }
      _.each(_.toArray(arguments).slice(1), function(source) {
        if (typeof source == 'undefined') {
          throw("Attempt to include undefined object.");
        }
        for (var prop in source) {
          if (prop != 'included' && source[prop] !== void 0) {
            if (!obj.hasOwnProperty(prop)) obj[prop] = source[prop];
          }
        }
        if (typeof source['included'] == 'function') source['included'].call(obj);
      });
      return obj;
    }
  }); // end _.extend

  _.extend(Duckbone.helpers, {

    dateToPrettyTimeAgo: function (date) {
      var min = Math.floor((new Date().getTime() - date.getTime()) / 60000);
      var remainder = min || 0, prettyTime = [], days, hours;
      if (remainder == 0) {
        return "just now";
      }
      if (remainder >= 1400) {
        days = Math.floor(remainder / 1440);
        remainder -= days * 1440;
        prettyTime[0] = days;
        prettyTime[0] += (days > 1) ? " days" : " day"
      }
      if (remainder >= 60) {
        hours = Math.floor(remainder / 60);
        remainder -= hours * 60;
        prettyTime[1] = hours;
        prettyTime[1] += (hours > 1) ? " hours" : " hour";
      }
      if (remainder > 0) {
        prettyTime[2] = remainder;
        prettyTime[2] += (remainder > 1) ? " minutes" : " minute"
      }
      return _.compact(prettyTime).join(', ') + " ago";
    }

  });

  // Mix in log to underscore
  _.mixin({
    log: Duckbone.log
  });

}).call();