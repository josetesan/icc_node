var http = require('http');
var client = require("redis").createClient();
var xmlDocument = require("xmldoc").XmlDocument;
var winston = require('winston');

function onRequest(request, response) {

    request.addListener("data", function(chunk) {	request.content += chunk;    });

    request.addListener("end", function() {
		var peticion = new xmlDocument(request.content);
        var msisdn = peticion.childNamed('user_id').val;
        var content_code = peticion.childNamed('service_identifier');
        var r_parameter = peticion.childNamed('r_parameter');
        if (r_parameter ) content_code = r_parameter;
        if (content_code ) {
			debit(response,msisdn, content_code.val);
    	} else {
			getBalance(response,msisdn);
        }
   });
};


function debit(response,msisdn , content_code) {
    
	client.hget('contentcodes','code:'+content_code, function ( err, data) {
    	if (err) {
         	response.writeHead(500, {'Content-Type':'text/plain'});
         	response.write("Error found "+err);
         	response.end();
    	    logger.info("| Error found,"+err+"\n");
    	} else {
    	if (data) {
			var amount = data.split(":")[1];
			logger.info( "| Debiting "+msisdn+" for "+amount+"\n");
			client.get('customer:234'+msisdn, function ( err, data) {
				response.writeHead(200, {'Content-Type':'text/xml'});
				if (err) {
					logger.info("| Error on finding user "+msisdn+"\n");
					response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
					response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
					response.write('<result>999</result>');
					response.write('</cp_reply>');
				} else {
					if (data) {
						var balance = data.split(":")[1];
						if (parseInt(balance) >= parseInt(amount) ) {
							var newBalance = parseInt(balance) - parseInt(amount);
							client.set('customer:234'+msisdn, 'balance:'+newBalance);
							logger.info(dateFormat() +"| User "+msisdn+" new balance is "+newBalance+"\n");
							response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
							response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
							response.write('<op_transaction_id>'+parseInt(Math.random()*999999999)+'</op_transaction_id>');
							response.write('<service_units kind="Granted">');
							response.write('<svc_unit u_type="0">1</svc_unit>');
							response.write('</service_units>');
							response.write('<cost_information>'+amount+'</cost_information>');
							response.write('<result>0</result>');
							response.write('</cp_reply>');
						} else {
							logger.info("| User "+msisdn+"  has not enough money, as balance is "+balance+"\n");
							response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
							response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
							response.write('<result>10</result>');
							response.write('</cp_reply>');
						}
				  } else {
					logger.info("| User "+msisdn+" not found\n");
					response.write('<?xml version="1.0"?><!DOCTYPE cp_reply SYSTEM "cp_reply.dtd">');
					response.write('<cp_reply><cp_id>PEngine</cp_id><cp_transaction_id>test-'+parseInt(Math.random()*100000000)+'</cp_transaction_id>');
					response.write('<result>201</result>');
					response.write('</cp_reply>');
				}
			  }
			  response.end();
			});
	  } else {
			logger.info("| Content code  "+content_code+" not found\n");
	       	response.writeHead(500, {'Content-Type':'text/plain'});
         	response.write("Error, content code "+content_code+" does not exist\n");
         	response.end();
	  }		
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
    	    logger.info("| Saldo de "+msisdn+" is "+balance+"\n");
        }
        response.end();
        });
}

client.on("connect", function () {
    console.log('Connected to redis');
});

client.on("end", function() {
    console.log("Closing redis");
});
/*
var server = http.createServer(onRequest);

server.on("close", function() {
    console.log("| Server closed");
    client.quit();
});

server.listen(8887);
*/

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'icc_server.log', json: false })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log', json: false })
  ],
  exitOnError: false
});


http.createServer(onRequest).listen(8887);
console.log('Server running at http://127.0.0.1:8887');
logger.info(" Server started on port 8887\n");

