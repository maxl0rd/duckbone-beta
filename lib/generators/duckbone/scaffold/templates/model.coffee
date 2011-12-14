class <%= application_name %>.Models.<%= class_name %> extends Duckbone.Model

  urlRoot: ->
    "/api/<%= class_name.underscore.pluralize %>"

  createOrUpdate: ->
    if @isNew()
      "Create <%= class_name %>"
    else
      "Update <%= class_name %>"


class <%= application_name %>.Collections.<%= class_name.pluralize %> extends Duckbone.Collection

  model: <%= application_name %>.Models.<%= class_name %>
  url: ->
    "/api/<%= class_name.underscore.pluralize %>"