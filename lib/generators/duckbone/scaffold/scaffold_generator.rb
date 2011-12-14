# Borrowing heavily from backbone-rails's generator style
require 'rails/generators/rails/resource/resource_generator'
require 'generators/duckbone/resource_helpers'

module Duckbone
  module Generators
    class ScaffoldGenerator < Rails::Generators::ResourceGenerator

      source_root File.expand_path("../templates", __FILE__)

      include ResourceHelpers

      remove_hook_for :resource_controller
      remove_class_option :actions

      hook_for :scaffold_controller, :required => true do |controller|
        invoke controller, [controller_name, options[:actions]], {
          :template_engine => false,
          :helper => false,
          :assets => false
        }
      end

      # Override Rails's route to include api
      def add_resource_route
        return if options[:actions].present?
        route_config =  (['api'] + regular_class_path).collect{|namespace| "namespace :#{namespace} do " }.join(" ")
        route_config << "resources :#{file_name.pluralize}"
        route_config << " end" * (regular_class_path.size + 1)
        route route_config
      end

      def add_duckbone_route
        route "resources :#{file_name.pluralize}, :controller => :duckbone, :only => [:index, :show, :new, :edit]"
      end

      def add_js_routes
        inject_into_file "app/assets/javascripts/duckbone/#{application_name.underscore}.js.coffee", :after => "\n    @mapRoutes {" do
          {"" => "Index", "/:id" => "Show", "/new" => "New", "/:id/edit" => "Edit"}.inject("") do |memo, pair|
            memo + "\n      '#{class_name.underscore.pluralize}#{pair.first}': #{application_name}.Views.#{class_name.pluralize}#{pair.last}"
          end
        end
      end

      def generate_files
        # Models
        template "model.coffee", "#{js_dir}/models/#{class_name.underscore}.js.coffee"
        # Views
        %w(index show new edit).each do |view_name|
          template "#{view_name}.coffee", "#{js_dir}/views/#{class_name.underscore.pluralize}/#{view_name}.js.coffee"
        end
        # Templates
        %w(item index show _form new edit).each do |template_name|
          template "#{template_name}.hbs", "#{js_dir}/templates/#{class_name.underscore.pluralize}/#{template_name}.hbs"
        end
        # Stylesheet
        template "scaffold.css", "app/assets/stylesheets/duckbone_scaffold.css"
      end

      protected

      def js_dir
        "app/assets/javascripts/duckbone"
      end

      # Translate from Rails field types -- not a lot of options here yet... :)
      def field_type_for(type)
        type.to_s == "text_area" ? "form_textarea" : "form_text"
      end
    end
  end
end