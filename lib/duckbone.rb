require 'duckbone/version'
require 'rails'
require 'duckbone/pageable_collection'

module Duckbone
  class Engine < Rails::Engine
    initializer "active_record.json_serialization" do |app|
      ActiveSupport.on_load(:active_record) do
        require 'active_record/json_serialization'
      end
    end
  end
end
