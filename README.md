## Duckbone

Duckbone is an extraction from [ImpulseSave](https://impulsesave.com/).

Duckbone provides everything you need to build single page web apps with [Backbone.js](http://documentcloud.github.com/backbone/) and Ruby on Rails.  Using a bit of asset pipeline magic and a set of JavaScript base classes and mixins it provides things like:

* Tightly-integrated templating with [Handlebars.js](http://www.handlebarsjs.com/)
* Data binding
* Nested models and associations
* Seamless integration with Rails-style RESTful APIs
* Declarative forms with client-side and server-side validations
* Extensible list views to build anything from from a to-do list to a stateful news feed
* Pagination compatible with `kaminari`, `will_paginate` and `sunspot`
* A robust view lifecycle that lets you focus on user experience instead of plumbing

Duckbone's philosophy emerged from @maxl0rd's experiences building several large projects with Backbone tempered by a modest dose of @jmileham's rubyist contrarianism.

### Installation

Add the `duckbone` gem to your Gemfile:

```ruby
# Your GemFile...

gem 'duckbone'
```

Update Bundler

```bash
$ bundle
```

Run the installer:

```bash
$ rails g duckbone:install
```

Start your server and look at it go:

[http://localhost:3000/duckbone](http://localhost:3000/duckbone)

### Compatibility

Duckbone requires Rails 3.1 or later. It provides all of its scripts and templates through the asset pipeline.

Duckbone works with all browsers that Backbone supports and is presently well-tested on:

- Internet Explorer 8+
- Mozilla Firefox 3.5+
- Apple Safari 4+
- Google Chrome


### Features

Duckbone extends Backbone with:

- Associations between models and collections
- List views that effortlessly manage collections of sub-views
- Pagination for `kaminari` and `will_paginate`
- Automatic pipelining of .hbs templates
- Integrated client and server-side form validations
- Declarative data-binding between models and DOM elements
- Weak event binding that avoids the pitfalls of short-lived views and long-lived models
- In-code templates and CSS styles for those that prefer the "everything in code" style of organization
- A view lifecycle that manages complex view initialization and teardown
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

### Modularity

Even though you will typically start building your app with the provided `Model`, `Collection` and `View` classes, Duckbone is carefully modularized, so you can strip your classes to down to the bare minimum. Each module is encapsulated in a mixin that is intended to be added to a Model, Collection, or View, and adds a small set of additional functionality. You're free to mix in those modules where they are needed, or create your own set of abstract classes that include Duckbone functionality.

A Duckbone module is mixed into a class with the method `Duckbone.include`. This method copies all of the mixin's properties over to the new class, and also executes a Ruby-style "included" callback that can add conditional functionality to the object. Usually, the mixin will be used to extend a class prototype. For example:

```js
var myFormView = Backbone.View.extend();
Duckbone.include(myView.prototype, Duckbone.EditableView);
```

There are almost no dependencies between Duckbone modules, with one notable exception. All of the "-View" modules also mix in Duckbone.ViewLifecycleExtensions to help automate the intricacies of initialization, rendering, and teardown.

### MIT LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
