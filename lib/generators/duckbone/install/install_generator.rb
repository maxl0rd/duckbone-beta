# Borrowing heavily from backbone-rails's generator style
require 'generators/duckbone/resource_helpers'

module Duckbone
  module Generators
    class InstallGenerator < Rails::Generators::Base

      include ResourceHelpers

      source_root File.expand_path("../templates", __FILE__)

      desc "This generator installs Duckbone with a default folder layout in app/assets/javascripts/duckbone"

      class_option :skip_git, :type => :boolean, :aliases => "-G", :default => false,
                              :desc => "Skip Git ignores and keeps"

      def inject_duckbone
        inject_into_file "app/assets/javascripts/application.js", :before => "//= require_tree" do
          %W(underscore backbone duckbone templates duckbone/#{application_name.underscore}).inject("") do |memo, f|
            memo + "//= require #{f}\n"
          end
        end
      end

      def create_dir_layout
        %W{models views templates}.each do |dir|
          empty_directory "app/assets/javascripts/duckbone/#{dir}"
          create_file "app/assets/javascripts/duckbone/#{dir}/.gitkeep" unless options[:skip_git]
        end
      end

      def create_files
        template "app.coffee", "app/assets/javascripts/duckbone/#{application_name.underscore}.js.coffee"
        template "home.coffee", "app/assets/javascripts/duckbone/views/home.js.coffee"
        template "home.hbs", "app/assets/javascripts/duckbone/templates/home.hbs"
        template "controller.rb", "app/controllers/duckbone_controller.rb"
        template "view.erb", "app/views/duckbone/index.html.erb"
      end

      def add_route
        route %{match "duckbone" => "duckbone#index"}
      end
    end

  end
end