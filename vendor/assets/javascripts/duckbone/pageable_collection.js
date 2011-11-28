(function() {

  // A Pageable collection interacts with a server side model that is paginated
  // (ie with will_paginate or kaminari)
  // Use the Rails class Duckbone::PageableCollection to assist in
  // rendering json responses for these collections

  Duckbone.PageableCollection = {
    isPageableCollection: true,

    // Example response:
    // {num_pages: 4, limit_value: 25, current_page: 1, records: [{...}, {...}]}

    parse: function(resp, xhr)  {
      this.numPages = resp.num_pages;
      this.limitValue = resp.limit_value;
      this.currentPage = resp.current_page;
      this.totalCount = resp.total_count;
      return resp.records;
    },

    fetchPage: function(pageNum, params) {
      pageNum = pageNum || 1;
      params = params || _.clone(this.params) || {};
      return this.fetch({
        url: buildUrl(this, _.extend(params, {'page': pageNum})),
        success: function(c) {
          c.trigger('pageChange', c.currentPage, params);
        }
      });
    },

    // Set additonal query params on the collection, ie search string
    // These will be sent to the server on fetch and show up in the url

    setParam: function(param, val) {
      this.params = this.params || {};
      this.params[param] = val;
    },

    setPage: function(p) {
      if (p != this.currentPage && p > 0 && p <= this.numPages) return this.fetchPage(p);
    },

    nextPage: function() {
      return this.fetchPage(this.currentPage+1);
    },

    prevPage: function() {
      return this.fetchPage(this.currentPage-1);
    }

  };

  function buildUrl(context, options) {
    options = options || {};
    var url = (typeof context.url == 'function') ? context.url() : context.url
    if (url.indexOf('?') < 0) url += '?';
    for (var o in options) {
      url += o+'='+options[o]+'&';
    }
    return url;
  }

}).call();