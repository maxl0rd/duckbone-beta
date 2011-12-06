/**
# Duckbone.FlashableView
Enables any view or application to manage a set of flash messages.
*/

(function() {

  Duckbone.FlashableView = {

    // #### property isFlashableView
    // Indicates a view that includes this mixin.
    isFlashableView: true,

    // #### function configureFlash
    // Accepts the following options:
    // - container - the DOM element to insert flash messages into
    // - noticeTemplate - a Handlebars template or template string for the notice
    // - alertTemplate - a Handlebars template or template string for the notice
    // - noticeDuration - a default duration for a flash notice
    // - fadeDuration - fade time for clearing notices
    configureFlash: function(options) {
      if (!options.container) throw("configureFlash called without a container");
      var flashOptionsDefaults = {
        noticeDuration: 10000, fadeDuration: 300
      }
      this.flashOptions = _.extend(flashOptionsDefaults, options);
      FlashView.fadeDuration = this.flashOptions.fadeDuration;
      if (options.noticeTemplate && typeof options.noticeTemplate == 'string') {
        FlashNoticeView.prototype.templateData = options.noticeTemplate;
      } else if (typeof options.noticeTemplate == 'function') {
        FlashNoticeView.prototype.template = options.noticeTemplate
      }
      if (options.errorTemplate && typeof options.errorTemplate == 'string') {
        FlashErrorView.prototype.templateData = options.errorTemplate;
      } else if (typeof options.errorTemplate == 'function') {
        FlashErrorView.prototype.template = options.errorTemplate
      }
    },

    // #### function flashNotice
    // - message - displays the given flash message
    // - duration - flash notice fades out after the given number of ms
    // - returns - the flash notice view
    flashNotice: function(message, duration) {
      duration = duration || 10000;
      var flash = new FlashNoticeView({
        model: {message: message},
        duration: duration
      });
      $(this.flashOptions.container).append(flash.el);
      $(flash.el).hide().slideDown(300);
      return flash;
    },

    // #### function flashAlert
    // - message - displays the given flash message
    // - returns - the flash notice view
    flashAlert: function(message) {
      var flash = new FlashAlertView({
        model: {message: message}
      });
      $(this.flashOptions.container).append(flash.el);
      $(flash.el).hide().slideDown(300);
      return flash;
    },

    // #### function clearFlashes
    // Clears all flash notices and alerts.
    //
    // - immediately - instantly hides the flashes.  otherwise they are
    //   faded out according to the fadeDuration
    //
    // This is called on each loadView
    clearFlashes: function(immediately) {
      if (!this.flashOptions) return;
      var targets = $(this.flashOptions.container).
        find('div.flash_notice, div.flash_alert')
      if (immediately) {
        targets.hide();
      } else {
        targets.fadeOut(this.flashOptions.fadeDuration);
      }
    }

  };

  // ### Internal Flash Notice and Error Views

   var FlashView = Backbone.View.extend({
     events: {
       'click a.close': 'dismiss'
     },
     fadeDuration: 300,
     dismiss: function(e) {
       if (e) e.preventDefault();
       $(this.el).fadeOut(this.fadeDuration);
       _.delay(_.bind(this.remove, this), this.fadeDuration);
       return false;
     }
   });

   Duckbone.include(FlashView.prototype, Duckbone.TemplateableView);

   var genericFlashTemplate = '<div class="message">{{{message}}}</div>\
     <div class="close"><a href="#" class="close">X</a></div>';

   var FlashNoticeView = FlashView.extend({
     className: 'flash_notice',
     templateData: genericFlashTemplate,
     afterInitialize: function() {
       if (this.options.duration) {
         _.delay(_.bind(this.dismiss, this), this.options.duration);
       }
     }
   });

   var FlashAlertView = FlashView.extend({
     className: 'flash_alert',
     templateData: genericFlashTemplate
   });

}).call();