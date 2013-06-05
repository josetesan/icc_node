var http = require('http');
var client = require("redis").createClient();
var xmlDocument = require("xmldoc").XmlDocument;
var log = require('fs').createWriteStream('log.txt', {'flags': 'a'});

function onRequest(request, response) {

    request.addListener("data", function(chunk) {		request.content += chunk;    });

    request.addListener("end", function() {
        var peticion = new xmlDocument(request.content);
        var msisdn = peticion.childNamed('user_id').val;
        var content_code = peticion.childNamed('service_identifier');
        if (content_code) {
    	    debit(response,msisdn, content_code.val);
        } else {
	 getBalance(response,msisdn);
        }
   });
};


function debit(response,msisdn , content_code) {
    
    client.get('contentcode:'+content_code, function ( err, data) {
    	if (err) {
    	    log.write("Error, content code not found,"+err);
    	} else {
			var amount = data.split(":")[1];
			log.write("Debiting '%s'  for '%s'", msisdn, amount);
			client.get('customer:234'+msisdn, function ( err, data) {
				response.writeHead(200, {'Content-Type':'text/xml'});
				if (err) {
						log.write("User '%s' not found", msisdn);
						response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
						response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
						response.write('<result>201/result>');
						response.write('</cp_reply>\r\n');
				} else {
					var balance = data.split(":")[1];
					if (parseInt(balance) >= parseInt(amount) ) {
						var newBalance = parseInt(balance) - parseInt(amount);
						client.set('customer:234'+msisdn, 'balance:'+newBalance);
						log.write("User '%s' new balance is '%s'", msisdn, newBalance);
						response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
						response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
						response.write('<op_transaction_id>'+parseInt(Math.random()*999999999)+'</op_transaction_id>');
						response.write('<service_units kind="Granted">');
						response.write('<svc_unit u_type="0">1</svc_unit>');
						response.write('</service_units>');
						response.write('<cost_information>'+amount+'</cost_information>');
						response.write('<result>0</result>');
						response.write('</cp_reply>\r\n');
					} else {
						log.write("User '%s' has not enough money, as balance is '%s'",msisdn, balance);
						response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
						response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
						response.write('<result>10</result>');
						response.write('</cp_reply>\r\n');
					}
				}
				response.end();
			});
	  }		
	});
}


function getBalance(response,msisdn) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        client.get('customer:234'+msisdn, function (err, data) {
        if (err) {
			response.write(0);    		
        } else {
    	    var balance = data.split(":")[1];
    	    response.write(balance);
    	    log.write("Saldo de '%s' es '%s'",msisdn, balance); 
        }
        response.end();
        });
}

client.on("connect", function () {
    console.log('Connected to redis');
});

http.createServer(onRequest).listen(8887);
console.log('Server running at http://127.0.0.1:8887');
