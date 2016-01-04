// ==========
// = stESProxy =
// Proxy for Elasticsearch for API Gateway
// 
// Config:
//	Role: "imageResizeLambdaSns"
//	Runtime: "nodejs",
//	MemorySize: 128,
//	Timeout: 10
// ==========

var AWS = require( "aws-sdk" ),
	crypto = require( "crypto" ),
	path = require( "path" ),
	// querystring = require( "querystring" ),
	isEmpty = require( "mout/lang/isEmpty" ),
	isObject = require( "mout/lang/isObject" ),
	isString = require( "mout/lang/isString" ),
	merge = require( "mout/object/merge" ),
	creds = new AWS.EnvironmentCredentials( "AWS" ),
	uuid = function() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function( c ) {
			var r = crypto.randomBytes( 1 )[ 0 ] % 16 | 0, v = c == "x" ? r : ( r&0x3|0x8 );
			return v.toString( 16 );
		});
	};


exports.handler = function( event, context ) {
	console.info( "EVENT DATA: ", JSON.stringify( event ) );
	
    var id = uuid(),
		params = {
			size: parseInt( event.resultSize, 10 ) || 100,
			from: parseInt( event.resultFrom, 10 ) || 0,
			q: event.searchQueryTerm,
			item: {
				id: event.caseId,
				data: event.payload,
			},
			es: {
				domain: event.esDomain,
				index: event.esIndex,
				doctype: event.esType
			}
		},
		esDomain = {
			endpoint: "search-st-test-es-holghprsatsvk5vjxhboehocxu.us-east-1.es.amazonaws.com",
			region: "us-east-1",
			index: params.es.index || "stapp",
			doctype: params.es.type || "case"
		},
		endpoint =  new AWS.Endpoint( esDomain.endpoint ),
		request = new AWS.HttpRequest( endpoint ),
		doRequest, processCase, processSearch, searchData, init;
	
	
	console.info( "PARAMS: ", params );	

	doRequest = function( method, query, payload ) {
		var send = new AWS.NodeHttpClient(),
			signer;
			
		method = String( method ).toUpperCase();
	
		request.path = path.join( "/", esDomain.index, esDomain.doctype, query );
		request.method = method;
		request.region = esDomain.region;
		request.headers = {
			"Content-Type": "application/json",
			"presigned-expires": false,
			"Host": endpoint.host
		};
		
		if ( payload ) {
			request.body = payload;
			request.headers[ "Content-Length" ] = payload.length;
		}
		
		signer = new AWS.Signers.V4( request, "es" );
		signer.addAuthorization( creds, new Date() );

		send.handleRequest( request, null, function ( resp ) {
			var result = "";
	
			resp.setEncoding( "utf8" );

			resp.on( "data", function( chunk ) {
				result += chunk;
			});
	
			resp.on( "end", function() {
				console.log( JSON.stringify( JSON.parse( result ) ) );
				console.log( "/n/n---------------------------------/n/n" );
				context.succeed( result );
			});
		}, context.fail );
	};

	processCase = function() {		
		if ( event.httpMethod === "GET" ) {
			// GET: /cases/{case-id}
			doRequest( "GET", params.item.id );
		} else if ( event.httpMethod === "POST" ) {
			// POST: /cases/{case-id}	<BODY: Document (source) object>
			doRequest( "POST", params.item.id, JSON.stringify( params.item.data ) );
		}
	};
	
	// GET: /cases
	// GET: /cases/search?q=xxxx
	// POST: /cases/search	<BODY: ES style query object>
	processSearch = function() {
		var queryObj = {
				fields: [ "_timestamp", "_source" ],
				from: params.from,
				size: params.size
			},
			queryStr;
					
		if ( !isEmpty( params.q ) && event.httpMethod === "GET" ) {
			queryObj.query = {
		        match: {
		            "_all": params.q
		        }
		    }
		} else if ( isObject( params.item.data ) && event.httpMethod === "POST" ) {
			queryObj = merge( queryObj, params.item.data );
		}
		
		queryStr = JSON.stringify( queryObj );
		
		// This will work via GET or POST
		doRequest( "POST", "_search", queryStr );
	};

	init = function() {
		if ( isObject( event ) ) {
			switch ( event.resourcePath ) {
				case "/cases/{case-id}":
					processCase();
					break;
				case "/search":
					processSearch();
					break;
				default:
					// Exit, return false
					context.fail( "REST path provided is null or not valid." );
			}
		}
	};

	init();
	
};

/*
	cd es-proxy
	zip -r ../es-proxy.zip .
	lambda-local -l index.js -t 20 -e event.json

*/
