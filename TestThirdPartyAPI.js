/** 
@NApiVersion 2.0
@NScriptType Restlet
@NModuleScope Public
*/

define(['N/log', 'N/record', 'N/search'], function (log, record, search) {
    /*
     * vars: dataRequested, dateRanges
     * info: parsed from post
     *       used in getData functions to run NetSuite searches
     */
    var dataRequested;
    var dateRanges;
    
    /*
     * var: returnPayload
     * info: JSON to be constructed by getData
     *       return in post
     */
    var returnPayload;

    /*
     * var: getDataFunctions
     * info: maps keywords to functions
     *       function getData uses this to process requests
     */
    var getDataFunctions = {
        salesorder: function() { getSalesOrders(); }
    }

    /*
     * function: post
     * info: receives HTTP post
     *       sets global vars and calls getData for handling
     * params: (JSON) params = payload of requested data
     */
    function post(params) {
        logMessage('POST', '=' + JSON.stringify(params));

        dataRequested = params['data'];
        dateRanges = params['dateRange'];

        getData(); 

        return 'dataRequested=' + dataRequested.toString() + ' dataRanges=' + dateRanges.toString();
    }

    /*
     * function: getData
     * info: called from post after setting global vars
     *       uses getDataFunctions
     */
    function getData() {
        for (var i = 0; i < dataRequested.length; i++) {
            logMessage('Data Requested', '=' + dataRequested[i]);
            getDataFunctions[dataRequested[i]]();
        }
    }

    /*
     * function: getSalesOrder
     * info: get sales order using N/search
     *       uses dateRanges,
     */
    function getSalesOrders() {
        logMessage('GET SALES ORDERS', 'getSalesOrders()');
    }

    /*
     * function: logMessage
     * info: default log in NetSuite
     * params: (str) title, (str) details
     */
    function logMessage(title, details) {
        log.debug({
            title: title,
            details: details
        });
    }

    /*
     * return exports for NetSuite
     */
    return {
        post: post
    }
});