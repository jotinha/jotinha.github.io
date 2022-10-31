var getFormData = function(form){
  var data = {};

  $(form.serializeArray()).each(function() {
    if (this.name) data[this.name] = this.value;
  });

  return data;
};

var splitNumber = function(number) {
  if (typeof number === "string") {
    var groups = /\s*(\d{9})(\s*-\s*)?(.*)/.exec(number);
    if (groups !== null && groups.length == 4) {
      number = groups[1];
      name = groups[3];
      return {number:number,name:name};
    }
  }

};

var isValidNumber = function(number,checkLen) {
  if (checkLen === undefined) checkLen = true;

  var parsed = parseInt(number);
  return parsed === parsed && //is false for NaN
         !(checkLen && parsed.toString().length != 9);
};

var validateData = function() {

  return isValidNumber(data.username) && 
         isValidNumber(data.destnumber) &&
         undefined !== data.password &&
         undefined !== data.msg;
};


var form = $("#theform");

form.submit(function(event) {
  event.preventDefault();
  
  data = getFormData(form);

  var destination = splitNumber(data.destination);
  if (destination === undefined) return;


  data.destnumber = destination.number;
  delete data.destination;

  console.log(data);  

  var btn = $('button#enviar');
  btn.button('loading');

  $.ajax({
    url: "https://sender.blockspring.com/api_v2/blocks/b359d003a75ccae54632ee2ad77896b5?api_key=166e5a4317f411bf96ac58d177697dcc",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    crossDomain: true
  }).done(function(response){
    btn.button('reset');
    response = $(response.split('\n')).filter(function() {
      return this.trim().startsWith('{');
    })[0];
    response = JSON.parse(response);
    console.log(response);
    if (response['status'] === "ok") {
      setStatus('success','Mensagem enviada!');
      $('#msg').val(''); //reset text area
    } else {
      setStatus('error','Erro a enviar mensagem!');
      console.log(response);
    }
  });

});

var setStatus = function(type,msg) {
  var stat = $('#status');

  if (msg === undefined) {
    stat.hide();
    return;
  } else {
    stat.show();
  }
  
  if (type.toLowerCase() == 'error') {
    stat.attr('class','alert alert-danger');
    stat.find('.sr-only').text('Error:');
    stat.find('.glyphicon').attr('class','glyphicon glyphicon-exclamation-sign');

  } else if (type.toLowerCase() == 'success') {
    stat.attr('class','alert alert-success');
    stat.find('.sr-only').text('Success:');
    stat.find('.glyphicon').attr('class','glyphicon glyphicon-ok');
  } else {
    stat.attr('class','alert alert-info');
    stat.find('.sr-only').text(type+':');
    stat.find('.glyphicon').attr('class','glyphicon');
  }
  stat.find('#status-text').text(msg);

};
