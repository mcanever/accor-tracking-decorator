import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';
import { Attribution } from "./attribution";
import { utils } from "./utils";
import { Store } from './store';

declare global {
    interface Window {
        dataLayer: any
    }
}

export type DecoratorConfig = {
    autoDecorate: boolean
    debug: boolean
    handleGoogleAnalytics: boolean
    domainsToDecorate: RegExp[]
    paramsToPropagate: (keyof TrackingParams)[]
    pushVarsToDataLayer: { [paramName:string] : string }
}
/**
 * Main class to use for decorating any link going to specific domains with vital parameters that ensure tracking
 */
export class Decorator {
    private namespace: Namespace;
    public trackingParams: TrackingParams;
    public config: DecoratorConfig;

    constructor(namespace: Namespace) {
        this.namespace = namespace;
        this.initConfig();
        logger.log('JoAndJoeTrackingDecorator config', this.config);
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
            autoDecorate: !!this.namespace.getConfig('autoDecorate'),
            debug: !!this.namespace.getConfig('debug'),
            handleGoogleAnalytics: this.namespace.getConfig('handleGoogleAnalytics') !== false,
            domainsToDecorate: this.namespace.getConfig('domainsToDecorate') || [/secure-hotel-booking\.com$/, /all\.accor\.com$/],
            paramsToPropagate: this.namespace.getConfig('paramsToPropagate') || [
                'utm_source',
                'utm_content',
                'utm_term',
                'utm_medium',
                'utm_campaign',
                'utm_sourceid',
                'sourceid',
                'merchantid',
                'sourcid'
            ],
            pushVarsToDataLayer: this.namespace.getConfig('pushVarsToDataLayer') || {
                merchantid: 'merchantid', // "name of parameter in cookie or URL" : "name of dataLayer variable"
                sourceid: 'sourceid'
            }
        };

        // Configure logger
        logger.enabled = this.config.debug;
    }

    private pushToDataLayer() {
        let dataLayerObj:{ [variableName:string] : string } = {};
        const decorator = this;
        Object.keys(this.config.pushVarsToDataLayer).forEach((paramName) => {
            const dataLayerVarName = this.config.pushVarsToDataLayer[paramName];
            const dataLayerVarValue = paramName in decorator.trackingParams ? (decorator.trackingParams as any)[paramName] : '';
            dataLayerObj[dataLayerVarName] = dataLayerVarValue;
        });
        logger.log('Pushing to dataLayer', dataLayerObj);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(dataLayerObj);
    }

    // Prepare the parameters based on the initial context and configuration
    public initParameters() {
        this.trackingParams = {};

        // Detect Google Analytics _ga parameter
        detectGAParameters((params) =>  {
            if (this.config.handleGoogleAnalytics) {
                this.trackingParams._ga = params._ga;
            }
            logger.log('JoAndJoeTrackingDecorator params', this.trackingParams);
        }, this.namespace.source);


        // Save in cookie
        Attribution.detectAttributon(this.config.paramsToPropagate);

        const self = this;
        this.config.paramsToPropagate.forEach(function (param) {
            const fromCookie = Store.get(param);
            if (fromCookie !== null && fromCookie !== '') {
                self.trackingParams[param] = fromCookie;
            }
        });

        if (Object.keys(this.config.pushVarsToDataLayer).length > 0){
            this.pushToDataLayer();
        }

        if (!this.config.handleGoogleAnalytics){
            utils.dispatchEvent('accor_tracking_params_available');
        }
    }
}
