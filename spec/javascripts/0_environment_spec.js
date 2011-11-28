
describe("Environment", function () {
  it ("validates that the major libraries are loaded", function() {
    expect(window.$).toBeDefined();
    expect(window._).toBeDefined();
    expect(window.Backbone).toBeDefined();
    expect(window.Duckbone).toBeDefined();
  });
});