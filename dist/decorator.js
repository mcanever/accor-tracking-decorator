/*!
 * MIT License
 * Copyright 2020 D-EDGE
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */!function(e){var t={};function r(o){if(t[o])return t[o].exports;var n=t[o]={i:o,l:!1,exports:{}};return e[o].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=e,r.c=t,r.d=function(e,t,o){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(r.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)r.d(o,n,function(t){return e[t]}.bind(null,n));return o},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=3)}([function(e,t,r){"use strict";var o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0});var n=o(r(6));t.utils={getUrlVars:function(e){var t={};e.replace(/#.*?$/g,"").replace(/[?&]+([^=&]+)=([^&]*)/gi,(function(e,r,o){return t[r]=o,e}));return t},Cookies:n.default,normalizeString:function(e){if("string"==typeof e){if(e.match(/^[a-zA-Z0-9-._$@'"()\[\]]{1,120}$/))return e;for(var t="ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž",r={},o=0;o<t.length;o++)r[t.charAt(o)]="AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz".charAt(o);return e=(e=(e=(e=e.replace(new RegExp("["+t+"]","g"),(function(e){return void 0!==r[e]?r[e]:e}))).replace(/[^a-zA-Z0-9-._$@'"()\[\] ]/g,"")).replace(/\s+/g,"-")).slice(0,120)}},parseUrlParts:function(e){var t=document.createElement("a");return t.href=e,t},onDomReady:function(e){"loading"!=document.readyState?e():document.addEventListener("DOMContentLoaded",e)},dispatchEvent:function(e,t){var r;t=t||document,"function"==typeof Event?r=new Event(e):(r=document.createEvent("Event")).initEvent(e,!0,!0),t.dispatchEvent(r)},areReferrerAndLocationEqual:function(e){try{var r="";if(/^https?:\/\//.test(e))r=t.utils.parseUrlParts(e).origin;return console.log(e,r,location.origin),r===location.origin}catch(e){return!1}}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(){this.enabled=!1}return e.prototype.log=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this.enabled&&console.log.apply(this,e)},e.prototype.alwaysLog=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];console.log.apply(this,e)},e}();t.default=o,t.logger=new o},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(1),n=r(0),i=function(){function e(){}return e.encode=function(e){return"function"==typeof btoa?btoa(e):e},e.decode=function(e){return"function"==typeof atob?atob(e):e},e.getDecodedCookieValue=function(){var t=n.utils.Cookies.get(e.cookie_name);if(t)try{var r=JSON.parse(e.decode(t));return"object"==typeof r?r:{}}catch(r){o.logger.log("Error parsing cookie",e.cookie_name,t,r)}return{}},e.saveToCookie=function(t){var r=e.encode(JSON.stringify(t));n.utils.Cookies.set(e.cookie_name,r,{expires:e.cookie_duration}),o.logger.log("Save to cookie",e.cookie_name,t)},e.get=function(t){var r=e.getDecodedCookieValue();return void 0!==r[t]?r[t]:null},e.set=function(t,r){var o=e.getDecodedCookieValue();o[t]=r,e.saveToCookie(o)},e.delete=function(t){var r=e.getDecodedCookieValue();delete r[t],e.saveToCookie(r)},e.clear=function(){e.saveToCookie({})},e.cookie_name="_AccorTrackingDecoratorData",e.cookie_duration=30,e}();t.Store=i},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(4),n=r(8),i=r(2),a=r(0),c=new n.Namespace,s=new o.Decorator(c);c.set("decorateUrl",(function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return s.decorateURL.apply(s,e)})),c.set("decorateObject",(function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return s.decorateObject.apply(s,e)})),c.set("decorateAll",(function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return s.decorateAll.apply(s,e)})),c.set("decorator",s),c.set("Store",i.Store),c.set("utils",a.utils),s.config.autoDecorate&&s.autoDecorate()},function(e,t,r){"use strict";var o=this&&this.__assign||function(){return(o=Object.assign||function(e){for(var t,r=1,o=arguments.length;r<o;r++)for(var n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)};Object.defineProperty(t,"__esModule",{value:!0});var n=r(5),i=r(1),a=r(7),c=r(0),s=r(2),u=function(){function e(e){this.namespace=e,this.initConfig(),i.logger.log("AccorTrackingDecorator config",this.config),this.initParameters()}return e.prototype.decorateURL=function(e,t){void 0===t&&(t={});var r=c.utils.parseUrlParts(e);if(!r.hostname||""===r.hostname)return e;var o=c.utils.getUrlVars(e);o=this.decorateObject(o,t);var n=[];for(var i in o)o.hasOwnProperty(i)&&!1!==o[i]&&null!==o[i]&&"string"==typeof o[i]&&n.push(encodeURIComponent(i)+"="+encodeURIComponent(o[i]));if(n.length>0){var a=/^\//.test(r.pathname)?r.pathname:"/"+r.pathname;e=r.protocol+"//"+r.hostname+a+"?"+n.join("&")+(r.hash||"")}return e},e.prototype.decorateObject=function(e,t){if(void 0===t&&(t={}),"object"!=typeof e||null===e)return e;var r=o(o({},this.trackingParams),t);for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n]);return e},e.prototype.autoDecorate=function(){var e=this,t=!1;document.addEventListener("accor_tracking_params_available",(function(){t||(t=!0,setTimeout((function(){return e.decorateAll()}),300))}))},e.prototype.decorateAll=function(){i.logger.log("decorateAll");for(var e=document.getElementsByTagName("a"),t=function(t){var o=e[t],n=o.getAttribute("href");if(null!==n){var a=c.utils.parseUrlParts(n).hostname.toLowerCase();if(r.config.domainsToDecorate.map((function(e){return e.test(a)})).some((function(e){return e}))){var s=r.decorateURL(n);i.logger.log("Autodecorate",n,s),o.setAttribute("href",s)}}},r=this,o=0;o<e.length;o++)t(o)},e.prototype.initConfig=function(){if(this.config={merchantid:this.namespace.getConfig("merchantid")||"",hotelID:this.namespace.getConfig("hotelID")||"",autoDecorate:!!this.namespace.getConfig("autoDecorate"),debug:!!this.namespace.getConfig("debug"),handleGoogleAnalytics:!1!==this.namespace.getConfig("handleGoogleAnalytics"),testReferrer:this.namespace.getConfig("testReferrer")||"",domainsToDecorate:this.namespace.getConfig("domainsToDecorate")||[/^all\.accor\.com$/,/accorhotels.com$/]},i.logger.enabled=this.config.debug,this.config.hotelID=this.config.hotelID.toUpperCase(),""===this.config.hotelID&&""!==this.config.merchantid){var e=this.config.merchantid.match(/^MS-([A-Z0-9]+)$/);e&&2==e.length&&(this.config.hotelID=e[1],i.logger.log("hotelID was empty, deriving it from merchantid: ",this.config.hotelID))}""===this.config.merchantid&&(i.logger.log("config.merchantid is empty!"),""!==this.config.hotelID&&(this.config.merchantid="MS-"+this.config.hotelID,i.logger.log("Using hotelID to set merchantid",this.config.merchantid)))},e.prototype.initParameters=function(){var e=this;this.trackingParams={utm_source:"hotelwebsite["+this.config.hotelID+"]",utm_campaign:"hotel website search",utm_medium:"accor regional websites",merchantid:this.config.merchantid},n.detectGAParameters((function(t){e.config.handleGoogleAnalytics&&(e.trackingParams.gacid=t.gacid,e.trackingParams._ga=t._ga),i.logger.log("AccorTrackingDecorator params",e.trackingParams)}),this.namespace.source);var t=""!==this.config.testReferrer?this.config.testReferrer:document.referrer,r=a.Attribution.detectAttributonFromReferrer(t);r.merchantid=r.merchantid||this.trackingParams.merchantid;var o={sourceid:s.Store.get("sourceid"),merchantid:s.Store.get("merchantid")};i.logger.log("areReferrerAndLocationEqual",c.utils.areReferrerAndLocationEqual(t)),a.Attribution.getScore(r)>=a.Attribution.getScore(o)&&!c.utils.areReferrerAndLocationEqual(t)&&(s.Store.set("sourceid",r.sourceid),s.Store.set("merchantid",r.merchantid)),this.trackingParams.sourceid=s.Store.get("sourceid"),this.trackingParams.merchantid=s.Store.get("merchantid"),this.config.handleGoogleAnalytics||c.utils.dispatchEvent("accor_tracking_params_available")},e}();t.Decorator=u},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(1),n=r(0);t.detectGAParameters=function(e,t){void 0===t&&(t=window),t.AccorBooking_GUA_ClientId=!1,t.AccorBooking_GUA_linkerParam=!1;var r={gacid:!1,_ga:!1},i=setInterval((function(){void 0!==t.ga&&t.ga((function(){var a=t.ga.getAll();if(void 0!==a[0]){clearInterval(i),i=null;var c=a[0].get("clientId");t.AccorBooking_GUA_ClientId=c,r.gacid=c,o.logger.log("Detected clientID (gacid): "+c);var s=a[0].get("linkerParam");if(s){var u=s.split("&"),l=(s=u[0]).split("=");2==l.length&&(s=l[1],t.AccorBooking_GUA_linkerParam=s,r._ga=s,o.logger.log("Detected linker param (_ga): "+s))}}n.utils.dispatchEvent("accor_tracking_params_available"),e(r)}))}),50);setTimeout((function(){null!=i&&(clearInterval(i),n.utils.dispatchEvent("accor_tracking_params_available"),e(r))}),1e4)}},function(e,t,r){var o,n;
/*!
 * JavaScript Cookie v2.2.1
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */!function(i){if(void 0===(n="function"==typeof(o=i)?o.call(t,r,t,e):o)||(e.exports=n),!0,e.exports=i(),!!0){var a=window.Cookies,c=window.Cookies=i();c.noConflict=function(){return window.Cookies=a,c}}}((function(){function e(){for(var e=0,t={};e<arguments.length;e++){var r=arguments[e];for(var o in r)t[o]=r[o]}return t}function t(e){return e.replace(/(%[0-9A-Z]{2})+/g,decodeURIComponent)}return function r(o){function n(){}function i(t,r,i){if("undefined"!=typeof document){"number"==typeof(i=e({path:"/"},n.defaults,i)).expires&&(i.expires=new Date(1*new Date+864e5*i.expires)),i.expires=i.expires?i.expires.toUTCString():"";try{var a=JSON.stringify(r);/^[\{\[]/.test(a)&&(r=a)}catch(e){}r=o.write?o.write(r,t):encodeURIComponent(String(r)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),t=encodeURIComponent(String(t)).replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent).replace(/[\(\)]/g,escape);var c="";for(var s in i)i[s]&&(c+="; "+s,!0!==i[s]&&(c+="="+i[s].split(";")[0]));return document.cookie=t+"="+r+c}}function a(e,r){if("undefined"!=typeof document){for(var n={},i=document.cookie?document.cookie.split("; "):[],a=0;a<i.length;a++){var c=i[a].split("="),s=c.slice(1).join("=");r||'"'!==s.charAt(0)||(s=s.slice(1,-1));try{var u=t(c[0]);if(s=(o.read||o)(s,u)||t(s),r)try{s=JSON.parse(s)}catch(e){}if(n[u]=s,e===u)break}catch(e){}}return e?n[e]:n}}return n.set=i,n.get=function(e){return a(e,!1)},n.getJSON=function(e){return a(e,!0)},n.remove=function(t,r){i(t,"",e(r,{expires:-1}))},n.defaults={},n.withConverter=r,n}((function(){}))}))},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0),n=r(1),i=function(){function e(){}return e.getScore=function(e){var t=!!e.sourceid&&!!e.merchantid;return t&&/^(ppc-|dis-|sop-)/.test(e.merchantid)?3:t||/^(ml-)/.test(e.sourceid)?2:1},e.detectAttributonFromReferrer=function(e){var t,r=o.utils.getUrlVars(this.getCurrentURL()),i=r.sourceid||null,a=r.merchantid||null,c=!!i&&!!a,s=!!r.utm_source&&r.utm_source||r.dclid&&"dclid"||r.gclid&&"gclid"||null,u=this.detectReferrer(e),l="Direct_Access";return c?(l=i,t=a,n.logger.log("sourceid from sourceid url parameter",l),n.logger.log("merchantid from merchantid url parameter",t)):s?(l="UTM_"+s,n.logger.log("sourceid from utm|dclid|gclid in url",l)):null!==u&&(l=u.category+"_"+u.name,n.logger.log("sourceid from referrer",l)),{sourceid:l=o.utils.normalizeString(l),merchantid:t=!!t&&o.utils.normalizeString(t)}},e.detectReferrer=function(t){if(""===t||0===t.toLowerCase().indexOf(e.getOrigin()))return null;var r={SOCIAL:{FACEBOOK:/^https?:\/\/(www\.)?facebook\.com\/.*$/i,QZONE:/^https?:\/\/[a-z0-9.]+qzone\.qq\.com(\/.*)?$/i,QQ:/^https?:\/\/([a-z]+\.)?qq\.com(\/.*)?$/i,INSTAGRAM:/^https?:\/\/(www\.)?instagram\.com\/.*$/i,TUMBLR:/^https?:\/\/(www\.|[a-zA-Z0-9-_\.]+)?tumblr\.com\/.*$/i,TWITTER:/^https?:\/\/(www\.)?twitter\.com\/.*$/i,BAIDU:/^https?:\/\/(www\.)?tieba\.baidu\.com\/.*$/i,WEIBO:/^https?:\/\/(www\.)?weibo\.com\/.*$/i,SNAPCHAT:/^https?:\/\/(www\.)?snapchat\.com\/.*$/i,VKONTAKTE:/^https?:\/\/(www\.)?vk\.com\/.*$/i,PINTEREST:/^https?:\/\/(www\.)?pinterest\.com\/.*$/i,LINKEDIN:/^https?:\/\/(www\.)?linkedin\.com\/.*$/i,REDDIT:/^https?:\/\/(www\.)?reddit\.com\/.*$/i},SEO:{GOOGLE:/^https?:\/\/(www\.)?google\.[a-z.]+(\/.*)?$/i,BING:/^https?:\/\/(www\.)?bing\.com\/.*$/i,YAHOO:/^https?:\/\/([a-z.]+)?yahoo\.(com|co.jp)(\/.*)?$/i,BAIDU:/^https?:\/\/(www\.)?baidu\.com\/.*$/i,YANDEX:/^https?:\/\/(www\.)?yandex\.(com|ru)(\/.*)?$/i,DUCKDUCKGO:/^https?:\/\/(www\.)?duckduckgo\.com(\/.*)?$/i,ASK:/^https?:\/\/([a-z]+\.)?ask\.com(\/.*)?$/i,AOL:/^https?:\/\/(search\.aol|aol|www\.aol|www\.aolsearch)\.com(\/.*)?$/i,WOLFRAMALPHA:/^https?:\/\/(www\.)?wolframalpha\.com(\/.*)?$/i,ARCHIVE:/^https?:\/\/([a-z]+\.)?archive\.org(\/.*)?$/i}};for(var o in r)if(r.hasOwnProperty(o)){var i=r[o];for(var a in i){if(i.hasOwnProperty(a))if(i[a].test(t))return n.logger.log("Detected known referrer",o,a),{category:o,name:a}}}return null},e.getOrigin=function(){return document.location.origin.toLowerCase()},e.getCurrentURL=function(){return document.location.href},e}();t.Attribution=i},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e){void 0===e&&(e=window),this.source=e,void 0===this.source._AccorTrackingDecorator&&(this.source._AccorTrackingDecorator={})}return e.prototype.get=function(e){return this.source._AccorTrackingDecorator[e]},e.prototype.set=function(e,t){this.source._AccorTrackingDecorator[e]=t},e.prototype.getConfig=function(e){var t=this.get("config");return void 0!==t&&void 0!==t[e]&&t[e]},e}();t.Namespace=o}]);