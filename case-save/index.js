// ==========
// = stCaseSave01 =
// Lambda Function for AWS, to save a Case
// 
// Config:
//	Role: "imageResizeLambdaSns"
//	Runtime: "nodejs",
//	MemorySize: 192,
//	Timeout: 20
// ==========

var AWS = require( "aws-sdk" ),
	buffer = require( "buffer" ),
	// https = require( "https" ),
	path = require( "path" ),
	// tls = require( "tls" ),
	crypto = require( "crypto" ),
	// util = require( "util" ),
	nimble = require( "nimble" ),
	mixIn = require( "mout/object/mixIn" ),
	isObject = require( "mout/lang/isObject" ),
	isString = require( "mout/lang/isString" );


/* Globals */
var esDomain = {
		endpoint: "search-st-test-es-holghprsatsvk5vjxhboehocxu.us-east-1.es.amazonaws.com",
		region: "us-east-1",
		index: "stapp",
		doctype: "case"
	},
	lambda = new AWS.Lambda(),
	uuid = function() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function( c ) {
			var r = crypto.randomBytes( 1 )[ 0 ] % 16 | 0, v = c == "x" ? r : ( r&0x3|0x8 );
			return v.toString( 16 );
		});
	};
	
exports.handler = function( event, context ) {
	
	console.info( "EVENT DATA: ", JSON.stringify( event ) );	
	
	var id = event.id || uuid(),
		endpoint =  new AWS.Endpoint( esDomain.endpoint ),
		creds = new AWS.EnvironmentCredentials( "AWS" ),
		request = new AWS.HttpRequest( endpoint ),
	
		objSaveImg = {
			id: id,
			bucket: "st-dev-case-resources",
			multiSzTopicArn: "arn:aws:sns:us-east-1:902325651126:stSnsImageMakeSizes"
		},
		objOputput = {
			b64Str: "",
			dbData: {}
		},
		
		savePic, saveData, procDataObj, procInput;
		
	// Save pic by calling another Lambda
	savePic = function( done ) {
		
		objSaveImg.b64Image = objOputput.b64Str;
		
		lambda.invoke( {
			FunctionName: "stImageSave01",
			Payload: JSON.stringify( objSaveImg )
		}, done );
	};
	
	// Save data to ES
	saveData = function( done ) {
		var send = new AWS.NodeHttpClient(),
			signer;
		
		request.path = path.join( "/", esDomain.index, esDomain.doctype, id );
		request.method = "POST";
		request.region = esDomain.region;
		request.headers = {
			"Content-Type": "application/json",
			"Content-Length": objOputput.dbData.length,
			"presigned-expires": false,
			"Host": endpoint.host
		};
		request.body = objOputput.dbData;

		signer = new AWS.Signers.V4( request, "es" );
		signer.addAuthorization( creds, new Date() );
		
		send.handleRequest( request, null, function ( resp ) {
			var result = "";
		
			resp.setEncoding( "utf8" );

			resp.on( "data", function( chunk ) {
				result += chunk;
			});
		
			resp.on( "end", function() {
				console.log( result );
				done( null, result );
			});
		}, done );
	};
	
	procDataObj = function( dataObj ) {
		objOputput.b64Str = dataObj.caseData.photoBase64;
		
		// Modify Obj
		delete dataObj.caseData.photoBase64;
		
		objOputput.dbData = JSON.stringify( mixIn( {}, dataObj.caseData ) );
		
		delete dataObj.caseData;
		
		mixIn( objSaveImg, dataObj );
	};

	procInput = function( data ) {
		var postData;

		if ( isObject( data ) ) {
			postData = procDataObj( data );
		} else if ( isString( data ) ) {
			try {
				return procInput( JSON.parse( data ) );
			} catch ( ex ) {
				context.fail( ex );
			}
		} else {
			context.fail( "Event input invalid!" );
		}
		
		return postData;
	};

	// Process payload
	procInput( event );
	
	nimble.parallel( [ saveData, savePic ], function( err, results ){
		if ( err ) {
			context.fail( err );
			return;
		}
		
		context.succeed( results );
	});
};


/*
	cd case-save
	zip -r ../case-save.zip .
	lambda-local -l index.js -t 20 -e event.json

*/
