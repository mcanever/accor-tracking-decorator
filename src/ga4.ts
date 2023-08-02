import { logger } from "./logger";
import { dispatchEvent, getUrlVars, parseUrlParts } from "./dom";


declare global {
    interface Window {
        google_tag_data: any
    }
}

type SingleGACookie = {
    version: number,
    rawValue: string
    name: string
    clientID: string
}

/**
 * MANUAL _gl GENERATION CODE
 */

let baseConversionChars: string;
let charToIndex: {[key:string]: number};
let CRCTableCache: number[];

/**
 * Returns a static list of characters (an alphabet) to be used in encoding.
 * @returns string
 */
function getBaseConversionChars(): string  {
    let charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    charList += charList.toLowerCase() + "0123456789-_";
    return charList + "."
}

/**
 * Generates an associative array returning the index of each character in the
 * baseConversionChars string variable
 * @returns {[key: string]: number}
 */
function getCharToIndex(): {[key: string]: number} {
    const arr = baseConversionChars;
    let map: {[key: string]: number} = {};

    for (let i = 0; i < arr.length; ++i) {
        map[arr[i]] = i;
    }
    return map;
}

/**
 * Generates a hash of a string, seeded with a fingerprint
 * It looks like a CRC32 implementation.
 * @param str The string to encode
 * @param minutes Obscure: minutes to subtract from current timestamp in the fingerprint
 * @returns {string}
 */
function hashStr(str:string, minutes?:number): string {
    /**
     * Prepend fingerprint data to the string to hash
     */
    const fullString = [
        navigator.userAgent,
        (new Date).getTimezoneOffset(),
        (navigator as any).userLanguage || navigator.language,
        Math.floor((new Date(Date.now())).getTime() / 60 / 1E3) - (void 0 === minutes ? 0 : minutes),
        str
    ].join("*");

    let CRCTable: number[];
    if (! (CRCTable = CRCTableCache)) {
        CRCTable = Array(256);
        for (let idx = 0; 256 > idx; idx++) {
            let val=idx;
            for (let bit = 0; 8 > bit; bit++) {
                val = val & 1 ? val >>> 1 ^ 3988292384 : val >>> 1;
            }
            CRCTable[idx] = val;
        }
    }
    CRCTableCache = CRCTable;
    let crc = 4294967295;
    for (let idx = 0; idx < fullString.length; idx++) {
        crc = crc >>> 8 ^ CRCTableCache[(crc ^ fullString.charCodeAt(idx)) & 255];
    }
    return ((crc ^ -1) >>> 0).toString(36);
}

/**
 * Generates the _gl parameter.
 * Takes as first parameter an associative array names to ClientIDs.
 *
 * @param cookieMap Object.
 *        EG {"_ga_B56CM9C47V":"1690968794.3.1.1690968795.59.0.0","_ga":"236872392.1690905690"}
 * @returns {string}
 */
function glGenerate(cookieMap: { [key: string]: string }) {
    let cookieData = [];
    let cookieName: string;

    for (cookieName in cookieMap) if (cookieMap.hasOwnProperty(cookieName)) {
        var clientID = cookieMap[cookieName];
        if (void 0 !== clientID && clientID === clientID && null !== clientID && "[object Object]" !== clientID.toString()) {
            cookieData.push(cookieName);
            const cookieDataArr = cookieData;
            const pushFn = cookieDataArr.push;
            clientID = String(clientID);
            baseConversionChars = baseConversionChars || getBaseConversionChars();
            charToIndex = charToIndex || getCharToIndex();

            // Encode the current ClientID using the alphabet. Looks like a base64URL encoding
            // - Splits the string into chunks of 3 bytes ( each 0-255 )
            // - Splits the bits of the 3 characters into 4 7-bit chunks ( each 0-63 )
            // - Converts the bits into characters using the base conversion alphabet and pushes them to an array
            // - Converts the array
            const hashArr = [];
            for (let idx = 0; idx < clientID.length; idx += 3) {
                const has1MoreByte = idx + 1 < clientID.length;
                const has2MoreBytes = idx + 2 < clientID.length;
                let b1 = clientID.charCodeAt(idx);
                let b2 = has1MoreByte ? clientID.charCodeAt(idx + 1) : 0;
                let b3 = has2MoreBytes ? clientID.charCodeAt(idx + 2) : 0;
                const b0 = b1 >> 2;
                b1 = (b1 & 3) << 4 | b2 >> 4;
                b2 = (b2 & 15) << 2 | b3 >> 6;
                b3 &= 63;
                // has2MoreBytes || (b3 = 64, has1MoreByte || (b2 = 64));
                if (!has2MoreBytes) {
                    b3=64;
                    if (!has1MoreByte) {
                        b2 = 64;
                    }
                }
                hashArr.push(baseConversionChars[b0], baseConversionChars[b1], baseConversionChars[b2], baseConversionChars[b3]);
            }
            pushFn.call(cookieDataArr, hashArr.join(""));
        }
    }
    const cookieDataStr = cookieData.join("*");
    return ["1", hashStr(cookieDataStr), cookieDataStr].join("*")
}


