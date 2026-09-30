import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';
import { Attribution } from "./attribution";
import { utils } from "./utils";
import { Store } from './store';
import {GA4CrossDomain} from "./ga4";

export type DecoratorConfig = {
    merchantid: string,
    hotelID: string,
    autoDecorate: boolean,
    debug: boolean,
    handleGoogleAnalytics: boolean,
    testReferrer: string,
    domainsToDecorate: RegExp[],
    isBrandSite?: boolean,
    brandName?: string,
    dontLogSuccessMessages?: boolean,
    postDecorateCallback?: (obj: any) => any,
    ga4LinkerMaxAge?: number,
    ga4RefreshInterval?: number
}
/**
 * Main class to use for decorating any link going to all.accor.com with vital parameters that ensure tracking
 */
export class Decorator {
    private namespace: Namespace;
    // The GA4 cross domain helper, exposed for debugging (window._AccorTrackingDecorator.decorator.ga4)
    public ga4: GA4CrossDomain | null = null;
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
        if (this.ga4 !== null) {
            // The _gl hash is only valid for a couple of minutes: regenerate it if it is too old
            this.trackingParams._gl = this.ga4.getFreshGl();
        }
        const curParams = {... this.trackingParams, ...extraParams};
        for (let key in curParams) {
            if (curParams.hasOwnProperty(key)) {
                obj[key] = (curParams as any)[key];
            }
        }

