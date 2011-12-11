class <%= application_name %>.Views.Home extends Duckbone.View

  templateName: 'home'

  @routeAction: =>
    audience = new Duckbone.Model name: "world"
    <%= application_name %>.app.loadView @, model: audience