export class GA4CrossDomain {
    public _gl: string | false = false;
    public cookieCount = 0;
    public postDecorateCallback: (obj: any) => any;

    constructor(public globalVariableName = '_GA4CrossDomainParam', public onUpdateEventName = 'accor_ga4_param_updated') {
        this.postDecorateCallback = (obj) => obj;
    }

    public getCookieVersionAndClientID(name:string, rawValue: string): { version: number,  clientID: string} {
        // GUA cookies seems to look like GA1.X.$CLIENTID where X is a digit (but let's assume there can be more)
        const ga3RE = /^GA1\.\d+\.(.+)$/;
        const ga4RE = /^GS1\.\d+\.(.+)$/;
        if (ga3RE.test(rawValue)) {
            const matches = ga3RE.exec(rawValue);
            return { version: 3, clientID: matches[1] };
        } else if (ga4RE.test(rawValue)) {
            const matches = ga4RE.exec(rawValue);
            return { version: 4, clientID: matches[1] };
        } else {
            logger.log(`Warning: the value for the cookie ${name} does not match GA3 or GA4 format`, rawValue);
            return { version: -1, clientID: rawValue };
        }
    }

    public getGACookies():SingleGACookie[] {
        const allCookies:SingleGACookie[] = [];
        const cleanCookies:SingleGACookie[] = [];
        let atLeastOneGA4 = false;
        // Iterate all cookies in this domain
        const pairs = document.cookie.split('; ');
        for (let pair of pairs) {
            const parts = pair.split('=');
            const name = parts[0];
            const rawValue = parts[1];
            // Google Analytics cookies start with '_ga'.
            // This is a wild assumption but well, we don't want to configure a list manually. XD
            if (/(^_ga$)|^_ga_/.test(name)) {
                const info = this.getCookieVersionAndClientID(name, rawValue);
                atLeastOneGA4 = atLeastOneGA4 || info.version == 4;
                if (info.version >= 3) {
                    allCookies.push({ name, rawValue, clientID: info.clientID, version: info.version});
                }
            }
        }

        if (!atLeastOneGA4) {
            return [];
        }

        // Deduplicate based on the client ID, with a matrix
        // This is not efficient, but we assume a very small array ( 10 elements max in d-edge environment)
        let matrix: {[key:string] : string} = {};

        for (let cookie of allCookies) {
            // If a clientID already exists, its corresponding key will be overwritten by the later value
            matrix[cookie.clientID] = cookie.name;
        }
        Object.keys(matrix).forEach((clientID) => {
            const name = matrix[clientID];
            cleanCookies.push(allCookies.filter((cookie: SingleGACookie) => {
                return cookie.name === name && cookie.clientID === clientID;
            })[0]);
        });

        return cleanCookies;
    }

