require 'rails/generators/test_unit/scaffold/scaffold_generator'

module TestUnit
  module Generators
    class DuckboneScaffoldGenerator < TestUnit::Generators::ScaffoldGenerator
      source_root File.expand_path("../templates", __FILE__)

      def create_test_files
        template 'functional_test.rb',
                 File.join('test/functional/api', controller_class_path, "#{controller_file_name}_controller_test.rb")
      end
    end
  end
end

