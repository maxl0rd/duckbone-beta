#= require_self
#= require_tree ./models
#= require_tree ./views

# Setup top-level namespaces
window.<%= application_name %> =
  Models: {}
  Collections: {}
  Views: {}

# Setup the application
class <%= application_name %>.Application extends Duckbone.Application

  initialize: (options) ->

    # Create the routes
    @mapRoutes
      'duckbone': <%= application_name %>.Views.Home

# Bootstrap Application on Document Ready
# Creates the application, assigns the container, and starts the history
$ ->
  <%= application_name %>.app = new <%= application_name %>.Application
  <%= application_name %>.app.setContainer $('section#main_content').get(0)
  <%= application_name %>.app.configureFlash
    container: $('div#flashes').get(0)

  <%= application_name %>.app.bindNavigationBars()
  # If you want to use hash URLs, just disable pushState
  Backbone.history.start({pushState: true})
  $(document).delegate 'a[data-navigate]', 'click', (e) ->
    <%= application_name %>.app.navigate $(e.currentTarget).attr('data-navigate'), true

