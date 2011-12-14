require 'test_helper'

<% module_namespacing do -%>
class Api::<%= controller_class_name %>ControllerTest < ActionController::TestCase
  setup do
    @<%= singular_table_name %> = <%= table_name %>(:one)
  end

  test "should get index" do
    get :index, <%= key_value :format, ":json" %>
    assert_response :success
    assert_not_nil assigns(:<%= table_name %>)
  end

  test "should create <%= singular_table_name %>" do
    assert_difference('<%= class_name %>.count') do
      post :create, <%= key_value singular_table_name, "@#{singular_table_name}.attributes" %>, <%= key_value :format, ":json" %>
    end

    assert_response :success
  end

  test "should show <%= singular_table_name %>" do
    get :show, <%= key_value :id, "@#{singular_table_name}.to_param" %>, <%= key_value :format, ":json" %>
    assert_response :success
  end

  test "should update <%= singular_table_name %>" do
    put :update, <%= key_value :id, "@#{singular_table_name}.to_param" %>, <%= key_value singular_table_name, "@#{singular_table_name}.attributes" %>, <%= key_value :format, ":json" %>
    assert_response :success
  end

  test "should destroy <%= singular_table_name %>" do
    assert_difference('<%= class_name %>.count', -1) do
      delete :destroy, <%= key_value :id, "@#{singular_table_name}.to_param" %>, <%= key_value :format, ":json" %>
    end

    assert_response :success
  end
end
<% end -%>
