require 'rspec-rails'
require 'generators/rspec/scaffold/scaffold_generator'

module Rspec
  module Generators
    class DuckboneScaffoldGenerator < Rspec::Generators::ScaffoldGenerator
      def self.source_root
        File.expand_path("../templates", __FILE__)
      end

      remove_class_option :helper_specs
      remove_hook_for :helper, :integration_tool

      def generate_controller_spec
        return unless options[:controller_specs]

        template 'controller_spec.rb',
                 File.join('spec/controllers/api', controller_class_path, "#{controller_file_name}_controller_spec.rb")
      end

      def generate_routing_spec
        return unless options[:routing_specs]

        template 'routing_spec.rb',
          File.join('spec/routing/api', controller_class_path, "#{controller_file_name}_routing_spec.rb")
      end


      def generate_view_specs
        # Noop
      end
    end
  end
end

