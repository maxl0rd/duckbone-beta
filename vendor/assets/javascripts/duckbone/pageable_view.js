(function() {

  // PageableView works in concert with ListableView to create a container view that
  // manages a list of subviews that represent a paginated collection.

  // Usage..
  /*
  myPageableView = Backbone.View.extend({
    ...
  });
  Duckbone.include(myPageableView.prototype, Duckbone.PageableView)
  */

  Duckbone.PageableView = {
    isPageableView: true,

    // Also include ViewLifecycleExtensions
    included: function() {
      if (!this.hasViewLifecycleExtensions) {
        Duckbone.include(this, Duckbone.ViewLifecycleExtensions);
      }
    },

    // Create sub views for render
    createNestedViews: function() {
      // Create child views
      var list = this.createListView();
      var pager = this.createPagerView();

      // bind 'changePage' events to navigation state
      this.application = this.options.application || this.application;
      if (this.application) {
        this.collection.bind('pageChange', function(p, options) {
          var newLocation = window.location.hash.split('?')[0] + '?';
          var urlEncodedOptions = _(_.keys(options)).map(function(o) {
            return o + '=' + options[o]
          }).join('&');
          newLocation += urlEncodedOptions;
          this.application.navigate(newLocation, false);
        }, this);
      }

      return {
        list: list,
        pager: pager
      }
    },

    // Creates a list view container for the elements
    createListView: function() {
      return new Duckbone.ListView({
        viewClass: this.viewClass,
        pageableView: this,
        tagName: 'ul',
        className: 'listable_view',
        collection: this.collection
      });
    },

    // Creates a view for the pager element
    // You can set a custom pager view class, or use the supplied default view
    createPagerView: function() {
      var pagerClass = this.options.pagerClass || this.pagerClass || Pager;
      return new pagerClass({
        collection: this.collection,
        pageableView: this
      });
    },

    showPage: function(p) {
      p = parseInt(p) || 1;
      this.collection.setPage(p);
    },

    showNextPage: function() {
      this.showPage(this.collection.currentPage+1);
    },

    showPreviousPage: function() {
      this.showPage(this.collection.currentPage-1);
    },

    // Smooth scroll up to the top of the list
    scrollToTopOfList: function() {
      var offset = $(this.list.el).offset().top - 20;
      $('html body').animate({ scrollTop: offset }, 400, 'swing');
    }

  }

  // Default Pager template

  var pagerTemplateData =
  '<div class="pager">&nbsp;<br/>\
    {{#if showPrevious}}\
      <a href="#" class="previous_link">&laquo;&nbsp;Previous</a>&nbsp;\
    {{else}}\
      <span class="inactive">&laquo;&nbsp;Previous</span>&nbsp;\
    {{/if}}\
    {{#each pages}}\
      {{#if currentPage}}\
        <span class="current">{{title}}</span>&nbsp;\
      {{else}}\
        <a href="#" class="page_link" data-page="{{id}}">{{title}}</a>&nbsp;\
      {{/if}}\
    {{/each}}\
    {{#if showNext}}\
      <a href="#" class="next_link">Next&nbsp;&raquo;</a>\
    {{else}}\
      <span class="inactive">Next&nbsp;&raquo;</span>\
    {{/if}}\
  </div>';

  // Default Pager view class

  Pager = Backbone.View.extend({

    el: '<div class="pager_view"></div>',
    templateData: pagerTemplateData,

    events: {
      'click a.previous_link': 'showPreviousPage',
      'click a.next_link': 'showNextPage',
      'click a.page_link': 'showPage'
    },

    initialize: function() {
      this.render();
      this.collection.bind('all', this.render, this);
    },

    // Only render if pagination data is present and fetched

    render: function() {
      if (this.collection.numPages) this.renderTemplate(this.paginationData());
      if (this.collection.numPages > 1) {
        $(this.el).show();
      } else {
        $(this.el).hide();
      }
      return this;
    },

    paginationData: function() {
      var numPages = this.collection.numPages;
      var pageData = {
        showPrevious: (this.collection.currentPage > 1),
        numPages: numPages,
        showNext: (this.collection.currentPage < this.collection.numPages),
        pages: _(_.range(1, numPages+1)).map(function(i) {
          return {
            id: i,
            title: ''+i,
            currentPage: (i == this.collection.currentPage)
          }
        }, this)
      };
      return pageData;
    },

    showPage: function(e) {
      e.preventDefault();
      var p = parseInt($(e.target).data('page'));
      this.options.pageableView.showPage(p);
      this.options.pageableView.scrollToTopOfList();
      return false;
    },

    showPreviousPage: function(e) {
      e.preventDefault();
      this.options.pageableView.showPreviousPage();
      this.options.pageableView.scrollToTopOfList();
      return false;
    },

    showNextPage: function(e) {
      e.preventDefault();
      this.options.pageableView.showNextPage();
      this.options.pageableView.scrollToTopOfList();
      return false;
    }

  });

  Duckbone.include(Pager.prototype, Duckbone.TemplateableView);

}).call();