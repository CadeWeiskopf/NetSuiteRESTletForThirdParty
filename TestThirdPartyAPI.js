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
     * vars: returnPayload
     * info: JSON to be constructed by getData
     *       return in post
     */
    var returnPayload = {};

    /*
     * var: getDataFunctions
     * info: maps keywords to functions
     *       function getData uses this to process requests
     */
    var getDataFunctions = {
        inventory: function () { getInventory(); },
        salesorder: function () { getSalesOrders(); }
    }

    /*
     * var: inventoryItemIDs
     *      set in getInventory(), 
     *      used for getSalesOrder() search
     */
    var inventoryItemIDs = [];

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

        return returnPayload;
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
     * function: getInventory
     * info: get items using N/search
     *       
     */
    function getInventory() {
        logMessage('GET INVENTORY', 'getInventory()');
        var inventoryJson = {};
        var listOfItems = [];
        var item = {};

        //var itemSearch = search.load({
        //    id: 2080
        //});
        //itemSearch.run().each(function (result) {
        //    item = {};
        //    result.columns.forEach(function (column) {
        //        item[column.name] = result.getValue(column);
        //    });
        //    logMessage('ITEM', JSON.stringify(item));
        //    listOfItems.push(item);
        //    return true;
        //});

        var itemSearchObj = search.create({
            type: "item",
            filters: [
                ["inventorylocation.name", "startswith", "verustat"], 
                "AND", 
                ["locationquantityonhand", "greaterthan", "0"]
            ],
            columns: [
                "internalid",
                "itemid",
                "type",
                search.createColumn({
                    name: "name",
                    join: "inventoryLocation"
                }),
                search.createColumn({
                    name: "locationquantityonhand",
                    sort: search.Sort.DESC
                }),
                "locationquantityavailable",
                search.createColumn({
                    name: "locationquantityonhand",
                    sort: search.Sort.DESC
                })
            ]
        });

        itemSearchObj.run().each(function (result) {
            item = {};
            result.columns.forEach(function (column) {
                item[column.name] = result.getValue(column);
                if (column.name == 'internalid') {
                    inventoryItemIDs.push(result.getValue(column));
                }
            });
            logMessage('ITEM', JSON.stringify(item));
            listOfItems.push(item);
            return true;
        });

        returnPayload['inventory'] = listOfItems;

        logMessage('LIST OF ' + listOfItems.length + ' ITEMS', listOfItems.toString());
        logMessage('LIST OF ITEM IDs', inventoryItemIDs.toString());
    }

    /*
     * function: getSalesOrder
     * info: get sales order using N/search
     *       uses dateRanges,
     */
    function getSalesOrders() {
        logMessage('GET SALES ORDERS', 'getSalesOrders()');
        var salesOrdersJson = {};
        var listOfSalesOrders = [];
        var saleOrder = {};

        var salesOrderSearchObj = search.create({
            type: "salesorder",
            filters: [
                ["type", "anyof", "SalesOrd"], 
                "AND", 
                ["anylineitem", "anyof", inventoryItemIDs/*"17829","6691","17593","18266","6818"*/],
                "AND",
                ["trandate", "within", dateRanges[0], dateRanges[1]],
                "AND", 
                ["mainline", "is", "F"]
            ],
            columns: [
                search.createColumn({
                    name: "ordertype",
                    sort: search.Sort.ASC
                }),
                "trandate",
                "tranid",
                "item",
                "entity",
                "account",
                "memo",
                "amount",
            ]
        });
         //var searchResultCount = salesorderSearchObj.runPaged().count;

        var startIndex = -1000;

        var salesOrderSearchResults = [];

        do {
            startIndex += 1000;
            var salesOrderSearchPortion = salesOrderSearchObj.run().getRange({
                start: startIndex,
                end: startIndex + 1000
            });
            salesOrderSearchPortion.forEach(function (result) {
                salesOrderSearchResults.push(result);
            });
        } while (salesOrderSearchPortion.length > 0); 

        for (var i = 0; i < salesOrderSearchResults.length; i++) {
            var result = salesOrderSearchResults[i];
            result.columns.forEach(function (column) {
                logMessage(column.name, '=' + result.getValue(column));
            });
        }

        logMessage('SALES ORDER SEARCH LENGTH ' + salesOrderSearchResults.length, 'SALES ORDER SEARCH LENGTH ' + salesOrderSearchResults.length);
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