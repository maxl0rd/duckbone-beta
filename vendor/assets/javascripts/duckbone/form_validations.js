(function() {

  // These validators can be used with any form field by including the fields options
  // fields: {
  //   amount: {
  //     modelAttribute: 'amount',
  //     validate: 'money'
  //   }
  // }

  // Thx to andyet/happy.js for a few of these

  Duckbone.forms = Duckbone.forms || {};
  Duckbone.forms.validators = Duckbone.forms.validators || {};

  _.extend(Duckbone.forms.validators, {

    required: function(val) {
      return !(val == undefined || val == null || val == "");
    },
    USPhone: function (val) {
      return /^\(?(\d{3})\)?[\- ]?\d{3}[\- ]?\d{4}$/.test(val)
    },
    date: function (val) {
      return /^(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12][0-9]|3[01])\/\d{2}?\d{2}$/.test(val);
    },
    email: function (val) {
      return /^([A-Za-z0-9\.%\+\-\_]+)@([A-Za-z0-9\-]+\.)+([A-Za-z]{2,})$/.test(val);
    },
    numeric: function (val) {
      return (parseFloat(val) != NaN);
    }

  });

}).call(this);