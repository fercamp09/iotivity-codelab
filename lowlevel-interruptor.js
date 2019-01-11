var intervalId,
    handleReceptacle = {},
    ligthUri = "/a/light",
    iotivity = require( "iotivity-node/lowlevel" );
console.log( "Starting OCF stack in client mode" );

iotivity.OCRegisterPersistentStorageHandler( require( "iotivity-node/lib/StorageHandler" )() );

iotivity.OCInit( null, 0, iotivity.OCMode.OC_CLIENT_SERVER );

intervalId = setInterval( function() {
        iotivity.OCProcess();
}, 1000 );

var postResponseHandler = function( handle, response ) {
        console.log( "Received response to POST request:" );
        return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
};

iotivity.OCDoResource(
        {},
        iotivity.OCMethod.OC_REST_POST,
        "coaps://192.168.65.110:59833/switch",
        null,
        {
                type: iotivity.OCPayloadType.PAYLOAD_TYPE_REPRESENTATION,
                values: {
                        value: false
                }
        },
        iotivity.OCConnectivityType.CT_DEFAULT,
        iotivity.OCQualityOfService.OC_HIGH_QOS,
        postResponseHandler,
        null );


function assembleRequestUrl( eps, path ) {
    var endpoint;
    var endpointIndex;
    var result;
    for ( endpointIndex in eps ) {
            endpoint = eps[ endpointIndex ];
            if ( endpoint.tps  === "coaps" ) {
                    result = ( endpoint.tps + "://" +
                            ( endpoint.family & iotivity.OCTransportFlags.OC_IP_USE_V6 ? "[" : "" ) +
                            endpoint.addr.replace( /[%].*$/, "" ) +
                            ( endpoint.family & iotivity.OCTransportFlags.OC_IP_USE_V6 ? "]" : "" ) +
                            ":" + endpoint.port ) + path;
                    console.log( "GET request to " + result );
                    return result;
            }
    }
    throw new Error( "No secure endpoint found!" );
}

function discoverBinarySwitch(){
// Discover resources and list them
iotivity.OCDoResource(

    // The bindings fill in this object
    handleReceptacle,

    iotivity.OCMethod.OC_REST_DISCOVER,

    // Standard path for discovering resources
    iotivity.OC_MULTICAST_DISCOVERY_URI,

    // There is no destination
    null,

    // There is no payload
    null,
    iotivity.OCConnectivityType.CT_DEFAULT,
    iotivity.OCQualityOfService.OC_HIGH_QOS,
    function( handle, response ) {
            console.log( "Received response to DISCOVER request:" );
            console.log( JSON.stringify( response, null, 4 ) );
            var index,
                    getHandleReceptacle = {},
                    resources = response && response.payload && response.payload.resources,
                    resourceCount = resources ? resources.length : 0,
                    getResponseHandler = function( handle, response ) {
                            console.log( "Received response to GET request:" );
                            console.log( JSON.stringify( response, null, 4 ) );
                            return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
                    };

            // If the ligth URI is among the resources, issue the GET request to it
            for ( index = 0; index < resourceCount; index++ ) {
                    if ( resources[ index ].uri === ligthUri ) {
                            iotivity.OCDoResource(
                                    getHandleReceptacle,
                                    iotivity.OCMethod.OC_REST_GET,
                                    assembleRequestUrl( resources[ index ].eps, ligthUri ),
                                    null,
                                    {
                                            type: iotivity.OCPayloadType.PAYLOAD_TYPE_REPRESENTATION,
                                            values: {
                                                    question: "How many angels can dance on the head of a pin?"
                                            }
                                    },
                                    iotivity.OCConnectivityType.CT_DEFAULT,
                                    iotivity.OCQualityOfService.OC_HIGH_QOS,
                                    getResponseHandler,
                                    null );
                                    return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
                    }
            }

            return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;
    },

    // There are no header options
null );
}
// Exit gracefully when interrupted
process.on( "SIGINT", function() {
    console.log( "SIGINT: Quitting..." );

    // Tear down the processing loop and stop iotivity
    clearInterval( intervalId );
    iotivity.OCStop();

    // Exit
    process.exit( 0 );
} );
