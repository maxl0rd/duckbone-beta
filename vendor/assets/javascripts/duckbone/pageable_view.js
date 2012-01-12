/**
# Duckbone.PageableView

This module provides all the functionality to create a list of views representing a paginated collection,
and navigation controls to view the different pages.

It manages two child views: a list view of all the subviews, and a pager view that contains the navigation
controls.

## Usage

First, create a PageableCollection to hold the model data. For example:

    tickets = new Duckbone.Collection({url: '/tickets'});
    Duckbone.include(tickets, Duckbone.PageableCollection);

Next, create a class to serve as the sub-view in the list:

    ticketView = Duckbone.View.extend({
      templateData: 'Ticket number {{attr "id"}}'
    });

Finally, create a PageableView using these two elements, and load the first page of models.

    pagedTickets = new Duckbone.View.extend({
      collection: tickets,
      viewClass: ticketView
    });
    pagedTickets.fetchPage(1);

If you wish to create your own Pager class, then you may also set this on the view's `pagerClass`.
See the default pager code at the end of this file and follow its example.

### Updating the URL Hash

Call `bindPageChangeToHashChange` on the view to create bindings that update the location bar when
the pagination options are changed. This facility uses the pseudo query-string feature of
Duckbone.RouteableApplication to pass the current page through the URL hash. When uses in conjunction
with a route action that respects these params, it is easy to create bookmarkable urls to any page.
*/

(function() {

  Duckbone.PageableView = {

    // ### Mixin

    // #### property isPageableView
    // Indicates the presence of this mixin
    isPageableView: true,

    // #### function included
    // Also includes TemplateableView which also includes NestableView and ViewLifecycleExtensions
    included: function() {
      if (!this.isTemplateableView) {
        Duckbone.include(this, Duckbone.TemplateableView);
      }
    },

    // #### function getTemplate
    // Override getTemplate to provide a simple default
    // This way any of templateName, templateDatam or template can still work as an override
    getTemplate: function(templateName) {
      Duckbone.TemplateableView.getTemplate.call(this, templateName, true);
      this.template = this.template || Duckbone.Handlebars.compile('{{child "list"}}{{child "pager"}}');
    },

    // ### Public Methods

    // #### function createChildren
    // Creates and returns the list view and the pager view.
    createChildren: function() {
      return {
        list: this.createListView(),
        pager: this.createPagerView()
      }
    },

    // #### function createListView
    // Creates the list view container for the elements
    createListView: function() {
      return new Duckbone.ListView({
        viewClass: this.viewClass,
        pageableView: this,
        tagName: 'ul',
        className: 'listable_view',
        collection: this.collection
      });
    },

    // #### function createPagerView
    // Creates a view for the pager element. Uses the default pager class,
    // or the supplied user class set on `pagerClass`
    createPagerView: function() {
      var pagerClass = this.options.pagerClass || this.pagerClass || Pager;
      return new pagerClass({
        collection: this.collection,
        pageableView: this
      });
    },

    // #### function bindPageChangeToHashChange
    // Create bindings that update the location hash to reflect the pagination options.
    // TODO: improve this so all params get in ...
    bindPageChangeToHashChange: function() {
      // bind 'changePage' events to navigation state
      this.application = this.options.application || this.application;
      if (this.application) {
        this.collection.bind('pageChange', function(p, params) {
          var newLocation = window.location.hash.split('?')[0];
          this.application.navigate(newLocation, false, params);
        }, this);
      }
    },

    // #### function scrollToTopOfList
    // Smoothly scrolls up to the top of the list, so that newer items are visible when the page changes.
    scrollToTopOfList: function() {
      var offset = $(this.children.list.el).offset().top - 20;
      $('html body').animate({ scrollTop: offset }, 400, 'swing');
    }

  }

  // ### Default Pager View Class

  // Handlebars template
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

  Pager = Backbone.View.extend({

    el: '<div class="pager_view"></div>',
    templateData: pagerTemplateData,

    events: {
      'click a.previous_link': 'showPreviousPage',
      'click a.next_link': 'showNextPage',
      'click a.page_link': 'showPage'
    },

    // #### function initialize
    // Render the view, and then bind render to all collection events.
    initialize: function() {
      this.render();
      this.collection.bind('all', this.render, this);
    },

    // #### function render
    // Only renders if pagination data is present and fetched.
    // Hide the pager if there is only 1 page of data present.
    render: function() {
      if (this.collection.numPages) this.renderTemplate(this.paginationData());
      if (this.collection.numPages > 1) {
        $(this.el).show();
      } else {
        $(this.el).hide();
      }
      return this;
    },

    // #### function paginationData
    // - returns - a data object suitable for passing to a template to render the pager
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

    // #### function showPage
    // Event handler for a click on any page number link
    showPage: function(e) {
      e.preventDefault();
      var p = parseInt($(e.target).data('page'));
      this.options.collection.setPage(p);
      this.options.pageableView.scrollToTopOfList();
      return false;
    },

    // #### function showPreviousPage
    // Event handler for a click on the previous page link
    showPreviousPage: function(e) {
      e.preventDefault();
      this.options.collection.prevPage();
      this.options.pageableView.scrollToTopOfList();
      return false;
    },

    // #### function showNextPage
    // Event handler for a click on the next page link
    showNextPage: function(e) {
      e.preventDefault();
      this.options.collection.nextPage();
      this.options.pageableView.scrollToTopOfList();
      return false;
    }

  });

  // Make it a TemplateableView
  Duckbone.include(Pager.prototype, Duckbone.TemplateableView);

}).call();