        return this.config.postDecorateCallback(obj);
    }

    public autoDecorate() {
        let fired = false;
        let firedGa4 = false;
        const cback = () => {
            if (fired) {
                return;
            }
            fired = true;
            setTimeout(() => this.decorateAll(), 300);
        };
        const cbackGa4 = () => {
            if (firedGa4) {
                return;
            }
            firedGa4 = true;
            setTimeout(() => this.decorateAll(), 300);
        };

        document.addEventListener('accor_tracking_params_available', cback);
        document.addEventListener('accor_ga4_param_updated', cbackGa4);

        // Re-decorate the clicked link right before the browser follows it, so that the GA4 _gl hash
        // (only valid for a couple of minutes) is never expired. Capture phase: runs before any other
        // click handler. auxclick covers middle-click (open in a new tab).
        const refreshOnClick = (e: Event) => {
            try {
                const a = this.findAnchor(e.target);
                if (a === null) {
                    return;
                }
                const href = a.getAttribute('href');
                if (this.shouldDecorateHref(href)) {
                    const newHref = this.decorateURL(href);
                    if (newHref !== href) {
                        a.setAttribute('href', newHref);
                        logger.log('[GA4] Re-decorated link on ' + e.type, href, newHref);
                    }
                }
            } catch (err) {
                logger.log('Error while re-decorating link on click', err);
            }
        };
        document.addEventListener('click', refreshOnClick, true);
        document.addEventListener('auxclick', refreshOnClick, true);

        // Optional periodic refresh of all links, for links used without a click
        // (copy link address, open from the context menu, third party scripts reading the href...)
        const ga4 = this.ga4;
        if (ga4 !== null && this.config.ga4RefreshInterval > 0) {
            setInterval(() => {
                if (ga4.isGlStale()) {
                    logger.log('[GA4] _gl is too old, decorating all links again (ga4RefreshInterval)');
                    this.decorateAll(true);
                }
            }, this.config.ga4RefreshInterval);
        }
    }

    /**
     * True if a link with this href should be decorated: it must point to a domain different from
     * the current one, and matching one of the domainsToDecorate regular expressions
     */
    public shouldDecorateHref(href: string | null): boolean {
        if (href === null || href === '') {
            return false;
        }
        const hostname = utils.parseUrlParts(href).hostname.toLowerCase();
        const isNotSameDomain = hostname != document.location.hostname;
        const domainMatchesRegExps = this.config.domainsToDecorate
            .map((re: RegExp) => re.test(hostname))
            .some((a) => a);
        return isNotSameDomain && domainMatchesRegExps;
    }

    // Returns the closest <a> element containing the node, or null
    private findAnchor(node: any): HTMLAnchorElement | null {
        while (node && node !== document) {
            if (String(node.nodeName).toUpperCase() === 'A' && typeof node.getAttribute === 'function') {
                return node as HTMLAnchorElement;
            }
            node = node.parentNode;
        }
        return null;
    }

    /**
     * Programmatically decorates all links in the page matching the domainsToDecorate RegExp
     *
     * @param quiet (boolean, default = false) do not log the success message
     */
    public decorateAll(quiet = false) {
        logger.log('decorateAll');
        const allLinks = document.getElementsByTagName('a');
        let decoratedCount = 0;
        for (let i = 0; i < allLinks.length; i++) {
            const a = allLinks[i];
            const href = a.getAttribute('href');
            if (this.shouldDecorateHref(href)) {
                const newHref = this.decorateURL(href);
                logger.log('Autodecorate', href, newHref);
                a.setAttribute('href', newHref);
                decoratedCount++;
            }
        }
        if (decoratedCount > 0 && !quiet) {
            logger.success('Successfully decorated ' + decoratedCount + ' links with parameters', this.decorateObject({}));
        }
    }


    // Read config from the global variable and set defaults with some smart detection
    private initConfig() {
        const postDecorateCallback = this.namespace.getConfig('postDecorateCallback') as ( obj: any ) => any;
        const ga4LinkerMaxAge = this.namespace.getConfig('ga4LinkerMaxAge');
        const ga4RefreshInterval = this.namespace.getConfig('ga4RefreshInterval');
        this.config = {
            merchantid: this.namespace.getConfig('merchantid') || '',
            hotelID: this.namespace.getConfig('hotelID') || '',
            autoDecorate: !!this.namespace.getConfig('autoDecorate'),
            debug: !!this.namespace.getConfig('debug') || (location.href.indexOf('forceAccorTrackingDecoratorDebug') !== -1),
            handleGoogleAnalytics: this.namespace.getConfig('handleGoogleAnalytics') !== false,
            testReferrer: this.namespace.getConfig('testReferrer') || '',
            domainsToDecorate: this.namespace.getConfig('domainsToDecorate') || [/^all\.accor\.com$/, /accorhotels.com$/],
            isBrandSite: this.namespace.getConfig('isBrandSite') || false,
            brandName: this.namespace.getConfig('brandName') || '',
            dontLogSuccessMessages: !!this.namespace.getConfig('dontLogSuccessMessages'),
            postDecorateCallback: typeof postDecorateCallback === 'function' ? postDecorateCallback : ( obj: any ) => obj,
            ga4LinkerMaxAge: typeof ga4LinkerMaxAge === 'number' && ga4LinkerMaxAge >= 0 ? ga4LinkerMaxAge : undefined,
            ga4RefreshInterval: typeof ga4RefreshInterval === 'number' && ga4RefreshInterval > 0 ? ga4RefreshInterval : 0
        };

        // Configure logger
        logger.debug = this.config.debug;
        logger.logSuccessMessages = !this.config.dontLogSuccessMessages;
        this.namespace.set('logger', logger);

        // Force Uppercase to avoid ambiguous hotel IDs
        this.config.hotelID = this.config.hotelID.toUpperCase();

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
        if (this.config.isBrandSite) {
            this.trackingParams = {
                merchantid: this.config.merchantid
            };
        } else {
            this.trackingParams = {
                utm_source: 'hotelwebsite_' + this.config.hotelID,
                utm_campaign: 'hotel_website_search',
                utm_medium: 'accor_regional_websites',
                merchantid: this.config.merchantid
            };
        }
        // Detect Google Analytics _ga and gacid parameters
        if (this.config.handleGoogleAnalytics) {
            detectGAParameters((params) =>  {
                this.trackingParams.gacid = params.gacid;
                this.trackingParams._ga = params._ga;
                this.trackingParams._gac = params._gac;
                this.trackingParams._gcl = params._gcl;
            }, this.namespace.source);
            this.ga4 = new GA4CrossDomain();
            if (typeof this.config.ga4LinkerMaxAge === 'number') {
                this.ga4.maxAge = this.config.ga4LinkerMaxAge;
            }
            this.ga4.detectGA4CrossDomainParam((_gl) => {
                logger.log('[GA4] Updated _gl', _gl);
                this.trackingParams._gl = _gl;
            });
            document.addEventListener('accor_ga4_param_updated', (e:CustomEvent) => {
                this.trackingParams._gl = e.detail;
            });
        } else {
            setTimeout(() => utils.dispatchEvent('accor_tracking_params_available'), 150);
        }

        const referrer = this.config.testReferrer !== '' ? this.config.testReferrer : document.referrer;

        // Save in cookie
        const referrerData = Attribution.detectAttributonFromReferrer(referrer);
        referrerData.merchantid = referrerData.merchantid || this.trackingParams.merchantid;
        const storeData =  {
            sourceid: Store.get('sourceid'),
            merchantid: Store.get('merchantid')
        };

        logger.log('Are referrer and location equal ?', utils.areReferrerAndLocationEqual(referrer));

        const referrerAttributionScore = Attribution.getScore(referrerData);
        const storedAttributionScore = Attribution.getScore(storeData);

        logger.log('Attribution data detected from current URL, Referrer and configuration = ', referrerData);
        logger.log('Stored Attribution data (from previous visits if any) = ', storeData);
        logger.log('Attribution score of current URL/referrer = ', referrerAttributionScore, 'Attribution Score of stored data = ', storedAttributionScore);

        if ( referrerAttributionScore >= storedAttributionScore && !utils.areReferrerAndLocationEqual(referrer) ) {
            Store.set('sourceid', referrerData.sourceid);
            Store.set('merchantid', referrerData.merchantid);
            logger.success('New sourceid and/or merchantid', referrerData.sourceid, referrerData.merchantid);
        }

        this.trackingParams.sourceid = Store.get('sourceid');
        this.trackingParams.merchantid = Store.get('merchantid');

        if (!this.config.handleGoogleAnalytics){
            utils.dispatchEvent('accor_tracking_params_available');
        }
    }
}
