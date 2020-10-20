<!-- !!!! DO NOT EDIT THIS FILE !!!! edit src/README.md INSTEAD and run node buildToc.js !!!! -->
# Jo&Joe Tracking Decorator utility

<!-- toc -->

- [Installation](#installation)
  * [Stable version](#stable-version)
- [Configuration](#configuration)
  * [Configuration flags](#configuration-flags)
- [Parameters added by default](#parameters-added-by-default)
- [Public methods](#public-methods)
  * [`_JoAndJoeTrackingDecorator.decorateUrl(url, extraParams)`](#_joandjoetrackingdecoratordecorateurlurl-extraparams)
  * [`_JoAndJoeTrackingDecorator.decorateObject(obj, extraParams)`](#_joandjoetrackingdecoratordecorateobjectobj-extraparams)
  * [`_JoAndJoeTrackingDecorator.decorateAll()`](#_joandjoetrackingdecoratordecorateall)
- [Cookies](#cookies)
- [Browser support](#browser-support)
- [Authors](#authors)
- [How to build](#how-to-build)

<!-- tocstop -->

This standalone javascript library aims to effortlessly add parameters required for correct tracking to any 
link to the Smart Booking Engine on the Jo&Joe Website.

## Installation 

The script should be included as an async script tag in every page.

The bundle is available in the `dist` folder of this repository.

**We recommend loading the script from the provided CDN in order to benefit from updates:**

### Stable version

``` html
<script async src="http://staticaws.fbwebprogram.com/joandjoe_tracking_decorator/decorator.js"></script>
```

## Configuration

The script requires a simple configuration, that should be specified as early as possible in your
`<head>` tag. The script exposes a global variable `_JoAndJoeTrackingDecorator` which is used as a 
namespace for configuration and methods of the script. Example: 

``` html
<!-- Decorator configuration.  This should be included in your head tag ASAP. -->
<script>
    // Create the variable if it doesn't exist
    var _JoAndJoeTrackingDecorator = _JoAndJoeTrackingDecorator || {};
    
    _JoAndJoeTrackingDecorator.config = {
        handleGoogleAnalytics: true,
        autoDecorate: true
    };
</script>
```

### Configuration flags

``` javascript
var _JoAndJoeTrackingDecorator = _JoAndJoeTrackingDecorator || {};      
_JoAndJoeTrackingDecorator.config = {
    /* Set to true if you want that all link tags in your document are inspected automatically 
       and the tracking parameters added to all the relevant ones. false by default
    */
    autoDecorate: true,
    
    /* Let the script take care of detecting Google Analytics Linker Param and Client ID
       This will result in the parameters _ga and gacid being added to the links.
       false by default 
     */
    handleGoogleAnalytics: true,
        
    /* Allow the script to log debug messages in console. false by default */
    debug: false,

    /* Use this parameter to specify which domain names are affected by the automamatic 
       decorator (see autoDecorate above.) It should be an array of Regular Exprexsions.
       Only if the hostname of a specific link matches any of the Regular Expressions 
       in this array, it will be decorated with the tracking parameters.        
     */
    // domainsToDecorate: [/secure-hotel-booking\.com$/, /all\.accor\.com$/],
    
    /*
       Pass a list of parameters to catch from the URL and save in the cookie, to propagate as is to SMART BE
    */
    
    //paramsToPropagate: [
    //     'utm_source',
    //     'utm_content',
    //     'utm_term',
    //     'utm_medium',
    //     'utm_campaign',
    //     'utm_sourceid',
    //     'sourceid',
    //     'merchantid',
    //     'sourcid'
    // ]
};                                   
```

## Parameters added by default


- utm_source
- utm_content
- utm_term
- utm_medium
- utm_campaign
- utm_sourceid
- sourceid
- merchantid
- sourcid
- `_ga` Google Analytics Linker parameter. Only if `config.handleGoogleAnalytics` is true
- `gacid` Google Analytics Linker client id. Only if `config.handleGoogleAnalytics` is true

Note: in the reference above, `config.***` refers to the decorator configuration values, as seen in the previous section.

## Public methods

### `_JoAndJoeTrackingDecorator.decorateUrl(url, extraParams)`

Adds the tracking parameters to the passed `url` (string). If the `extraParams` object is passed, those parameters
will be added to the URL too. `extraParams` allows overriding the parameters calculated by the script, too. This is 
useful if your page has links for multiple hotels.

**Example:**

``` javascript
var origUrl = 'https://www.secure-hotel-booking.com/smart/JO-JOE-Paris-Gentilly/2QKR/en/';
var decorated = _JoAndJoeTrackingDecorator.decorateUrl(origURL, {merchantid: 'MS-12345'});

/* decorated: 
https://www.secure-hotel-booking.com/smart/JO-JOE-Paris-Gentilly/2QKR/en/
    ?utm_source=hotelwebsite_12345
    &utm_campaign=hotel_website_search
    &utm_medium=accor_regional_websites
    &merchantid=MS-12345
    &sourceid=SID_testsid
    &gacid=849328042.1581445420
    &_ga=2.255469325.462718810.1582212053-849328042.1581445420
*/    
    
```

### `_JoAndJoeTrackingDecorator.decorateObject(obj, extraParams)`

Adds the tracking parameters to the passed `obj` (object). If the `extraParams` object is passed, those parameters
will be added to the object too. `extraParams` allows overriding the parameters calculated by the script, too. This is 
useful if your page has links for multiple hotels.

**Example:**

``` javascript
var origParams = {
    destination: '12345',
    goto: 'rech_resa',
};

var decorated = _JoAndJoeTrackingDecorator.decorateObject(origParams, {merchantid: 'MS-12345'});

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

### `_JoAndJoeTrackingDecorator.decorateAll()`

Adds the tracking parameters to all links on the page ( `<a href="">` ). 
This can be used if you have `autoDecorate` disabled or if you append new links to the document dynamically.

## Cookies

This script sets a single cookie `_JoAndJoeTrackingDecoratorData` which is used to store the sourceid.
This cookie can be used to store other arbitrary data if needed:

`_JoAndJoeTrackingDecorator.Store.set(key, value)`

and 

`_JoAndJoeTrackingDecorator.Store.get(key)`

To read the sourceid from the cookie: 

`_JoAndJoeTrackingDecorator.Store.get('sourceid')`

## Browser support

This script won't fully work on Internet Explorer 10 or lower. IE11 is supported.

## Authors

- Matteo Canever
- Andrea Baccega
- Gwennaël Grandmougin

## How to build

See [BUILD.md](BUILD.md)