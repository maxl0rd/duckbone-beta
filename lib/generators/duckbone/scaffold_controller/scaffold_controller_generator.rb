require 'rails/generators/rails/scaffold_controller/scaffold_controller_generator'

# Direct child of Rails scaffold to stub in different template
module Duckbone
  module Generators
    class ScaffoldControllerGenerator < Rails::Generators::ScaffoldControllerGenerator
      source_root File.expand_path("../templates", __FILE__)

      remove_hook_for :template_engine, :helper, :test_framework

      hook_for :test_framework, :as => :duckbone_scaffold
    end
  end
end