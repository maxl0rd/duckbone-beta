class <%= application_name %>.Views.<%= class_name.pluralize %>Edit extends Duckbone.FormView

  templateName: '<%= class_name.underscore.pluralize %>_edit'

  fields:
<% attributes.each do |attribute| -%>
    <%= attribute.name %>: {}
<% end %>

  modelSyncEvents:
    'sync:success': 'modelSaved'

  modelSaved: () =>
    <%= application_name %>.app.navigate "duckbone/<%= class_name.underscore.pluralize %>/#{@model.id}", true
    <%= application_name %>.app.flashNotice('<%= class_name %> was successfully updated.')


  @routeAction: (id) ->
    <%= class_name.underscore %> = <%= application_name %>.<%= class_name.underscore.pluralize %>?.get id
    <%= class_name.underscore %> ?= new <%= application_name %>.Models.<%= class_name %> id: id
    view = <%= application_name %>.app.loadView <%= application_name %>.Views.<%= class_name.pluralize %>Edit, model: <%= class_name.underscore %>
    <%= class_name.underscore %>.fetch
      success: =>
        view.model.set(<%= class_name.underscore %>)
