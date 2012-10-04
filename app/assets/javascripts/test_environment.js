/**
# Environment
This file provides meta-data about the Rails environment to Duckbone.

## Usage

To include environment data, simply add `//= require environment` to your application.js
manifest, _before_ `//= require duckbone`.
*/

window.Duckbone = window.Duckbone || {};

Duckbone.Rails = {
  environment: "test"
};

