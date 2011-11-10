# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "duckbone/version"

Gem::Specification.new do |s|
  s.name        = "duckbone"
  s.version     = Duckbone::VERSION
  s.authors     = ["Max Lord"]
  s.email       = ["maxlord@gmail.com"]
  s.homepage    = "http://github.com/maxl0rd/duckbone"
  s.summary     = "Backbone extensions for Rails development"
  s.description = "Backbone extensions for Rails development"

  s.rubyforge_project = "duckbone"

  s.files         = `git ls-files`.split("\n")
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]

  s.add_dependency('rails', '~> 3.1.0')
  s.add_dependency('rails-backbone', '~> 0.5.4')

end
