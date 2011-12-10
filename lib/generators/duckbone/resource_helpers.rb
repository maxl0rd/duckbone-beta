module Duckbone
  module Generators
    module ResourceHelpers

      protected

      def application_name
        if defined?(Rails) && Rails.application
          Rails.application.class.name.split('::').first
        else
          "application"
        end
      end

    end
  end
end