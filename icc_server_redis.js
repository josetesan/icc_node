var http = require('http');
var client = require("redis").createClient();
var xmlDocument = require("xmldoc").XmlDocument;

function onRequest(request, response) {

    request.addListener("data", function(chunk) {
	request.content += chunk;
    });

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
		var amount = data.split(":")[1];
		console.log("Debiting '%s'  for '%s'", msisdn, amount);
		client.get('customer:'+msisdn, function ( err, data) {
			response.writeHead(200, {'Content-Type':'text/xml'});
			if (err) {
					console.log("User '%s' not found", msisdn);
					response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
					response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
					response.write('<result>201/result>');
					response.write('</cp_reply>\r\n');
			} else {
				var balance = data.split(":")[1];
				if (parseInt(balance) >= parseInt(amount) ) {
					var newBalance = parseInt(balance) - parseInt(amount);
					client.set('customer:'+msisdn, 'balance:'+newBalance);
					console.log("User '%s' new balance is '%s'", msisdn, newBalance);
					response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
					response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
					response.write('<result>0</result><account_id>'+msisdn.substr(3)+'</account_id>');
					response.write('<credit_balance>'+newBalance+'</credit_balance>');
					response.write('<acc_status>ACTIVE</acc_status>');
					response.write('</cp_reply>\r\n');
				} else {
					console.log("User '%s' has not enough money, as balance is '%s'",msisdn, balance);
					response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
					response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
					response.write('<result>10</result>');
					response.write('</cp_reply>\r\n');
				}
			}
			response.end();
		});
		
	});
}


function getBalance(response,msisdn) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        client.get('customer:'+msisdn, function (err, data) {
        if (err) {
			response.write(0);    		
        } else {
    	    var balance = data.split(":")[1];
    	    response.write(balance);
    	    console.log("Saldo de '%s' es '%s'",msisdn, balance); 
        }
        response.end();
        });
}

client.on("connect", function () {
    console.log('Connected to redis');
});

http.createServer(onRequest).listen(8887);

console.log('Server running at http://127.0.0.1:8887');
