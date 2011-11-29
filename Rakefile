require 'rubygems'
require 'bundler/gem_tasks'

desc "Generate Rocco documentation for Duckbone"
task :doc do
  `cd vendor/assets/javascripts; bundle exec rocco duckbone/*.* -o ../../../doc -l js`
end
