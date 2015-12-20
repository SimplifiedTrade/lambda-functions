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
	
var hostname = "search-st-test-es-holghprsatsvk5vjxhboehocxu.us-east-1.es.amazonaws.com",
	cert = [ "-----BEGIN CERTIFICATE-----",
	"MIIDXTCCAkWgAwIBAgIJAN+vFZLvlsZyMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV",
	"BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX",
	"aWRnaXRzIFB0eSBMdGQwHhcNMTUxMjA3MDcxMjQwWhcNMTgwOTAxMDcxMjQwWjBF",
	"MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50",
	"ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB",
	"CgKCAQEAtgm3NMbfjnnoep9udaUOouSJ4bfB6dVxfKnP1ALAH4k9lXW1s2PjK9Y7",
	"LaHiVlTlU+fnb1ZfjiSjcbGzJosloFvIyENo066Kl7YxlOdUtJhNS3Lc8GuqGzSK",
	"YWwChj2C+ZuT0sK4g+lVb1CWjeUfCkyAqk/kOGi6bboWu9XT4eUNj8Dv9j5nFb5R",
	"Y0Y/j1aI7oq2FBattdnjYtg5hGaE2lJeHoyapEzO5bcozadqEHxece1XbuSRvoAS",
	"rFMcH9dH/gbugyV2Cf9s0Y+sNlRvdMKIFsl/kG4pP9R+QGJiRQkOQkB0Ni6pFCVT",
	"vyjva/4TuDJRsPrYhLHMxTs8FQJqgwIDAQABo1AwTjAdBgNVHQ4EFgQUyToJ7XIK",
	"NYQ4o9unywU8jexcI4EwHwYDVR0jBBgwFoAUyToJ7XIKNYQ4o9unywU8jexcI4Ew",
	"DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAqi2xHsjaSaOloE4OoPUO",
	"bE6hS23h4s55bk3SWzvQnirA9nWOUXtutestOCkfM8vxS0n0VpZLZK9rb0rWf5Fi",
	"QyrYTEmTjU8JKLRgTR9ZHujeSRjY+zZvllfg6ntM6PZTaPrObmqMe+lGS0PYC5GE",
	"4DGzaxYKL6jJYcoDL9/0PJxBA7JnQCFJttuEIALkjwOkBMArOSYclJ7A2VSiOIp/",
	"8GAg5/89Ovo91qqRLnNbXQ56JMzqYvM9Ecz9TFvY5o9c84Pl2jHVzxCxsjbojxw7",
	"OdjYKKhtsNCcoInlMMfuxlSOkeUrwjTBx+JKkKlSYK2Tbhg1tK92gp6kIpFYLNzg",
	"FQ==",
	"-----END CERTIFICATE-----" ].join( "\n" ),
	key = [ "-----BEGIN PRIVATE KEY-----",
	"MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC2Cbc0xt+Oeeh6",
	"n251pQ6i5Inht8Hp1XF8qc/UAsAfiT2VdbWzY+Mr1jstoeJWVOVT5+dvVl+OJKNx",
	"sbMmiyWgW8jIQ2jTroqXtjGU51S0mE1Lctzwa6obNIphbAKGPYL5m5PSwriD6VVv",
	"UJaN5R8KTICqT+Q4aLptuha71dPh5Q2PwO/2PmcVvlFjRj+PVojuirYUFq212eNi",
	"2DmEZoTaUl4ejJqkTM7ltyjNp2oQfF5x7Vdu5JG+gBKsUxwf10f+Bu6DJXYJ/2zR",
	"j6w2VG90wogWyX+Qbik/1H5AYmJFCQ5CQHQ2LqkUJVO/KO9r/hO4MlGw+tiEsczF",
	"OzwVAmqDAgMBAAECggEBAIRGGQbTf3xi3ufDU5tOnY0FrZ8DTHdiLj2ckrSGbx47",
	"NjGVP7ujWF3xJD0rRXDf7WeDuiqvw21g+BbUPc5DC8szBnlmahRu3qwQqoR9d5Jm",
	"nLu3Mg3M3eU4z1itCESNC8/eGZLrBPJtKTRihZODqoNsRY370WSfzN+QeZZxcK3R",
	"7T+hEmCAfHxqdtHUOgfpquUi/7vVWWuXsNoJ80k+ZHM9pd10Et/1cw749Dvns4bx",
	"uSd9hOONMuLSqUVSaNttXUmB1IHU5qqK51W1VdUksNntr1SZs19hLh+CeynEVgVy",
	"3V0icnnMOWu4i0aL2enx4fJfj14Evn+3mF1ZhX7KBbkCgYEA5NTkKKc2FLxTNs28",
	"tGsM1OJKFcSrrM4VbXeluibkiC5+lUT7rq1JjzRdpGeRoruOmSk3XKly5vCwvr/J",
	"A2x7D3FN97QhxaeiIEnSv1Ejx1fit+Bu8CQ/r2vfmkPZAvYENxRRfXZywpzhPbu6",
	"Go/aMJBlRXl78Zl1U5DhyVFYOeUCgYEAy6aT78vHOJbN/tPQwHlfOp2MsbZoHunL",
	"IowXDAsB5QJNMivtwnrV9/CiHxDqvOIVrK2NLkVWte/jrhYulAhbAev1je8zz3AP",
	"Ej4j1L1ERz+odoFRntcC7etpy0XOSRo8GARHDbEER1Dz9cN8w1YCnKEWKkOntlBh",
	"ifzrnHfLLEcCgYB4Lqe2AjwRH+fEfMGDMEYI+OBYFnbjx0jRuWk9H3gfXev1kclt",
	"sG1V3PbhhdOjWEZIgrEk5YoHaJorVKbKOYtYTPXaBq1GFgi8VIlvGbpk0++rCyC4",
	"1xDrnQhPCRtMxtDn7K/v6OnU9HgH6DSSBsNdhjjqCCfkd+h6/zjWdvaTUQKBgQC9",
	"/yhwBWdVhWSkhUtx9wqAbjKwLiTQCoEpNxfddXuMA+yvjUpiMiXkDw3B/A90r11X",
	"YAeijrBKR4fch/dmxrDZhyHuDKgCtWJqO61EMlw8OMjb3uSeU6z4+bQXIIZHr4E3",
	"Su5beLYsLvucY4jH2TvQk31RaxNSRYXqrhvHPABCywKBgDTVX/xygQC1DEy+2swx",
	"0JwGqWwcWgrDAFHs/mUmeKwqoMSzjRIyP2BbaBfgsvX1rTPRbkJw/YOcJCFLD5aT",
	"04GqMHgCEygpxr633nnlFaeKr9fl8+0RkYt/ZieeQkj+XP+6T9kBjE17K+ZibFWk",
	"Qu7izR+3Gu+FbikAZvHbTm6E",
	"-----END PRIVATE KEY-----" ].join( "\n" ),
	cryptoCredentials = { key: key, cert: cert },
	credentials = ( tls.createSecureContext ) ? tls.createSecureContext( cryptoCredentials ) : crypto.createCredentials( cryptoCredentials ),
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
		request;
	
	request = https.request( {
		port: 443,
		path: "/stapp/case/" + id,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": payloadOut.length
		},
		hostname: hostname,
		key: key,
		cert: cert
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


/*
	zip -r ../image-save.zip .
	lambda-local -l index.js -t 20 -e event-sample.js

*/
