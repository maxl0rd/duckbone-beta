require 'rubygems'
require 'bundler/gem_tasks'

desc "Generate Rocco documentation for Duckbone. Requires docco to be installed via npm"
task :doc do
  `docco -o doc -l classic vendor/assets/javascripts/duckbone/*.js`
end
