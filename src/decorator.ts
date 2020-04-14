import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';
import { Attribution } from "./attribution";
import { utils } from "./utils";

export type DecoratorConfig = {
    merchantid: string,
    hotelID: string,
    autoDecorate: boolean,
    debug: boolean,
    handleGoogleAnalytics: boolean,
    testReferrer: string,
    domainsToDecorate: RegExp[],
}
/**
 * Main class to use for decorating any link going to all.accor.com with vital parameters that ensure tracking
 */
export class Decorator {
    private namespace: Namespace;
    public trackingParams: TrackingParams;
    public config: DecoratorConfig;

    constructor(namespace: Namespace) {
        this.namespace = namespace;
        this.initConfig();
        logger.log('AccorTrackingDecorator config', this.config);
        this.initParameters();
    }

    /**
     * Adds tracking parameters to the query string of the URL passed as first parameter.
     * Existing values will be overwritten, always.
     *
     * @param url (string) The URL to decorate
     * @param extraParams (object) Adds/overrides some params to the url
     */
    public decorateURL(url: string, extraParams: {[key : string]: string} = {}): string {
        const u = utils.parseUrlParts(url);
        if (!u.hostname || u.hostname === '') {
            return url;
        }
        let params = utils.getUrlVars(url);
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
     * Adds tracking parameters to the object passed as first parameter.
     * Existing values will be overwritten, always.
     *
     * @param obj (string) The Query String parameters, as a javascript object, to decorate
     * @param extraParams (boolean, default = false) Force recalculation of parameters at the time of execution
     */
    public decorateObject(obj: {[key: string]: string}, extraParams: {[key : string]: string} = {}): object {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        const curParams = {... this.trackingParams, ...extraParams};
        for (let key in curParams) {
            if (curParams.hasOwnProperty(key)) {
                obj[key] = (curParams as any)[key];
            }
        }

        return obj;
    }

    public autoDecorate() {
        let fired = false;
        const cback = () => {
            if (fired) {
                return;
            }
            fired = true;
            setTimeout(() => this.decorateAll(), 300);
        };
        document.addEventListener('accor_tracking_params_available', cback);
    }

    /**
     * Programmatically decorates all links in the page matching the domainsToDecorate RegExp
     */
    public decorateAll() {
        logger.log('decorateAll');
        const allLinks = document.getElementsByTagName('a');
        for (let i = 0; i < allLinks.length; i++) {
            const a = allLinks[i];
            const href = a.getAttribute('href');
            if (href !== null) {
                const hostname = utils.parseUrlParts(href).hostname.toLowerCase();
                const validDomain = this.config.domainsToDecorate
                  .map((re: RegExp) => re.test(hostname))
                  .some((a) => a);
                if (validDomain) {
                    const newHref = this.decorateURL(href);
                    logger.log('Autodecorate', href, newHref);
                    a.setAttribute('href', newHref);
                }
            }
        }
    }


    // Read config from the global variable and set defaults with some smart detection
    private initConfig() {
        this.config = {
            merchantid: this.namespace.getConfig('merchantid') || '',
            hotelID: this.namespace.getConfig('hotelID') || '',
            autoDecorate: !!this.namespace.getConfig('autoDecorate'),
            debug: !!this.namespace.getConfig('debug'),
            handleGoogleAnalytics: this.namespace.getConfig('handleGoogleAnalytics') !== false,
            testReferrer: this.namespace.getConfig('testReferrer') || '',
            domainsToDecorate: this.namespace.getConfig('domainsToDecorate') || [/^all\.accor\.com$/, /accorhotels.com$/],
        };

        // Configure logger
        logger.enabled = this.config.debug;

        // Force Uppercase to avoid ambiguous hotel IDs
        this.config.hotelID = this.config.hotelID.toUpperCase();
        this.config.merchantid = this.config.merchantid.toUpperCase();

        // Detect HotelID from config.merchantid
        if (this.config.hotelID === '' && this.config.merchantid !== '') {
            const matches = this.config.merchantid.match(/^MS-([A-Z0-9]+)$/);
            if (matches && matches.length == 2) {
                this.config.hotelID = matches[1];
                logger.log('hotelID was empty, deriving it from merchantid: ', this.config.hotelID);
            }
        }

        // Build merchantid from HotelID
        if (this.config.merchantid === '') {
            logger.log('config.merchantid is empty!');
            if (this.config.hotelID !== '') {
                this.config.merchantid = 'MS-' + this.config.hotelID;
                logger.log('Using hotelID to set merchantid', this.config.merchantid);
            }
        }
    }

    // Prepare the parameters based on the initial context and configuration
    public initParameters() {
        this.trackingParams = {
            utm_source: 'hotelwebsite[' + this.config.hotelID + ']',
            utm_campaign: 'hotel website search',
            utm_medium: 'accor regional websites',
            merchantid: this.config.merchantid
        };
        // Detect Google Analytics _ga and gacid parameters
        detectGAParameters((params) =>  {
            if (this.config.handleGoogleAnalytics) {
                this.trackingParams.gacid = params.gacid;
                this.trackingParams._ga = params._ga;
            }
            logger.log('AccorTrackingDecorator params', this.trackingParams);
        }, this.namespace.source);

        const referrer = this.config.testReferrer !== '' ? this.config.testReferrer : document.referrer;
        this.trackingParams.sourceid = Attribution.getSourceAndMerchantIds(referrer).sourceid;
        this.trackingParams.merchantid = Attribution.getSourceAndMerchantIds(referrer).merchantid || this.trackingParams.merchantid;

        if (!this.config.handleGoogleAnalytics){
            utils.dispatchEvent('accor_tracking_params_available');
        }
    }
}
