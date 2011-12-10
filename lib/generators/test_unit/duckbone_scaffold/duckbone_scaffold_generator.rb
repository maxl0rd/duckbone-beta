require 'rails/generators/test_unit/scaffold/scaffold_generator'

module TestUnit
  module Generators
    class DuckboneScaffoldGenerator < TestUnit::Generators::ScaffoldGenerator
      source_root File.expand_path("../templates", __FILE__)

    end
  end
end

