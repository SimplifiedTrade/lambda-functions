// ==========
// = stCaseSave01 =
// Lambda Function for AWS, to save a Case
// Role: imageResizeLambdaSns
// ==========

var AWS = require( "aws-sdk" ),
	buffer = require( "buffer" ),
	https = require( "https" ),
	tls = require( "tls" ),
	crypto = require( "crypto" ),
	util = require( "util" );


/* ***************** DEBUG *************** */
	

/* Globals */
var esDomain = {
    endpoint: 'search-es-test-12-fe2zsgtry2vksweiv6lnzmhlqy.us-east-1.es.amazonaws.com',
    region: 'us-east-1',
    index: 'stapp',
    doctype: 'case'
};
var endpoint =  new AWS.Endpoint(esDomain.endpoint);
var s3 = new AWS.S3();


/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that permits ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');


uuid = function() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function( c ) {
			var r = crypto.randomBytes( 1 )[ 0 ] % 16 | 0, v = c == "x" ? r : ( r&0x3|0x8 );
			return v.toString( 16 );
		});
	},
	payload = {
		something: 123,
		somethingElse: "abc",
		isData: true,
		isNotData: false
	},
	payloadOut = JSON.stringify( payload );


/* ***************** DEBUG *************** */
exports.handler = function( event, context ) {	
	
	// console.info( "AWS CONFIG: ", JSON.stringify( AWS.config ) );
	
	var id = uuid(),
		request = new AWS.HttpRequest(endpoint);
	    // Sign the request (Sigv4)
    vsigner = new AWS.Signers.V4(req, 'es');
    signer.addAuthorization(creds, new Date());
	request = https.request( {
		port: 443,
		path: "/stapp/case/" + id,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": payloadOut.length
		},
		hostname: endpoint.host

	}, function( resp ) {
		var result = "";
		
		resp.setEncoding( "utf8" );

		resp.on( "data", function( chunk ) {
			result += chunk;
		});
		
		resp.on( "end", function() {
			console.log( result );
			context.done();
		});
		
		resp.on( "error", function( err ) {
			console.log( "ERROR: ", err );
			context.fali();
		});
	});
	
	request.on( "error", function( err ) {
		console.log( "ERROR: ", err );
		context.fali();
	});

	request.write( payloadOut );
	request.end();
};
