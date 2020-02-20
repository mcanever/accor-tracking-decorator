import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';
import { Attribution } from "./attribution";
import { Store } from "./store";
import { utils } from "./utils";

/**
 * Main class to use for decorating any link going to all.accor.com with vital parameters that ensure tracking
 */
class Decorator {
    public static namespace: Namespace;
    public static trackingParams: TrackingParams;
    private static config: {
        merchantid: string,
        hotelID: string,
        autoDecorate: boolean,
        debug: boolean,
        handleGoogleAnalytics: boolean,
        testReferrer: string,
        domainsToDecorate: RegExp[],
    };

    /**
     * Initialize the decorator.
     */
    public static init() {
        // Init namespace handler that will expose our public methods in the window
        // window._AccorTrackingDecorator object
        Decorator.namespace = new Namespace();

        Decorator.namespace.set('decorateUrl', Decorator.decorateURL);
        Decorator.namespace.set('decorateObject', Decorator.decorateObject);

        Decorator.namespace.set('decorator', Decorator);
        Decorator.namespace.set('Store', Store);
        Decorator.namespace.set('utils', utils);

        // Read configuration from global namespace
        Decorator.initConfig();

        logger.log('AccorTrackingDecorator config', Decorator.config);

        // Initialize parameters
        Decorator.initParameters();

        if (Decorator.config.autoDecorate) {
            Decorator.autoDecorate();
        }
    }

    /**
     * Adds tracking parameters to the query string of the URL passed as first parameter.
     * Existing values will be overwritten, always.
     *
     * @param url (string) The URL to decorate
     * @param recalculate (boolean, default = false) Force recalculation of parameters at the time of execution
     * @param dontCheckDomain (boolean, default = false) Don't verify if domain is one of those that need decorated URLs
     */
    public static decorateURL(url: string, recalculate = false, dontCheckDomain = false): string {
        const u = utils.parseUrlParts(url);
        if (!u.hostname || u.hostname === '') {
            return url;
        }
        const cleanHostname = u.hostname.toLowerCase();

        let validDomain = false;
        if (dontCheckDomain) {
            validDomain = true
        } else {
            Decorator.config.domainsToDecorate.forEach((re: RegExp) => {
                if (re.test(cleanHostname)){
                    validDomain = true;
                }
            });
        }

        if (validDomain) {
            let params = utils.getUrlVars(url);
            params = Decorator.decorateObject(params, recalculate);
            const searchChunks: string[] = [];
            for (let key in params) {
                if (params.hasOwnProperty(key) && params[key] !== false && params[key] !== null && typeof params[key] == 'string') {
                    searchChunks.push(encodeURIComponent(key)+'='+encodeURIComponent(params[key]));
                }
            }
            if (searchChunks.length > 0) {
                url = u.protocol + '//' + u.hostname + u.pathname + '?' + searchChunks.join('&') + u.hash;
            }
        }

        return url;
    }

    /**
     * Adds tracking parameters to the object passed as first parameter.
     * Existing values will be overwritten, always.
     *
     * @param obj (string) The Query String parameters, as a javascript object, to decorate
     * @param recalculate (boolean, default = false) Force recalculation of parameters at the time of execution
     */
    public static decorateObject(obj: any, recalculate = false): object {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (recalculate) {
            Decorator.initParameters();
        }
        for (let key in Decorator.trackingParams) {
            if (Decorator.trackingParams.hasOwnProperty(key)) {
                const value = (Decorator.trackingParams as any)[key];
                obj[key] = value;
            }
        }
        return obj;
    }

    static autoDecorate() {
        let fired = false;
        const cback = () => {
            if (fired) {
                return;
            }
            fired = true;
            setTimeout(() => {
                logger.log('autoDecorate');
                const allLinks = document.getElementsByTagName('a');
                for (let i = 0; i < allLinks.length; i++) {
                    const a = allLinks[i];
                    const href = a.getAttribute('href');
                    if (href !== null) {
                        const newHref = Decorator.decorateURL(href);
                        logger.log('Autodecorate', href, newHref);
                        a.setAttribute('href', newHref);
                    }
                }
            }, 300);
        };

        if (Decorator.config.handleGoogleAnalytics) {
            document.addEventListener('accor_tracking_params_available', cback);
        } else {
            utils.onDomReady(cback);
        }
    }

    // Read config from the global variable and set defaults with some smart detection
    static initConfig() {
        Decorator.config = {
            merchantid: Decorator.namespace.getConfig('merchantid') || '',
            hotelID: Decorator.namespace.getConfig('hotelID') || '',
            autoDecorate: !!Decorator.namespace.getConfig('autoDecorate'),
            debug: !!Decorator.namespace.getConfig('debug'),
            handleGoogleAnalytics: Decorator.namespace.getConfig('handleGoogleAnalytics') !== false,
            testReferrer: Decorator.namespace.getConfig('testReferrer') || '',
            domainsToDecorate: Decorator.namespace.getConfig('domainsToDecorate') || [/^all\.accor\.com$/, /accorhotels.com$/],
        };

        // Configure logger
        logger.enabled = Decorator.config.debug;

        // Force Uppercase to avoid ambiguous hotel IDs
        Decorator.config.hotelID = Decorator.config.hotelID.toUpperCase();
        Decorator.config.merchantid = Decorator.config.merchantid.toUpperCase();

        // Detect HotelID from config.merchantid
        if (Decorator.config.hotelID === '' && Decorator.config.merchantid !== '') {
            const matches = Decorator.config.merchantid.match(/^MS-([A-Z0-9]+)$/);
            if (matches && matches.length == 2) {
                Decorator.config.hotelID = matches[1];
                logger.log('hotelID was empty, deriving it from merchantid: ', Decorator.config.hotelID);
            }
        }

        // Build merchantid from HotelID
        if (Decorator.config.merchantid === '') {
            logger.log('config.merchantid is empty!');
            if (Decorator.config.hotelID !== '') {
                Decorator.config.merchantid = 'MS-' + Decorator.config.hotelID;
                logger.log('Using hotelID to set merchantid', Decorator.config.merchantid);
            }
        }
    }

    // Prepare the parameters based on the initial context and configuration
    static initParameters() {
        Decorator.trackingParams = {
            utm_source: 'hotelwebsite[' + Decorator.config.hotelID + ']',
            utm_campaign: 'hotel website search',
            utm_medium: 'accor regional websites',
            merchantid: Decorator.config.merchantid
        };
        // Detect Google Analytics _ga and gacid parameters
        detectGAParameters((params) =>  {
            if (Decorator.config.handleGoogleAnalytics) {
                Decorator.trackingParams.gacid = params.gacid;
                Decorator.trackingParams._ga = params._ga;
            }
            logger.log('AccorTrackingDecorator params', Decorator.trackingParams);
        });

        const referrer = Decorator.config.testReferrer !== '' ? Decorator.config.testReferrer : document.referrer;
        Decorator.trackingParams.sourceid = Attribution.getSourceId(referrer);
    }
}
Decorator.init();