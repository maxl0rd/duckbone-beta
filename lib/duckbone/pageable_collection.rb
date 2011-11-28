module Duckbone
  class PageableCollection

    # collection => the given collection of paged items from will_paginate or kaminari
    # count => the pre-calculated count of items in the collection

    def initialize (collection)
      @collection = collection
    end

    # Render either a will_paginate or kaminari collection for a Duckbone.PageableCollection

    def as_json(opts = {})
      {
        :num_pages => @collection.respond_to?(:num_pages) ? @collection.num_pages : @collection.total_pages,
        :limit_value => @collection.respond_to?(:limit_value) ? @collection.limit_value : @collection.per_page,
        :current_page => @collection.current_page,
        :total_count => @collection.respond_to?(:total_count) ? @collection.total_count : @collection.total_entries,
        :records => @collection.to_a.as_json(opts)
      }
    end
  end
end