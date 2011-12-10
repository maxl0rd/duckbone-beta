# Borrowing heavily from backbone-rails's generator style
require 'rails/generators/rails/resource/resource_generator'
require 'generators/duckbone/resource_helpers'

module Duckbone
  module Generators
    class ScaffoldGenerator < Rails::Generators::ResourceGenerator

      include ResourceHelpers

      remove_hook_for :resource_controller
      remove_class_option :actions

      hook_for :scaffold_controller, :required => true
       # do |controller|
       #  invoke controller, [controller_name, options[:actions]], {
       #    :template_engine => false,
       #    :helper => false,
       #    :assets => false
       #  }
       # end

    end
  end
end