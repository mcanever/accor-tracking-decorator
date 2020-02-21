# Accor Tracking Decorator utility

<!-- toc -->

This standalone javascript library aims at helping webmasters of Accor Hotel Websites to effortlessly
add parameters required for correct tracking to any link to the Accor booking funnel.

## Installation 

The script can be included as an async tag in every page

``` html
<script async src="js/decorator.js"></script>
```

## Configuration

The script requires a simple configuration, that should be specified as early as possible in your
`<head>` tag. The script exposes a global variable _AccorTrackingDecorator which is used as a 
namespace for configuration and methods of the script. 

``` html
<!-- Decorator configuration.  This should be included in your head tag ASAP. -->
<script>
    // Create the variable if it doesn't exist
    var _AccorTrackingDecorator = _AccorTrackingDecorator || {};
    
    _AccorTrackingDecorator.config = {
        merchantid: 'MS-12345',
        hotelID: '12345',
        autoDecorate: true,
    };
</script>
```

### Configuration flags

``` javascript
var _AccorTrackingDecorator = _AccorTrackingDecorator || {};      
_AccorTrackingDecorator.config = {
    /* The Hotel ID for the current page. This is not mandatory and is '' by default */
    hotelID: 'A0123', 

    /* MANDATORY. This is the "Merchant ID" and by convention it should be MS-$HotelID */
    merchantid: 'MS-A0123',

    /* Set to true if you want that all link tags in your document are inspected automatically 
       and the tracking parameters added to all the relevant ones. false by default
    */
    autoDecorate: true,
    
    /* Let the script take care of detecting Google Analytics Linker Param and Client ID
       This will result in the parameters _ga and gacid being added to the links
     */
    handleGoogleAnalytics: true,
      
    /* Allow the script to log debug messages in console. false by default */
    debug: false,

    /* Use this parameter to specify which domain names are affected by the automamatic 
       decorator (see autoDecorate above.) It should be an array of Regular Exprexsions.
       Only if the hostname of a specific link matches any of the Regular Expressions 
       in this array, it will be decorated with the tracking parameters.        
     */
    // domainsToDecorate: [/^all\.accor\.com$/, /accorhotels.com$/],
    
    /* TESTING ONLY Use this parameter only if you need to emulate a specific referrer and test the results. 
       You can pass the full expected URL of the referrer you intend to test
    */
    // testReferrer: null,
};                                   
```

## Browser support

This script won't fully work on Internet Explorer 10 or lower. IE11 is supported.