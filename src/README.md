# Accor Tracking Decorator utility

<!-- toc -->

This standalone javascript library aims at helping webmasters of Accor Hotel Websites to effortlessly
add parameters required for correct tracking to any link to the Accor booking funnel.

## Installation 

The script should be included as an async script tag in every page.

**The bundle is available in the `dist` folder of this repository.**

``` html
<script async src="$path_to_js_files/decorator.js"></script>
```

## Configuration

The script requires a simple configuration, that should be specified as early as possible in your
`<head>` tag. The script exposes a global variable _AccorTrackingDecorator which is used as a 
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
    // testReferrer: 'http://www.google.co.uk/',
};                                   
```

## Parameters added by the decorator

- `merchantid` The merchant ID as configured
- `sourceid` Calculated dynamically based on the attribution rules
- `_ga` Google Analytics Linker parameter. Only if `config.handleGoogleAnalytics` is true
- `gacid` Google Analytics Linker client id. Only if `config.handleGoogleAnalytics` is true
- `utm_source` will be set to `hotelwebsite[$hotelID]` 
- `utm_medium` will be set to `accor regional websites`
- `utm_campaign`  will be set to `hotel website search`

## Attribution rules

The main element of complexity of this script is the calculation of the `sourceid` parameter based
on the attribution rules defined by Accor. The Source ID is stored in a cookie for 30 days. 

If the value stocked in the cookie starts with SID, the value of the cookie is used as source id.

Else, if the current page URL has utm parameters (and no value stocked in the cookie or its value 
does not start with SID), the script stocks a value that concatenates the parameters as follow: 

`UTM_$utm_source_$utm_medium_$utm_campaign`

where $utm_source, $utm_medium and $utm_campaign are the value of the corresponding url parameters.
That value is used as sourceid. 

If there is a `dclid` parameter in the page URL (and no utm, no value stocked in the cookie or its 
value does not start with SID), the script stocks a value `UTM_DCLID` and uses it as sourceid.

If there is a `gclid` parameter in the page URL (and no utm, no value stocked in the cookie or its 
value does not start with SID), the script stocks a value `UTM_GCLID` and uses it as sourceid.

If the cookie value starts with UTM, the script will just use its value as sourceID

If none of the above rules are matched:

If the referrer match one the top 10 search engine (and there is there is no sourceid and no utm parameter 
in both cookie and url parameters and no gclid or dclid parameters) (Google, bing,Yahoo, Baidu, Yandex.ru, 
DuckDuckGo, Ask.com, AOL.com, WolframAlpha, Internet Archive) or the top 13 social media network (Facebook, 
QQ, Instagram, QZONE, Tumblr, Twitter, Baidu, Sina Weibo, Snapchat, VK, Linkedin, Reddit) the sourceid will 
be respectively `SEO_$SEARCHENGINE` OR `SOCIAL_$SOCIALNAME` (where $SEARCHENGINE and $SOCIALNAME are the 
UPPERCASE name of the source)

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
    &utm_source=hotelwebsite%5B12345%5D
    &utm_campaign=hotel%20website%20search
    &utm_medium=accor%20regional%20websites
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
    utm_source: 'hotelwebsite[12345],
    utm_campaign: 'hotel website search',
    utm_medium: 'accor regional websites',
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

This script sets a single cookie `_AccorTrackingDecoratorData` which is used to store the sourceid.
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

## How to build

See [BUILD.md](BUILD.md)