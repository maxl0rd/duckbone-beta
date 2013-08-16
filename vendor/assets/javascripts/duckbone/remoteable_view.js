// RemoteableView
// ==============
//
// A RemoteableView relies upon the server to render its contents. It can be used to
// integrate a legacy ERB view into a larger Duckbone application. Note that this is rarely
// a desireable situation, but there may be times when the developer must rely on this technique.
//
// ### Usage
//
// Set the 'url' property to the route where Rails will render the contents.
// Configure the route to respond to a normal html format request, and render
// the html without a layout.
//
// Set the loading property, and a "Loading..." message will be displayed the first
// time it renders.
//
// If a model is passed to the view's initialize method, then the view will render itself
// again whenever a _change_ event is received. Since this is expensive in terms of time and
// bandwidth, the rendering is debounced by 500ms. That is, many events occuring together will
// result in only a single render.

(function() {

  Duckbone.RemoteableView = {

    // #### property isRemoteableView
    // Indicates the presence of this mixin
    isRemoteableView: true,

    // #### property debounceRequest
    // The number of ms to wait after a change event is received before rendering the view
    debounceRequest: 500,

    // #### property loading
    // The message to render while waiting for html from the server
    loading: "Loading...",

    // #### function initialize
    // Sets up the custom rendering function
    initialize: function() {
      this.render = _.debounce(_.bind(this.serverSideRender, this), this.debounceRequest);
      if (this.model) this.model.bind('change', this.render);
      this.render();
    },

    // #### function serverSideRender
    // Replaces the entire contents of the element with the result from the server
    serverSideRender: function() {
      if (!this.url) throw('Set url property on RemoteView to enable server-side rendering.')
      if (typeof this.loading == 'string' && $(this.el).html() == "") {
        $(this.el).html(this.loading);
      }
      $.ajax({
        url: this.url,
        dataType: 'html',
        context: this,
        success: function(responseHTML) {
          $(this.el).empty();
          $(this.el).html(responseHTML);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (Duckbone.Rails.isDevelopment()) {
            $(this.el).html('Error rendering from ' + this.url);
          } else {
            Duckbone.serverError();
          }
        }
      })
      return this;
    }
  }

}).call();