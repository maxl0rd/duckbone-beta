
describe("Environment", function () {
  it ("validates that the major libraries are loaded", function() {
    expect(window.$).toBeDefined();
    expect(window._).toBeDefined();
    expect(window.Backbone).toBeDefined();
    expect(window.Handlebars).toBeDefined();
    expect(window.Duckbone).toBeDefined();
  });

  it ("has the Rails environment", function() {
    expect(window.Duckbone.Rails).toBeDefined();
  });

  it ("runs in the test environment", function() {
    expect(window.Duckbone.Rails.environment).toEqual('test');
  });
});

