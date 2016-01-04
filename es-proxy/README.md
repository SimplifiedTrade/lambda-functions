#Lambda Function: es-proxy








==========================================================================================

## POST (Create)

```
#set($inputRoot = $input.path('$'))
{
  "httpMethod": "$context.httpMethod",
  "resourceId": "$context.resourceId",
  "resourcePath": "$context.resourcePath",
  "deployStage": "$context.stage",
  "esDomain": "$stageVariables.esDomain",
  "esIndex": "$stageVariables.esIndex",
  "esType": "$stageVariables.esType",
  "caseId": "$input.params('case-id')",
  "payload": $input.json('$')
}
```

### Payload ES Search Obj
*** Any Valid JSON Doc Object (Case obj) ***



### EVENT OBJ

```
{
    "httpMethod": "POST",
    "resourceId": "5ioouv",
    "resourcePath": "/cases/{case-id}",
    "deployStage": "dev",
    "esDomain": "st-test-es",
    "esIndex": "stapp",
    "esType": "case",
    "caseId": "500000000-b269-11e5-94cb-685b35938fe5",
    "payload": {
        "ONE": 5,
        "TWO": 0,
        "THREE": 0
    }
}
```






==========================================================================================


## GET (By Id)

```
#set($inputRoot = $input.path('$'))
{
  "httpMethod": "$context.httpMethod",
  "resourceId": "$context.resourceId",
  "resourcePath": "$context.resourcePath",
  "deployStage": "$context.stage",  
  "esDomain": "$stageVariables.esDomain",
  "esIndex": "$stageVariables.esIndex",
  "esType": "$stageVariables.esType",
  "caseId": "$input.params('case-id')"
}
```


### EVENT OBJ

```
{
    "httpMethod": "GET",
    "resourceId": "5ioouv",
    "resourcePath": "/cases/{case-id}",
    "deployStage": "dev",
    "esDomain": "st-test-es",
    "esIndex": "stapp",
    "esType": "case",
    "caseId": "600000000-b269-11e5-94cb-685b35938fe5"
}
```



==========================================================================================



## SEARCH (Get All or Search by Term)

```
#set($inputRoot = $input.path('$'))
{
  "httpMethod": "$context.httpMethod",
  "resourceId": "$context.resourceId",
  "resourcePath": "$context.resourcePath",
  "deployStage": "$context.stage",
  "esDomain": "$stageVariables.esDomain",
  "esIndex": "$stageVariables.esIndex",
  "esType": "$stageVariables.esType",
  "searchQueryTerm": "$input.params('q')",
  "resultSize": "$input.params('size')",
  "resultFrom": "$input.params('from')"
}
```




### EVENT OBJ

```
{
    "httpMethod": "GET",
    "resourceId": "g09i4d",
    "resourcePath": "/search",
    "deployStage": "dev",
    "esDomain": "st-test-es",
    "esIndex": "stapp",
    "esType": "case",
    "searchQueryTerm": "4",
    "resultSize": "10",
    "resultFrom": "0"
}
```



==========================================================================================


## SEARCH (POST Query via 'query' ES query object)

```
#set($inputRoot = $input.path('$'))
{
  "httpMethod": "$context.httpMethod",
  "resourceId": "$context.resourceId",
  "resourcePath": "$context.resourcePath",
  "deployStage": "$context.stage",
  "esDomain": "$stageVariables.esDomain",
  "esIndex": "$stageVariables.esIndex",
  "esType": "$stageVariables.esType",
  "payload": $input.json('$'),
  "resultSize": "$input.params('size')",
  "resultFrom": "$input.params('from')"
}
```


### Payload ES Search Obj

```
{
	query: {
		match: {
			"_all": 4
		}
	}
}
```


### EVENT OBJ

```
{
  "httpMethod": "POST",
  "resourceId": "g09i4d",
  "resourcePath": "/search",
  "deployStage": "test-invoke-stage",
  "esDomain": "st-test-es",
  "esIndex": "stapp",
  "esType": "case",
  "payload": {"query":{"match":{"_all":4}}},
  "resultSize": "10",
  "resultFrom": "0"
}
```








