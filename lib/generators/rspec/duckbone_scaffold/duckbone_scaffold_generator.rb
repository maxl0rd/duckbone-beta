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

      def generate_view_specs
        # Noop
      end
    end
  end
end

