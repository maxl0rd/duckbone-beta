require "spec_helper"

describe Api::<%= controller_class_name %>Controller do
  describe "routing" do

<% unless options[:singleton] -%>
    it "routes to #index" do
      get("/api/<%= ns_table_name %>").should route_to("api/<%= ns_table_name %>#index")
    end

<% end -%>
    it "routes to #show" do
      get("/api/<%= ns_table_name %>/1").should route_to("api/<%= ns_table_name %>#show", :id => "1")
    end

    it "routes to #create" do
      post("/api/<%= ns_table_name %>").should route_to("api/<%= ns_table_name %>#create")
    end

    it "routes to #update" do
      put("/api/<%= ns_table_name %>/1").should route_to("api/<%= ns_table_name %>#update", :id => "1")
    end

    it "routes to #destroy" do
      delete("/api/<%= ns_table_name %>/1").should route_to("api/<%= ns_table_name %>#destroy", :id => "1")
    end

  end
end
