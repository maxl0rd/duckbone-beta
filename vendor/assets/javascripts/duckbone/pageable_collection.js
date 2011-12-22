/**
# Duckbone.PageableCollection

PageableCollection enhances a Backbone Collection so that it understands its connection to a server-paginated endpoint.
It should be used in conjunction with the Rails library found in Duckbone.PageableCollection, and either
of the standard will_paginate or kaminari gems.

## Usage

First, establish pagination in your controller action.

Then use `fetchPage()` to fetch the collection.

*/

(function() {

  Duckbone.PageableCollection = {

    // #### property isPageableCollection
    // Indicates the presence of this mixin
    isPageableCollection: true,

    // #### function parse
    // - resp - the response object
    // - xhr - the jQuery XHR object
    // - returns - an object representing the parsed data
    //
    // When PageableCollection is used in a Rails controller, it wraps the response in an object
    // that contains the collection's pagination meta-data. This overridden parse method extracts
    // the meta-data into the object, and passes the records on to the normal behavior.
    //
    // An example response might look like this:
    // {num_pages: 4, limit_value: 25, current_page: 1, records: [{...}, {...}]}
    parse: function(resp, xhr)  {
      this.numPages = resp.num_pages;
      this.limitValue = resp.limit_value;
      this.currentPage = resp.current_page;
      this.totalCount = resp.total_count;
      return resp.records;
    },

    // #### function fetch
    // Delegate `fetch()` to `fetchPage()`. The normal options to fetch are discarded if passed.
    fetch: function() {
      this.fetchPage(1);
    },

    // #### function fetchPage
    // - pageNum - the page ordinal requested, begining with 1
    // - params - an object representing the query params to be passed to the server,
    //   defaulting to the params defined on the collection.params (by setParam)
    // - returns - nothing
    fetchPage: function(pageNum, params) {
      pageNum = pageNum || 1;
      params = params || _.clone(this.params) || {};
      return Backbone.Collection.prototype.fetch.call(this, {
        url: buildUrl(this, _.extend(params, {'page': pageNum})),
        success: function(c) {
          c.trigger('pageChange', c.currentPage, params);
        }
      });
    },

    // #### function setParam
    // - param - query parameter name
    // - val - query parameter value
    // - returns - nothing
    //
    // Set additonal query params on the collection, ie search string.
    // These will be sent to the server on fetch and show up in the url.
    setParam: function(param, val) {
      this.params = this.params || {};
      this.params[param] = val;
    },

    // #### function setPage
    // - p - ordinal page number requested
    // - returns - the jQuery XHR object from the resulting fetch call, or null if fetch is not called
    //
    // Sets the collection to the given page number, and fetches those models
    setPage: function(p) {
      if (p != this.currentPage && p > 0 && p <= this.numPages) return this.fetchPage(p);
    },

    // #### function nextPage
    // - returns - the jQuery XHR object from the resulting fetch call, or null if fetch is not called
    //
    // Sets the collection to the next page, and fetches those models
    nextPage: function() {
      return this.fetchPage(this.currentPage+1);
    },

    // #### function prevPage
    // - returns - the jQuery XHR object from the resulting fetch call, or null if fetch is not called
    //
    // Sets the collection to the previous page, and fetches those models
    prevPage: function() {
      return this.fetchPage(this.currentPage-1);
    },

    // #### function updateTotalCountOnCollectionEvents
    // Since the collection's `totalCount` property is only updated during fetch/parse,
    // when models are added and removed from the collection, then it is possible for this
    // number to become out of sync with the number of actual objects logically part of the collection.
    // Call this function to maintain the totalCount as models are added and removed from the collection
    // in between calls to fetch(). Since this behavior is application dependent, the use of this
    // method is left to the developer's discretion.
    updateTotalCountOnCollectionEvents: function() {
      this.bind('add', function() {
        if (this.totalCount) this.totalCount += 1;
      }, this);
      this.bind('remove', function() {
        if (this.totalCount) this.totalCount -= 1;
      }, this);
    }

  };

  // ### Internal

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