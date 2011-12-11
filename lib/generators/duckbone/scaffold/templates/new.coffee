class <%= application_name %>.Views.<%= class_name.pluralize %>New extends Duckbone.FormView

  templateName: '<%= class_name.underscore.pluralize %>_new'

  fields:
<% attributes.each do |attribute| -%>
    <%= attribute.name %>: {}
<% end %>

  afterInitialize: ->
    <%= application_name %>.<%= class_name.underscore.pluralize %> ?= new <%= application_name %>.Collections.<%= class_name.pluralize %>
    @afterSaveDestination =
      collection: <%= application_name %>.<%= class_name.underscore.pluralize %>

  modelSyncEvents:
    'sync:success': 'modelSaved'

  modelSaved: () =>
    <%= application_name %>.app.navigate "duckbone/<%= class_name.underscore.pluralize %>/#{@model.id}", true
    <%= application_name %>.app.flashNotice('<%= class_name %> was successfully created.')

  @routeAction: ->
    <%= class_name.underscore %> = new <%= application_name %>.Models.<%= class_name %>
    <%= application_name %>.app.loadView <%= application_name %>.Views.<%= class_name.pluralize %>New, model: <%= class_name.underscore %>