    public getFilteredGACookies(source = window) {
        const cookies = this.getGACookies();
        if (cookies.length > 0) {
            let cookieData:{[key: string]: string} = {};
            for (let cookie of cookies) {
                cookieData[cookie.name] = cookie.clientID;
            }

            // ! EXPERIMENTAL STUFF AHEAD !
            // TODO MAYBE MAKE THIS CONFIGURABLE AS IT MAY NOT BE RELIABLE
            // Try to use only the cookies related to the actual GA4 trackers on the page
            // And not those that may have been created somewhere else. This is for better generation
            // of the _gl parameters in setups with subdomains of the same domain where cookies from different
            // subdomains may be present, while not matching the actual trackers on the page
            try {
                let filteredCookieData: { [key: string]: string } = {};
                let ga4IDsOnThisPage: string[];
                let detectionMethod = '';

                // WARNING UNDOCUMENTED STUFF!
                // The line below is based on reverse engineering of the public variable google_tag_data.td
                // We noticed it contains an associative array of all the GA4 tags actually
                // loaded on the page, where keys are measurement IDs like G-AB12CDEFGHI
                if (typeof source.google_tag_data !== 'undefined' &&
                    typeof source.google_tag_data.td !== 'undefined') {
                    detectionMethod = 'google_tag_data.td';
                    ga4IDsOnThisPage = Object.keys(source.google_tag_data.td);

                    if (Array.isArray(ga4IDsOnThisPage) && ga4IDsOnThisPage.length > 0) {
                        // Remove the initial G-
                        ga4IDsOnThisPage = ga4IDsOnThisPage.map((id) => id.replace(/^G-/, ''));
                    }
                } else {
                    // If google_tag_data.td try to detect GA4 trackers from the scripts present on the page
                    ga4IDsOnThisPage = [];
                    detectionMethod = 'scripts';
                    const allScripts = document.getElementsByTagName('script');
                    for (let i = 0; i < allScripts.length; i++) {
                        const src = allScripts[i].getAttribute('src');
                        if (src) {
                            const parts = src.split('?');
                            if (parts.length > 1) {
                                const hostPart = parts[0];
                                const qsPart = parts[1];
                                const domainRe = /googletagmanager\.com|google-analytycs/;
                                const qsRe = /(\?|&|&amp;)?id=(G-([^&]+))&?.*$/;
                                if (domainRe.test(hostPart)) {
                                    const matches = qsPart.match(qsRe);
                                    if (matches && matches.length >= 3) {
                                        ga4IDsOnThisPage.push(matches[3]);
                                    }
                                }
                            }
                        }
                    }
                }

                // At this point, if one of the methods has found evidence of GA4 measurement IDs on the page,
                // ga4IDsOnThisPage should contain some items
                let ga4Added = 0;
                let ga4Skipped = 0;
                for (let cookie of cookies) {
                    if (cookie.version != 4) {
                        // Add the GA3 cookies regardless
                        filteredCookieData[cookie.name] = cookie.clientID;
                    } else {
                        // ? ARE WE SURE THE GA4 COOKIES ARE ALWAYS NAMED _ga_$MEASUREMENT_ID_MINUS_INITIAL_G- ?
                        // TODO Write a safer matching function
                        //  by searching each element of ga4IDsOnThisPage within cookie.name
                        const measurementIDIsh = cookie.name.replace(/^_ga_/, '');
                        if (ga4IDsOnThisPage.indexOf(measurementIDIsh) !== -1) {
                            ga4Added++;
                            filteredCookieData[cookie.name] = cookie.clientID;
                        } else {
                            ga4Skipped++;
                            logger.log('[_GA4CrossDomain - EXPERIMENTAL] Skipping cookie not matching with detection from ' + detectionMethod, cookie.name);
                        }
                    }
                }
                // If we found at least a valid GA4 cookie
                if (ga4Added > 0) {
                    // ... and the new list is smaller than the unfiltered one
                    if (ga4Skipped > 0) {
                        // ... overwrite the list of cookies with the filtered one
                        cookieData = filteredCookieData;
                        // logger.log('Successfully FILTERED the list of cookies used for decorating. Detection method: ' + detectionMethod, cookieData);
                    } else {
                        //logger.log('Successfully VERIFIED the list of cookies used for decorating. Detection method: ' + detectionMethod, cookieData);
                    }
                } else {
                    // Otherwise, if our matching excluded all cookies, then we assume it's because something
                    // went wrong with the detection, and we just use all cookies and leave the list untouched
                    logger.log('Experimental matching of cookies and GA4 trackers failed. Keeping the original list. Last detection method: ' + detectionMethod, cookieData);
                }
            } catch (e) {
                // If any runtime error occurs here, we don't want it to cause the decoration to fail
                logger.log('[_GA4CrossDomain - EXPERIMENTAL] - Ignoring runtime error', e);
            }

            // We sort the cookie data by the shortest, to get _ga first in the list
            const sortedCookieData: any = {};
            Object.keys(cookieData).sort((a,b) => a.length - b.length).forEach((k) => {
                sortedCookieData[k] = cookieData[k];
            });
            return sortedCookieData;
        }
        return {};
    }

    public getGA4DecoratorParam(eventToDispatch: string | false, source = window):  string | false {
        const _gl_before = this._gl;
        let changed = false;
        const sortedCookieData = this.getFilteredGACookies();
        if (Object.keys(sortedCookieData).length > this.cookieCount) {
            this.cookieCount = Object.keys(sortedCookieData).length;
            // Check again that we have the GA glBridge util
            if (typeof source.google_tag_data !== 'undefined' &&
                typeof source.google_tag_data.glBridge !== 'undefined' &&
                typeof source.google_tag_data.glBridge.generate !== 'undefined'
            ) {
                const _gl = source.google_tag_data.glBridge.generate(sortedCookieData);
                this._gl = _gl;
                (source as any)[this.globalVariableName] = _gl;
            } else {
                const _gl = this.manualGenerate_gl(sortedCookieData);
                logger.log('Generated _gl with alternative solution');
                this._gl = _gl;
                (source as any)[this.globalVariableName] = _gl;
            }
            changed = _gl_before != this._gl;
        }
        if (eventToDispatch !== false && changed) {
            dispatchEvent(eventToDispatch as string, document, this._gl);
        }
        return this._gl;
    }

