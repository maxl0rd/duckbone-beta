class DuckboneController < ApplicationController
  %w(index show new edit).map do |action|
    define_method action do
      render :action => 'index'
    end
  end
end
