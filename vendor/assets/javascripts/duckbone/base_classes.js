// Base Classes
// ============
//
// These base classes extend `Backbone.Model`, `Backbone.Collection` and `Backbone.View`
// to include the most commonly used modules of Duckbone.  Most apps will
// simply extend these base classes instead of the Backbone base classes directly
// unless they desire a high degree of customized behavior.
//
// This file also defines some other Duckbone core classes:
//
// * `Duckbone.FormView`, which mixes in all the
// functionality required for editing and/or saving models via web forms.
// * `Duckbone.Application`, which extends the Backbone router with declarative route actions
// and flash notice/alert management

(function() {

  // ### Duckbone.Model
  // extends `Backbone.Model` with `AssociableModel`, `ModelHelpers`
  // and `Syncable`
  Duckbone.Model = Backbone.Model.extend();

  Duckbone.include(Duckbone.Model.prototype,
    Duckbone.AssociableModel,
    Duckbone.ModelHelpers,
    Duckbone.Syncable
  );

  // ### Duckbone.Collection
  // extends `Backbone.Collection` with `CollectionHelpers` and `Syncable`
  Duckbone.Collection = Backbone.Collection.extend();

  Duckbone.include(Duckbone.Collection.prototype,
    Duckbone.CollectionHelpers,
    Duckbone.Syncable
  );


  // ### Duckbone.View
  // extends `Backbone.View` with `TemplateableView` and `BindableView`
  Duckbone.View = Backbone.View.extend();

  Duckbone.include(Duckbone.View.prototype,
    Duckbone.TemplateableView,
    Duckbone.BindableView
  );

  // ### Duckbone.FormView
  // further extends `Duckbone.View` with `EditableView`
  Duckbone.FormView = Duckbone.View.extend();

  Duckbone.include(Duckbone.FormView.prototype,
    Duckbone.EditableView
  );

  // ### Duckbone.ListView
  // Provides rendering of sets of submodels for lists and feeds
  Duckbone.ListView = Backbone.View.extend();

  Duckbone.include(Duckbone.ListView.prototype,
    Duckbone.ListableView, Duckbone.BindableView
  );

  // ### Duckbone.Application
  // Provides core functionality of a duckbone app
  Duckbone.Application = Backbone.Router.extend()

  Duckbone.include(Duckbone.Application.prototype,
    Duckbone.RouteableApplication,
    Duckbone.FlashableView)

})();