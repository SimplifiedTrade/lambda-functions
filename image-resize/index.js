console.log( "Loading function" );

var AWS = require( "aws-sdk" ),
	buffer = require( "buffer" ),
	async = require( "async" ),
	util = require( "util" ),
	gm = require( "gm" ).subClass( { imageMagick: true } ),
	// Config
	bucket = "lambda-test-999";


exports.handler = function( event, context ) {	
	
	var s3 = new AWS.S3(),
		procEvData, getOrig, procImage, saveToS3, doneHandler, getExt;

	getExt = function( fmt ) {
		var f = String( fmt ).toLowerCase();
		
		switch ( f ) {
			case "jpeg":
				f = "jpg";
				break;
		};
		
		return f;
	};
	
	doneHandler = function( err, result ) {
		if ( err ) {
			console.log( "ERROR: ", err );
			context.fail( err );
		} else {
			console.log( "SUCCESS!" );
			context.succeed( "DONE, operation successful." );
		}

		return;
	};
	
	procEvData = function( next ) {
		var snsData;
		
		try {
			snsData = JSON.parse( event.Records[ 0 ].Sns.Message );
			next( null, snsData );
		} catch ( ex ) {
			doneHandler( "Cound not parse event record: Sns.Message." );
		}
	};
	
	getOrig = function( snsData, next ) {
		console.info( "GETTING ORIG..." );
		
		var key = util.format( "%s/%s.%s", snsData.id, snsData.id, snsData.type );
		
		
		
		s3.getObject( {
			Bucket: bucket,
			Key: key
		}, function( err, data ) {
			// if ( err ) { doneHandler( err ); return; }
			next( err, snsData, data.Body );
		});
	};
	
	procImage = function( snsData, imgBuf, next ) {
		var width = snsData.width;
		
		gm( imgBuf ).format( function( err, format ) {
			if ( err ) { doneHandler( err ); return; }

			var ext = getExt( format );
			
			console.log( "TYPE/EXT: ", format, ext );
			
			this.resize( width ).toBuffer( ext, function( err, buffer ) {
				// if ( err ) { doneHandler( err ); return; }
				next( err, snsData, buffer, ext );
			});
		});
	};
	
	saveToS3 = function( snsData, bufImage, type, next ) {
		var key = util.format( "%s/%s.%s", snsData.id, snsData.size, type ),
			dataObj = {
				Bucket: bucket,
				Key: key,
				Body: bufImage,
				ContentLength: bufImage.length,
				ContentType: "image/" + type
			};			
		
		s3.putObject( dataObj, function( err ) {
			// if ( err ) { doneHandler( err ); return; }
			next( err );
		});
	};

	
	async.waterfall( [ procEvData, getOrig, procImage, saveToS3 ], doneHandler );
	
};


/*

	lambda-local -l index.js -t 20 -e event-sample.js

*/
