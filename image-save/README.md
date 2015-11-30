#Lambda Function: image-save



### Gateway API Stages

* dev
* prod



### Stage Vars:

* prod
	* multiSzTopicArn	arn:aws:sns:us-east-1:902325651126:stSnsImageMakeSizes
	* resourceBucket	st-dev-case-resources
	
* dev
	* multiSzTopicArn	arn:aws:sns:us-east-1:902325651126:stSnsImageMakeSizes
	* resourceBucket	st-dev-case-resources


### Gateway API Model

```
stSaveImagePostSchema
{
	"title": "Save Image Resource Schemea",
	"type": "object",
	"properties": {
		"id": {
			"type": "string"
		},
		"bucket": {
			"type": "string"
		},
		"b64Image": {
			"type": "string"
		},
		"multiSzTopicArn": {
			"type": "string"
		}
	},
	"required": [ "id", "bucket", "b64Image", "multiSzTopicArn" ]
}
```



### Gateway API Input 
```
#set($inputRoot = $input.path('$'))
{
  "id": "$inputRoot.id",
  "multiSzTopicArn": "$stageVariables.multiSzTopicArn",
  "bucket": "$stageVariables.resourceBucket",
  "b64Image": "$inputRoot.b64Image"
}
```


