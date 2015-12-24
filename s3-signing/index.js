// ==========
// = stS3Signing =
// Lambda Function for AWS, to sign requests for S3 uploads
// 
// Config:
//	Role: "imageResizeLambdaSns"
//	Runtime: "nodejs",
//	MemorySize: 128,
//	Timeout: 3
// ==========

var AWS = require( "aws-sdk" )
	crypto = require( "crypto" ),
	buffer = require( "buffer" );


exports.handler = function( event, context ) {
	
	if ( !event || !event.fileName || !event.bucket ) {
		context.fail( "Missing required propertie(s)." );
	}

	var bucket = event.bucket,
		fileName = event.fileName,
		buildOutput;
	
	buildOutput = function() {
		// IAM USER: s3Uploader
		// TODO: hard code values are temporary, the user has only upload access
		// This will be changed soon
		var awsKey = "AKIAJOUMI65L7UAQEGPA",
			secret = "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",
			expiration = new Date( new Date().getTime() + 1000 * 60 * 5 ).toISOString(),
			policy = {
				expiration: expiration,
				conditions: [
					{ bucket: bucket },
					{ key: fileName },
					{ acl: "private" },
					[ "starts-with", "$content-type", "" ],
					[ "content-length-range", 0, 524288000 ]
				]
			},
			policyBase64 = new Buffer( JSON.stringify( policy ), "utf8" ).toString( "base64" ),
			signature = crypto.createHmac( "sha1", secret ).update( policyBase64 ).digest( "base64" ),
			response = {
				bucket: bucket,
				awsKey: awsKey,
				policy: policyBase64,
				signature: signature,
				fileName: fileName
			};

		// SUCCESS
		context.succeed( response );
	};
	
	buildOutput();

};

/*
	cd s3-signing
	zip -r ../s3-signing.zip .
	lambda-local -l index.js -t 20 -e event.json

*/
