## Duckbone

Duckbone consists of a modular set of extensions for the popular Backbone javascript framework that round out the common feature set necessary for building "one page" client-side web applications on Rails. These extras have been used extensively in several large projects and have proven to be robust tools that reduce redundant code, and make large applications more elegant.

The only additional dependency that Duckbone introduces is Handlebars.js, our preferred template language. Our view system requires smarter templates than Underscore provides, and Handlebars fits well. But it is not too hard to adapt Duckbone's template system to use another language if you insist.

### Compatibility

Duckbone is written for Rails 3.1 or later. It provides all of its scripts and templates through the asset pipeline. It is not intended to be used with earlier versions of Rails or other server-side frameworks. There is no concatenated and minified distribution, as this functionality exists within the pipeline itself.

Duckbone works with all browsers that Backbone supports:

- Internet Explorer 8+
- Mozilla Firefox 3.5+
- Apple Safari 4+
- Google Chrome

### Installation

To install, just add the `duckbone` gem to your Gemfile.

Add these lines to the application layout. The first line includes Backbone and its dependencies (jQuery and Underscore). The second adds all of the scripts in the Duckbone package. The third line packages all of the application's handlebars templates.

```html
<% include_javascripts 'backbone' %>
<% include_javascripts 'duckbone' %>
<% include_javascripts 'templates.js' %>
```

### Overview

Duckbone adds the following general capabilities to Backbone:

- A convention and set of helpers to manage associations between models and collections
- A list view that effortlessly manages collections of sub-views
- View and Collection mixins that manage a server-paginated collection of sub-views
- A tightly integrated template system and conventions for managing and packaging template files
- A better sync method that couples tightly with Rails and server-side validations
- Declarative data-binding between models and DOM elements
- Weak event binding that reduces memory leaks and unintended side effects
- In-code templates and CSS styles for those that prefer the "everything in code" style of organization
- A flexible view initialization lifecycle that simplifies complex view instantiation
- Basic compatibility with legacy ERB-based views

In addition, Duckbone implements a complete form handling system that makes writing client-side web forms as as easy as ERB.

- Author form templates without design constraints in Handlebars helpers
- Declaratively specify form field properties in the view
- Automatically bind form input to Backbone models
- Declare and display client-side validations
- Seamlessly integrate with server-side validations from Rails
- Keep client-side models clean by cloning them in and out of the edit workspace

Duckbone defaults to conventions and behaviors that should be familiar to Rails developers. For example:

- All Models expect to interact with RESTful controllers
- All ActiveRecord `has_one` and `has_many` associations can also exist in client-side models
- Model Sync reacts appropriately to standard HTTP responses and understands ActiveRecord errors
- Rendering errors are shown in development mode, but trigger server errors in production
- Pagination is compatible with either will_paginate or Kaminari

### Modules

Duckbone is carefully modularized, so that the developer may utilize only those extensions that he finds useful in his work. Each module is encapsulated in a mixin that is intended to be added to a Model, Collection, or View, and adds a small set of additional functionality. The developer is free to mix in those modules where they are needed, or create his own set of abstract classes that include Duckbone functionality.

A Duckbone module is mixed into a class with the `_.include` method that Duckbone adds to underscore. This method copies all of the mixin's properties over to the new class, and also executes a Ruby-style "included" callback that can add conditional functionality to the object. Usually, the mixin will be used to extend a class prototype. For example:

```js
var myFormView = Backbone.View.extend();
_.include(myView.prototype, Duckbone.EditableView);
```

There are almost no dependencies between Duckbone modules, with one notable exception. All of the "-View" modules also mix in Duckbone.ViewLifecycleExtensions to make initialization and teardown more accessible.

### MIT LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
