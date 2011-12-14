# The view for each <%= class_name %> item
class <%= application_name %>.Views.<%= class_name.pluralize %>Item extends Duckbone.View

  templateName: '<%= class_name.underscore.pluralize %>_item'
  tagName: 'tr'

  events:
    "click a[data-action=destroy]": "destroy"

  destroy: ->
    if confirm("Are you sure?")
      @model.destroy
        success: ->
          <%= application_name%>.<%= class_name.underscore.pluralize %>.remove(@model)

# The List View that manages all <%= class_name %> items on the page
class <%= application_name %>.Views.<%= class_name.pluralize %>ListView extends Duckbone.ListView
  tagName: 'tbody'
  viewClass: <%= application_name %>.Views.<%= class_name.pluralize %>Item


# The index view itself, which hosts the list view
class <%= application_name %>.Views.<%= class_name.pluralize %>Index extends Duckbone.View

  templateName: '<%= class_name.underscore.pluralize %>_index'

  createChildren: =>
    @<%= class_name.underscore.pluralize %>List = new <%= application_name %>.Views.<%= class_name.pluralize %>ListView
      collection: @collection

  beforeRemove: =>
    @<%= class_name.underscore.pluralize %>List.remove()

  @routeAction: (id) ->
    <%= application_name %>.<%= class_name.underscore.pluralize %> ?= new <%= application_name %>.Collections.<%= class_name.pluralize %>
    <%= application_name %>.<%= class_name.underscore.pluralize %>.fetch
      freshen: true
      success: ->
        <%= application_name %>.app.loadView <%= application_name %>.Views.<%= class_name.pluralize %>Index, collection: <%= application_name %>.<%= class_name.underscore.pluralize %>