    detectGA4CrossDomainParam(cback: (_gl: string|false) => void, source: any = window): void {
        this._gl = false;
        (source as any)[this.globalVariableName] = false;
        this.cookieCount = 0;

        //Wait for google_tag_data to be available and use the glBridge to generate our value
        // Up to 4000 retries every 150ms (10 minutes)
        let retriesToGo = 2000;

        const searchForGa4DecoratorParam = () => {
            // logger.log ('searchForGa4DecoratorParam to go', retriesToGo);
            retriesToGo--;
            const _gl_before = this._gl;

            if (
                (typeof source.google_tag_data !== 'undefined' &&
                typeof source.google_tag_data.glBridge !== 'undefined' &&
                typeof source.google_tag_data.glBridge.generate !== 'undefined')
                || retriesToGo < (2000 - 5) // If at least 1.5 seconds have elapsed, try to detect using the alternate method
            ) {
                this.getGA4DecoratorParam(this.onUpdateEventName, source);

                if (_gl_before === false && this._gl !== false) {
                    retriesToGo = 100; // Keep trying, but not for the whole 10 minutes, just in case a new cookie appears...
                    // logger.log('First _gl found', _gl_before, this._gl);
                }

                if (_gl_before != this._gl) {
                    cback(this._gl);
                }

                if (retriesToGo <= 0) {
                    clearInterval(ga4Interval);
                    ga4Interval = null;
                    logger.log(this._gl === false ? 'Search for GA4 _gl failed after 10 minutes' : 'Stopping successful search of _gl');
                }
            } else {
                // logger.log('google_tag_data.glBridge not found yet');
            }
        };

        // run immediately then start retrying
        // logger.log('START GA4 Params detection');
        searchForGa4DecoratorParam();
        let ga4Interval = setInterval(searchForGa4DecoratorParam, 300);

        const that = this;
        //Give up after 10 minutes
        setTimeout(function() {
            if (ga4Interval !== null) {
                logger.log('giving up GA4 params detection, HEADS UP! You may need to make sure there is analytics.js loaded on the page');
                clearInterval(ga4Interval);
                dispatchEvent(that.onUpdateEventName);
                cback(that._gl);
            }
        }, 600000);
    }

    /**
     * Adds the GA4 linker param to the query string of the URL passed as first parameter.
     * Existing values will be overwritten, always.
     *
     * @param url (string) The URL to decorate
     * @param extraParams (boolean, default = false) additional params to inject
     */
    public decorateURL(url: string, extraParams: {[key : string]: string} = {}): string {
        const u = parseUrlParts(url);
        if (!u.hostname || u.hostname === '') {
            return url;
        }
        let params = getUrlVars(url);
        params = this.decorateObject(params, extraParams);
        const searchChunks: string[] = [];
        for (let key in params) {
            if (params.hasOwnProperty(key) && params[key] !== false && params[key] !== null && typeof params[key] == 'string') {
                searchChunks.push(encodeURIComponent(key)+'='+encodeURIComponent(params[key]));
            }
        }
        if (searchChunks.length > 0) {
            const path = /^\//.test(u.pathname) ? u.pathname : '/' + u.pathname;
            url = u.protocol + '//' + u.hostname + path + '?' + searchChunks.join('&') + (u.hash || '');
        }

        return url;
    }

    /**
     * Adds GA4 linker param to the object passed as first argument.
     * Existing values will be overwritten, always.
     *
     * @param obj (string) The Query String parameters, as a javascript object, to decorate
     * @param extraParams (boolean, default = false) additional params to inject
     */
    public decorateObject(obj: {[key: string]: string}, extraParams: {[key : string]: string} = {}): object {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        const curParams = {_gl: this._gl, ...extraParams};
        for (let key in curParams) {
            if (curParams.hasOwnProperty(key)) {
                obj[key] = (curParams as any)[key];
            }
        }

        return typeof this.postDecorateCallback === 'function' ? this.postDecorateCallback(obj) : obj;
    }

    public manualGenerate_gl(cookieMap: { [key: string]: string }){
        return glGenerate(cookieMap);
    }
}
