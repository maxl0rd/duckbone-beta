(function() {

  Duckbone.SimpleQueue = function(options) {
    this.interval = options.interval || 400;
    this.elements = [];
    this.callback = options.callback;
    this.running = false;
  };

  _.extend(Duckbone.SimpleQueue.prototype, {

    // Pushes a new element into the queue.
    // The queue will start as soon as an element is added.

    push: function(el) {
      this.elements.push(el);
      if (this.comparator) _(this.elements).sortBy(this.comparator);
      if (!this.running) {
        this.running = true;
        this.timer = setInterval(_.bind(this.shift, this), this.interval);
      }
    },

    // Shifts an element out of the queue. One element will be shifted every interval.
    // The element is shifted out and then the queue's callback function is called in its context.

    shift: function() {
      if (this.elements.length == 0) {
        this.running = false;
        clearInterval(this.timer);
      } else {
        var element = this.elements.shift();
        this.callback.call(element, element, this);
      }
    }
  });

}).call();
