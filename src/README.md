# Accor Tracking Decorator utility

<!-- toc -->

This standalone javascript library aims at helping webmasters of Accor Hotel Websites to effortlessly
add parameters required for correct tracking to any link to the Accor booking funnel.

## Installation 

The script should be included as an async script tag in every page.

The bundle is available in the `dist` folder of this repository.

**We recommend loading the script from the provided CDN in order to benefit from updates:**

### Stable version

``` html
<script async src="//staticaws.fbwebprogram.com/accor_tracking_decorator/decorator.js"></script>
```

### Development version

``` html
<script async src="//staticaws.fbwebprogram.com/accor_tracking_decorator_dev/decorator.js"></script>
```

## Configuration

The script requires a simple configuration, that should be specified as early as possible in your
`<head>` tag. The script exposes a global variable `_AccorTrackingDecorator` which is used as a 
namespace for configuration and methods of the script. Example: 

``` html
<!-- Decorator configuration.  This should be included in your head tag ASAP. -->
<script>
    // Create the variable if it doesn't exist
    var _AccorTrackingDecorator = _AccorTrackingDecorator || {};
    
    _AccorTrackingDecorator.config = {
        merchantid: 'MS-12345',
        hotelID: '12345',
        handleGoogleAnalytics: true,
        autoDecorate: true
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
       This will result in the parameters _ga and gacid being added to the links.
       false by default 
     */
    handleGoogleAnalytics: true,
    
    /* Set to true if the decorator is installed on an Accor Brand Site 
       (E.G. Official portal for all Sofitel Hotels) 
    */
    isBrandSite: false,
    
    /* Set to the brand name (example: 'sofitel'). Always specify if hotel is part of a brand  */
    brandName: '',
      
    /* Allow the script to log debug messages in console. false by default */
    debug: false,
    
    /* Disable logging success messages in console. false by default */
    dontLogSuccessMessages: false

    /* Use this parameter to specify which domain names are affected by the automamatic 
       decorator (see autoDecorate above.) It should be an array of Regular Exprexsions.
       Only if the hostname of a specific link matches any of the Regular Expressions 
       in this array, it will be decorated with the tracking parameters.        
     */
    // domainsToDecorate: [/^all\.accor\.com$/, /accorhotels.com$/],
    
    /* OPTIONAL!
       specify this callback if you want to further modify each link / object before it is returned by the
       decorator functions.
       The function must have this signature: 
       ( object ) => object 
       and should always return the modified original object.
       The example below will add the parameter web_agency with value d-edge to all decorated links/objects.
    */
    postDecorateCallback: function (params) {
        if (typeof params == 'object') {
            params.web_agency = 'd-edge';
        }
        return params;
    }
    
    /* TESTING ONLY Use this parameter only if you need to emulate a specific referrer and test the results. 
       You can pass the full expected URL of the referrer you intend to test
    */
    // testReferrer: 'http://www.google.co.uk/',
};                                   
```

## Parameters added by the decorator

- `merchantid` The merchant ID as configured
- `sourceid` Calculated dynamically based on the attribution rules
- `_ga` Google Analytics Linker parameter. Only if `config.handleGoogleAnalytics` is true
- `gacid` Google Analytics Linker client id. Only if `config.handleGoogleAnalytics` is true
- `utm_source` will be set to `hotelwebsite_$hotelID` if `config.isBrandSite` is false
- `utm_medium` will be set to `accor_regional_websites` if `config.isBrandSite` is false
- `utm_campaign`  will be set to `hotel_website_search` if `config.isBrandSite` is false

Note: in the reference above, `config.***` refers to the decorator configuration values, as seen in the previous section.

## Public methods

### `_AccorTrackingDecorator.decorateUrl(url, extraParams)`

Adds the tracking parameters to the passed `url` (string). If the `extraParams` object is passed, those parameters
will be added to the URL too. `extraParams` allows overriding the parameters calculated by the script, too. This is 
useful if your page has links for multiple hotels.

**Example:**

``` javascript
var origUrl = 'https://all.accor.com/lien_externe.svlt?destination=12345&goto=rech_resa';
var decorated = _AccorTrackingDecorator.decorateUrl(origURL, {merchantid: 'MS-12345'});

/* decorated: 
https://all.accor.com/lien_externe.svlt?destination=12345&goto=rech_resa
    &utm_source=hotelwebsite_12345
    &utm_campaign=hotel_website_search
    &utm_medium=accor_regional_websites
    &merchantid=MS-12345
    &sourceid=SID_testsid
    &gacid=849328042.1581445420
    &_ga=2.255469325.462718810.1582212053-849328042.1581445420
*/    
    
```

### `_AccorTrackingDecorator.decorateObject(obj, extraParams)`

Adds the tracking parameters to the passed `obj` (object). If the `extraParams` object is passed, those parameters
will be added to the object too. `extraParams` allows overriding the parameters calculated by the script, too. This is 
useful if your page has links for multiple hotels.

**Example:**

``` javascript
var origParams = {
    destination: '12345',
    goto: 'rech_resa',
};

var decorated = _AccorTrackingDecorator.decorateObject(origParams, {merchantid: 'MS-12345'});

/* decorated: 

{
    destination: '12345',
    goto: 'rech_resa',
    utm_source: 'hotelwebsite_12345,
    utm_campaign: 'hotel_website_search',
    utm_medium: 'accor_regional_websites',
    merchantid: 'MS-12345',
    sourceid: 'SID_testsid',
    gacid: '849328042.1581445420',
    _ga: '2.255469325.462718810.1582212053-849328042.1581445420'
} 
 
*/  
```

### `_AccorTrackingDecorator.decorateAll()`

Adds the tracking parameters to all links on the page ( `<a href="">` ). 
This can be used if you have `autoDecorate` disabled or if you append new links to the document dynamically.

## Cookies

This script sets a single cookie `_AccorTrackingDecoratorData` which is used to store the attribution data (sourceid and merchantid).
This cookie can be used to store other arbitrary data if needed:

`_AccorTrackingDecorator.Store.set(key, value)`

and 

`_AccorTrackingDecorator.Store.get(key)`

To read the sourceid from the cookie: 

`_AccorTrackingDecorator.Store.get('sourceid')`

## Browser support

This script won't fully work on Internet Explorer 10 or lower. IE11 is supported.

## Authors

- Matteo Canever
- Andrea Baccega
- Gwennaël Grandmougin

## How to build

See [BUILD.md](BUILD.md)