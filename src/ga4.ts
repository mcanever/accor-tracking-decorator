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

    public getGA4DecoratorParam(eventToDispatch: string | false, source = window):  string | false {
        const _gl_before = this._gl;
        let changed = false;
        const cookies = this.getGACookies();
        if (cookies.length > this.cookieCount) {
            this.cookieCount = cookies.length;
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

            if (typeof source.google_tag_data.td !== 'undefined') {
                try {
                    let filteredCookieData:{[key: string]: string} = {};
                    // WARNING UNDOCUMENTED STUFF!
                    // The line below is based on reverse engineering of the public variable google_tag_data.td
                    // We noticed it contains an associative array of all the GA4 tags actually
                    // loaded on the page, where keys are measurement IDs like G-AB12CDEFGHI
                    let ga4IDsOnThisPage = Object.keys(source.google_tag_data.td);

                    if (Array.isArray(ga4IDsOnThisPage) && ga4IDsOnThisPage.length > 0) {
                        // Remove the initial G-
                        ga4IDsOnThisPage = ga4IDsOnThisPage.map((id) => id.replace(/^G-/, ''));
                        let ga4Added = 0;
                        let ga4Skipped = 0;
                        for (let cookie of cookies) {
                            if (cookie.version != 4) {
                                // Add the GA3 cookies as usual
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
                                    logger.log('[_GA4CrossDomain - EXPERIMENTAL] Skipping cookie not matching with google_tag_data.td', cookie.name);
                                }
                            }
                        }
                        // If we found at least a valid GA4 cookie
                        if (ga4Added > 0) {
                            // ... and the new list is smaller than the unfiltered one
                            if (ga4Skipped > 0) {
                                // ... overwrite the list of cookies with the filtered one
                                cookieData = filteredCookieData;
                                logger.log('Successfully filtered the list of cookies used for decorating based on google_tag_data.td', cookieData);
                            }
                        } else {
                            // Otherwise, if our matching excluded all cookies, then it's because something went wrong,
                            // then we just use all cookies and leave the list untouched
                            logger.log('Experimental matching of cookies and GA4 trackers failed. Keeping the original list', cookieData);
                        }
                    }
                } catch (e) {
                    // If any runtime error occurs here, we don't want it to cause the decoration to fail
                }
            }

            // Check again that we have the GA glBridge util
            if (typeof source.google_tag_data !== 'undefined' &&
                typeof source.google_tag_data.glBridge !== 'undefined' &&
                typeof source.google_tag_data.glBridge.generate !== 'undefined'
            ) {
                const _gl = source.google_tag_data.glBridge.generate(cookieData);
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
        let retriesToGo = 4000;

        const searchForGa4DecoratorParam = () => {
            // logger.log ('searchForGa4DecoratorParam to go', retriesToGo);
            retriesToGo--;
            const _gl_before = this._gl;

            if (
                typeof source.google_tag_data !== 'undefined' &&
                typeof source.google_tag_data.glBridge !== 'undefined' &&
                typeof source.google_tag_data.glBridge.generate !== 'undefined'
            ) {
                this.getGA4DecoratorParam(this.onUpdateEventName, source);

                if (_gl_before === false && this._gl !== false) {
                    retriesToGo = 200; // Keep trying, but not for the whole 10 minutes, just in case a new cookie appears...
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
        let ga4Interval = setInterval(searchForGa4DecoratorParam, 150);

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
}
