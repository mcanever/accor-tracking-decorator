/*!
 * MIT License
 * Copyright 2022 D-EDGE
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
 */!function(e){var t={};function o(n){if(t[n])return t[n].exports;var r=t[n]={i:n,l:!1,exports:{}};return e[n].call(r.exports,r,r.exports,o),r.l=!0,r.exports}o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)o.d(n,r,function(t){return e[t]}.bind(null,r));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=11)}([function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(){this.debug=!1,this.logSuccessMessages=!0}return e.prototype.log=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];console.log(this.debug),this.debug&&console&&console.log&&console.log.apply(this,e)},e.prototype.success=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this.logSuccessMessages&&console&&console.log&&console.log.apply(this,e)},e.prototype.alwaysLog=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];console.log.apply(this,e)},e}();t.default=n,t.logger=new n},,function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=new Date;function r(e){var t=document.createElement("a");return t.href=e,t}t.dispatchEvent=function(e,t,o){var n;t=t||document,"function"==typeof Event?n=new Event(e):(n=document.createEvent("Event")).initEvent(e,!0,!0),void 0!==o&&(n.detail=o),t.dispatchEvent(n)},t.getUrlVars=function(e){var t={};return e.replace(/#.*?$/g,"").replace(/[?&]+([^=&]+)=([^&]*)/gi,(function(e,o,n){return t[o]=decodeURIComponent(n),e})),t},t.normalizeString=function(e){if("string"==typeof e){if(e.match(/^[a-zA-Z0-9-._$@'"()\[\]]{1,120}$/))return e;for(var t="ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž",o={},n=0;n<t.length;n++)o[t.charAt(n)]="AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz".charAt(n);return e=(e=(e=(e=e.replace(new RegExp("["+t+"]","g"),(function(e){return void 0!==o[e]?o[e]:e}))).replace(/[^a-zA-Z0-9-._$@'"()\[\] ]/g,"")).replace(/\s+/g,"-")).slice(0,120)}},t.parseUrlParts=r,t.onDomReady=function(e){"loading"!=document.readyState?e():document.addEventListener("DOMContentLoaded",e)},t.getElapsedMS=function(){return(new Date).getTime()-n.getTime()},t.areReferrerAndLocationEqual=function(e){try{var t="";if(/^https?:\/\//.test(e))t=r(e).origin;return t===location.origin}catch(e){return!1}}},function(e,t,o){"use strict";var n=this&&this.__assign||function(){return(n=Object.assign||function(e){for(var t,o=1,n=arguments.length;o<n;o++)for(var r in t=arguments[o])Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e}).apply(this,arguments)};Object.defineProperty(t,"__esModule",{value:!0});var r=o(0),a=o(2),i=function(){function e(e,t){void 0===e&&(e="_GA4CrossDomainParam"),void 0===t&&(t="accor_ga4_param_updated"),this.globalVariableName=e,this.onUpdateEventName=t,this._gl=!1,this.cookieCount=0,this.postDecorateCallback=function(e){return e}}return e.prototype.getCookieVersionAndClientID=function(e,t){var o=/^GA1\.\d+\.(.+)$/,n=/^GS1\.\d+\.(.+)$/;return o.test(t)?{version:3,clientID:o.exec(t)[1]}:n.test(t)?{version:4,clientID:n.exec(t)[1]}:(r.logger.log("Warning: the value for the cookie "+e+" does not match GA3 or GA4 format",t),{version:-1,clientID:t})},e.prototype.getGACookies=function(){for(var e=[],t=[],o=!1,n=0,r=document.cookie.split("; ");n<r.length;n++){var a=r[n].split("="),i=a[0],l=a[1];if(/(^_ga$)|^_ga_/.test(i)){var s=this.getCookieVersionAndClientID(i,l);o=o||4==s.version,s.version>=3&&e.push({name:i,rawValue:l,clientID:s.clientID,version:s.version})}}if(!o)return[];for(var c={},u=0,g=e;u<g.length;u++){var d=g[u];c[d.clientID]=d.name}return Object.keys(c).forEach((function(o){var n=c[o];t.push(e.filter((function(e){return e.name===n&&e.clientID===o}))[0])})),t},e.prototype.getGA4DecoratorParam=function(e,t){void 0===t&&(t=window);var o=this._gl,n=!1,r=this.getGACookies();if(r.length>this.cookieCount){this.cookieCount=r.length;for(var i={},l=0,s=r;l<s.length;l++){var c=s[l];i[c.name]=c.clientID}if(void 0!==t.google_tag_data&&void 0!==t.google_tag_data.glBridge&&void 0!==t.google_tag_data.glBridge.generate){var u=t.google_tag_data.glBridge.generate(i);this._gl=u,t[this.globalVariableName]=u}n=o!=this._gl}return!1!==e&&n&&a.dispatchEvent(e,document,this._gl),this._gl},e.prototype.detectGA4CrossDomainParam=function(e,t){var o=this;void 0===t&&(t=window),this._gl=!1,t[this.globalVariableName]=!1,this.cookieCount=0;var n=4e3,i=function(){n--;var a=o._gl;void 0!==t.google_tag_data&&void 0!==t.google_tag_data.glBridge&&void 0!==t.google_tag_data.glBridge.generate&&(o.getGA4DecoratorParam(o.onUpdateEventName,t),!1===a&&!1!==o._gl&&(n=200),a!=o._gl&&e(o._gl),n<=0&&(clearInterval(l),l=null,r.logger.log(!1===o._gl?"Search for GA4 _gl failed after 10 minutes":"Stopping successful search of _gl")))};i();var l=setInterval(i,150),s=this;setTimeout((function(){null!==l&&(r.logger.log("giving up GA4 params detection, HEADS UP! You may need to make sure there is analytics.js loaded on the page"),clearInterval(l),a.dispatchEvent(s.onUpdateEventName),e(s._gl))}),6e5)},e.prototype.decorateURL=function(e,t){void 0===t&&(t={});var o=a.parseUrlParts(e);if(!o.hostname||""===o.hostname)return e;var n=a.getUrlVars(e);n=this.decorateObject(n,t);var r=[];for(var i in n)n.hasOwnProperty(i)&&!1!==n[i]&&null!==n[i]&&"string"==typeof n[i]&&r.push(encodeURIComponent(i)+"="+encodeURIComponent(n[i]));if(r.length>0){var l=/^\//.test(o.pathname)?o.pathname:"/"+o.pathname;e=o.protocol+"//"+o.hostname+l+"?"+r.join("&")+(o.hash||"")}return e},e.prototype.decorateObject=function(e,t){if(void 0===t&&(t={}),"object"!=typeof e||null===e)return e;var o=n({_gl:this._gl},t);for(var r in o)o.hasOwnProperty(r)&&(e[r]=o[r]);return"function"==typeof this.postDecorateCallback?this.postDecorateCallback(e):e},e}();t.GA4CrossDomain=i},,,,,,,,function(e,t,o){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=o(0),r=o(3);void 0===window._GA4CrossDomain&&(n.logger.debug=void 0!==window._GA4CrossDomain_Debug&&window._GA4CrossDomain_Debug,window._GA4CrossDomain=new r.GA4CrossDomain,window._GA4CrossDomain.detectGA4CrossDomainParam((function(e){"function"==typeof window._GA4CrossDomain_ReadyCallback&&window._GA4CrossDomain_ReadyCallback(e)}),window))}]);