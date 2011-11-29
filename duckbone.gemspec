# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "duckbone/version"

Gem::Specification.new do |s|
  s.name        = "duckbone"
  s.version     = Duckbone::VERSION
  s.authors     = ["Max Lord", "John Mileham"]
  s.email       = ["maxlord@gmail.com", "jmileham@impulsesave.com"]
  s.homepage    = "http://github.com/ImpulseSave/duckbone"
  s.summary     = "Backbone extensions for Rails development"
  s.description = "Backbone extensions for Rails development"

  s.rubyforge_project = "duckbone"

  s.files  = `git ls-files`.split("\n")
  s.require_paths = ["lib"]

  s.add_dependency('rails', '~> 3.1.0')
  s.add_dependency('rails-backbone', '~> 0.5.0')
  s.add_development_dependency('rocco', '~> 0.8.2')
end
