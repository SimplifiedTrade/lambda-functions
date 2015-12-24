// ==========
// = stImageSave01 =
// Lambda Function for AWS, to upload an image to S3 then fire off image resize events on SNS
// 
// Config:
//	Role: "imageResizeLambdaSns"
//	Runtime: "nodejs",
//	MemorySize: 192,
//	Timeout: 40
// ==========

var AWS = require( "aws-sdk" ),
	buffer = require( "buffer" ),
	async = require( "async" ),
	util = require( "util" ),
	gm = require( "gm" ).subClass( { imageMagick: true } );


exports.handler = function( event, context ) {	
	
	console.log( "EVENT OBJ: ", JSON.stringify( event ) );
	
	var s3 = new AWS.S3(),
		sns = new AWS.SNS(),
		reqProps = [ "id", "bucket", "b64Image", "multiSzTopicArn" ],
		szPreset = [
			{ size: "l", width: 1024 },
			{ size: "m", width: 512 },
			{ size: "s", width: 256 }
		],
		checkReqProps, procPostData, procImage, saveToS3, statMultiSizesEvts, doneHandler, getExt;

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
	
	
	statMultiSizesEvts = function( postData, size, type, next ) {
		async.eachSeries( szPreset, function( item, nextItem ) {
			var msg;
			
			// if ( size.width > item.width ) {
			// } else {
			// 	nextItem();
			// }
			
			item.id = postData.id;
			item.type = type;
			item.bucket = postData.bucket;
			msg = JSON.stringify( item );

			sns.publish( {
				TopicArn: postData.multiSzTopicArn,
				Subject: "Resize Image",
				Message: msg
			}, nextItem );	
		}, next );
	};
	
	
	procPostData = function( next ) {
		var data = event,
			postData, reqPropsPass;
		
		if ( !!data && data.constructor === Object ) {
			postData = event;
		} else if ( !!data && data.constructor === String ) {
			postData = JSON.parse( event );
		} else {
			next( "Cound not parse event object." );
			return;
		}
		
		// Check that all required props have been sent over in the POST
		reqPropsPass = checkReqProps( postData );
		next( reqPropsPass, postData );
	};
	
	procImage = function( postData, next ) {
		var payload = postData.b64Image,
			bufImage = new Buffer( payload.replace( /^data:image\/\w+;base64,/, "" ), "base64" );

		gm( bufImage ).format( function( err, format ) {
			if ( err ) { next( err ); }

			var type = String( format ).toLowerCase(),
				contentType = "image/" + type;
				
			this.autoOrient().size( function( err, size ) {
				if ( err ) { next( err ); }
				
				this.toBuffer( format, function( err, buffer ) {
					next( err, postData, size, type, contentType, buffer );
				});
			});
		});
	};
	
	saveToS3 = function( postData, size, type, contentType, bufImage, next ) {
		var ext = getExt( type ),
			id = String( postData.id ).toLowerCase(),
			key = util.format( "%s/%s.%s", id, id, ext );
			
			dataObj = {
				Bucket: postData.bucket,
				Key: key,
				Body: bufImage,
				ContentLength: bufImage.length,
				ContentType: contentType
			};			
		
		s3.putObject( dataObj, function( err ) {
			next( err, postData, size, ext );
		});
	};

	
	async.waterfall( [ procPostData, procImage, saveToS3, statMultiSizesEvts ], doneHandler );
	
};


/*
	cd image-save
	zip -r ../image-save.zip .
	lambda-local -l index.js -t 20 -e event.json

*/
