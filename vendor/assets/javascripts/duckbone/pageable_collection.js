/**
# Duckbone.PageableCollection

PageableCollection enhances a Backbone Collection so that it understands its connection to a server-paginated endpoint.
It should be used in conjunction with the Rails library found in Duckbone.PageableCollection, and either
of the standard will_paginate or kaminari gems.

## Usage

First, establish pagination in your controller action. Wrap the JSON response in the PageableCollection presenter.
For example:

    class TicketsController < ApplicationController
      def index
        @tickets = Ticket.all.page params[:page]
        render :json => Duckbone::PageableCollection.new(@tickets)
      end
    end

Then create a pageable collection and use `fetchPage()` to fetch the collection. For example:

    tickets = new Duckbone.Collection({url: '/tickets'});
    Duckbone.include(tickets, Duckbone.PageableCollection);
    tickets.fetchPage(1);

The JSON response will look something like this:

    { num_pages: 4, limit_value: 25,
      current_page: 1, total_count: 99,
      records: [ {...}, {...} ] }

At that point, you can then use `nextPage()`, `prevPage()`, or `setPage()` to fetch any other set of items
into the collection. The collection will trigger both _pageChange_ and _reset_ events, when the records are refreshed.

### Displaying the total count

The collection maintains its `totalCount` property and updates it whenever it fetches new data from the server.
However, manually adding and removing items from the collection can cause this number to fall out of sync. Use the
method `updateTotalCountOnCollectionEvents` to create bindings that will keep this number in sync in the event
that it is visible in the UI.

### PageableView

To create a paging UI with traditional page links and next/previous navigation, use this class in concert with
a Duckbone.PageableView.
*/

(function() {

  Duckbone.PageableCollection = {

    // ### Mixin

    // #### property isPageableCollection
    // Indicates the presence of this mixin
    isPageableCollection: true,

    // ### Public Methods

    // #### function parse
    // - resp - the response object
    // - xhr - the jQuery XHR object
    // - returns - an object representing the parsed data
    //
    // When PageableCollection is used in a Rails controller, it wraps the response in an object
    // that contains the collection's pagination meta-data. This overridden parse method extracts
    // the meta-data into the object, and passes the records on to the normal behavior.
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
    // - returns - the jQuery XHR object for fetch
    fetchPage: function(pageNum) {
      var params = this.params = this.params || {};
      params.page = pageNum || 1;
      return Backbone.Collection.prototype.fetch.call(this, {
        url: buildUrl(this, params),
        success: function(c) {
          c.trigger('pageChange', c.currentPage, params);
        }
      });
    },

    // #### function setParam
    // - param - query parameter name
    // - val - query parameter value, or null to remove the param
    // - returns - nothing
    //
    // Set additional query params on the collection, ie search string.
    // These will be sent to the server on fetch and show up in the url.
    setParam: function(param, val) {
      this.params = this.params || {};
      if (_.isNull(val) || _.isUndefined(val)) {
        delete this.params[param];
      } else {
        this.params[param] = val;
      }
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
    // Create bindings that update the totalCount as models are added and removed from the collection.
    updateTotalCountOnCollectionEvents: function() {
      this.bind('add', function() {
        if (this.totalCount) this.totalCount += 1;
      }, this);
      this.bind('remove', function() {
        if (this.totalCount) this.totalCount -= 1;
      }, this);
    }

  };

  // ### Internal Functions

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