// ==========
// = stImageRouter =
// An Amazon S3 trigger that on image put routes image to final location and triggers resize events
// 
// Config:
//	Role: "imageResizeLambdaSns"
//	Runtime: "nodejs",
//	MemorySize: 128,
//	Timeout: 10
// ==========

var AWS = require( "aws-sdk" ),
	buffer = require( "buffer" ),
	async = require( "async" ),
	path = require( "path" );


exports.handler = function( event, context ) {
	
	console.info( "EVENT: ", event );
	
	var s3 = new AWS.S3(),
		sns = new AWS.SNS(),
		multiSzTopicArn = "arn:aws:sns:us-east-1:902325651126:stSnsImageMakeSizes",
		szPreset = [
			{ size: "l", width: 1024 },
			{ size: "m", width: 512 },
			{ size: "s", width: 256 }
		],
		procEvData, moveS3Obj, deleteS3Obj, statMultiSizesEvts, doneHandler;


	statMultiSizesEvts = function( copyObj, next ) {
		var data = copyObj.Metadata;

		async.eachSeries( szPreset, function( item, nextItem ) {
			var msg;

			item.id = data.id;
			item.type = data.type;
			item.bucket = copyObj.Bucket;
			msg = JSON.stringify( item );

			sns.publish( {
				TopicArn: multiSzTopicArn,
				Subject: "Resize Image",
				Message: msg
			}, nextItem );	
		}, next );
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
		var err, ext, id, record, bucket, key, k, newKey, newObj, parts;
		
		try {
			record = event.Records[ 0 ];
			k = record.s3.object.key;
			bucket = record.s3.bucket.name;
			key = bucket + "/" + decodeURIComponent( k.replace( /\+/g, " " ) );
			parts = key.match( /([^\/.]+)$|([^\/]+)(\.[^\/.]+)$/ );
			id = parts[ 2 ],
			ext = String( parts[ 3 ] ).replace( ".", "" ),
			newKey = id + "/" + parts[ 0 ];
		} catch ( ex ) {
			err = "Cound not parse event record: Records[0]. ";
		}
		
		newObj = {
			Bucket: bucket,
			CopySource: key,
			Key: newKey,
			Metadata: {
				id: id,
				type: ext
			}
		};
		
		next( err, newObj );
	};
	
	moveS3Obj = function( params, next ) {
		
		console.info( "ABOUT TO COPY: ", params );
		
		s3.copyObject( params, function( err, data ) {
			console.info( "DATA FROM COPY: ", data );
			
			deleteS3Obj( params );
			
			next( err, params );
		});
	};
	
	deleteS3Obj = function( params ) {
		params = AWS.util.copy( params );
		params.Key = params.CopySource;
		delete params.CopySource;
		delete params.Metadata;
		params.Key = params.Key.replace( params.Bucket + "/", "" );
		
		console.info( "ABOUT TO DELETE: ", params );
		
		return s3.deleteObject( params, function( err, data ) {
			if ( err ) {
				console.log( "Error deleting the following item in S3: ", params );
			}
		});
	};
	
	async.waterfall( [ procEvData, moveS3Obj , statMultiSizesEvts ], doneHandler );
	
};


/*
	cd image-router
	zip -r ../image-router.zip .
	lambda-local -l index.js -t 20 -e event.json

*/
