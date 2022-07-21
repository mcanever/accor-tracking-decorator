import { logger } from "./logger";
import { dispatchEvent } from "./dom";

declare global {
    interface Window {
        google_tag_data: any
    }
}

type SingleGACookie = {
    rawValue: string
    name: string
    clientID: string
}

export class GA4CrossDomain {
    public _gl: string | false = false;
    public cookieCount = 0;

    constructor(public globalVariableName = '_GA4CrossDomainParam', public onUpdateEventName = 'accor_ga4_param_updated') {

    }

    public extractClientID(name:string, rawValue: string):string {
        // GUA cookies seems to look like GA1.X.$CLIENTID where X is a digit (but let's assume there can be more)
        const ga3RE = /^GA1\.\d+\.(.+)$/;
        const ga4RE = /^GS1\.\d+\.(.+)$/;
        if (ga3RE.test(rawValue)) {
            const matches = ga3RE.exec(rawValue);
            return matches[1];
        } else if (ga4RE.test(rawValue)) {
            const matches = ga4RE.exec(rawValue);
            return matches[1];
        } else {
            logger.log(`Warning: the value for the cookie ${name} does not match GA3 or GA4 format`, rawValue);
            return rawValue;
        }
    }

    public getGACookies():SingleGACookie[] {
        const allCookies:SingleGACookie[] = [];
        const cleanCookies:SingleGACookie[] = [];
        // Iterate all cookies in this domain
        const pairs = document.cookie.split('; ');
        for (let pair of pairs) {
            const parts = pair.split('=');
            const name = parts[0];
            const rawValue = parts[1];
            // Google Analytics cookies start with '_ga'.
            // This is a wild assumption but well, we don't want to configure a list manually. XD
            if (/(^_ga$)|^_ga_/.test(name)) {
                allCookies.push({ name, rawValue, clientID: this.extractClientID(name, rawValue)});
            }
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
}
