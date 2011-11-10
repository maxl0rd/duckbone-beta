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
    // matches mm/dd/yyyy (requires leading 0's (which may be a bit silly, what do you think?)
    date: function (val) {
      return /^(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12][0-9]|3[01])\/(?:\d{4})/.test(val);
    },
    email: function (val) {
      return /^(?:\w+\.?)*\w+@(?:\w+\.)+\w+$/.test(val);
    },
    numeric: function (val) {
      return (parseFloat(val) != NaN);
    }
    
  });
  
}).call(this);