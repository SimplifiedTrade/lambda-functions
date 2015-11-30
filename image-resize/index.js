// ==========
// = stImageResize01 =
// Lambda Function for AWS, to resize an image located on S3 after an SNS event has been fired
// Role: imageResizeLambdaSns
// SNSTopic Listener: stSnsImageMakeSizes | arn:aws:sns:us-east-1:902325651126:stSnsImageMakeSizes
// ==========


var AWS = require( "aws-sdk" ),
	buffer = require( "buffer" ),
	async = require( "async" ),
	util = require( "util" ),
	gm = require( "gm" ).subClass( { imageMagick: true } );


exports.handler = function( event, context ) {	
	
	var s3 = new AWS.S3(),
		reqProps = [ "size", "width", "id", "type", "bucket" ],
		checkReqProps, procEvData, getOrig, procImage, saveToS3, doneHandler, getExt;

	getExt = function( fmt ) {
		var f = String( fmt ).toLowerCase();
	
		switch ( f ) {
			case "jpeg":
				f = "jpg";
				break;
			case "tiff":
				f = "tif";
				break;
		};
	
		return f;
	};
	
	checkReqProps = function( msgObj ) {
		var pass = null,
			msg = "Missng property: '%s' was either not provided or was sent empty.",
			len = reqProps.length,
			i = 0, prop, item;
		
		for ( ; i < len; i++) {
			prop = reqProps[ i ];
			item = msgObj[ prop ];
			
			if ( !item || item === "" ) {
				pass = util.format( msg, prop );
				break;
			}
		}
		
		return pass;
	};
	
	doneHandler = function( err, result ) {
		if ( err ) {
			console.log( "ERROR: ", err );
			context.fail( err );
		} else {
			console.log( "SUCCESS: ", JSON.stringify( result ) );
			context.succeed( "DONE, operation successful." );
		}

		return;
	};
	
	procEvData = function( next ) {
		var snsData, reqPropsPass;
		
		try {
			snsData = JSON.parse( event.Records[ 0 ].Sns.Message );
		} catch ( ex ) {
			next( "Cound not parse event record: Sns.Message." );
			return;
		}
		
		// Check that all required props have been sent over in Message obj
		reqPropsPass = checkReqProps( snsData );		
		next( reqPropsPass, snsData );
	};
	
	getOrig = function( snsData, next ) {
		var id = String( snsData.id ).toLowerCase(),
			key = util.format( "%s/%s.%s", id, id, snsData.type );
		
		s3.getObject( {
			Bucket: snsData.bucket,
			Key: key
		}, function( err, data ) {
			next( err, snsData, data.Body );
		});
	};
	
	procImage = function( snsData, imgBuf, next ) {
		var width = snsData.width;
		
		gm( imgBuf ).format( function( err, format ) {
			if ( err ) { next( err ); }

			var ext = getExt( format );
			
			this.resize( width ).toBuffer( ext, function( err, buffer ) {
				next( err, snsData, buffer, ext );
			});
		});
	};
	
	saveToS3 = function( snsData, bufImage, type, next ) {
		var key = util.format( "%s/%s.%s", snsData.id, snsData.size, type ),
			dataObj = {
				Bucket: snsData.bucket,
				Key: key,
				Body: bufImage,
				ContentLength: bufImage.length,
				ContentType: "image/" + type
			};			
		
		s3.putObject( dataObj, function( err ) {
			next( err, snsData );
		});
	};

	
	async.waterfall( [ procEvData, getOrig, procImage, saveToS3 ], doneHandler );
	
};


/*
	zip -r ../image-resize.zip .
	lambda-local -l index.js -t 20 -e event-sample.js

*/
