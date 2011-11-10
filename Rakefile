require 'rubygems'
require 'bundler/gem_tasks'

namespace :duckbone do
  namespace :docs do
    desc "Generate Rocco documentation for Duckbone"
    task :make do
      check 'rocco', 'rocco', 'https://github.com/rtomayko/rocco.git'
      `cd vendor/assets/javascripts; rocco duckbone/*.* -o ../../../doc -l js`
    end
  end
end

# Check for the existence of an executable.
def check(exec, name, url)
  return unless `which #{exec}`.empty?
  puts "#{name} not found.\nInstall it from #{url}"
  exit
end