import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';
import {Attribution} from "./attribution";
import {Store} from "./store";

/**
 * Main class to use for decorating any link going to all.accor.com with vital parameters that ensure tracking
 */
class AccorTrackingDecorator {
    private namespace: Namespace;
    public trackingParams: TrackingParams;
    private config: {
        merchantid: string,
        hotelID: string,
        debug: boolean,
        handleGoogleAnalytics: boolean,
        testReferrer: string
    };

    constructor() {
        // Init namespace handler that will expose our public methods in the window
        // window._AccorTrackingDecorator object
        this.namespace = new Namespace();
        this.namespace.set('instance', this);
        this.namespace.set('Store', Store);

        // Read configuration from global namespace
        this.initConfig();

        logger.log('AccorTrackingDecorator config', this.config);

        // Initialize parameters
        this.initParameters();
    }

    // Read config from the global variable and set defaults with some smart detection
    private initConfig() {
        this.config = {
            merchantid: this.namespace.getConfig('merchantid') || '',
            hotelID: this.namespace.getConfig('hotelID') || '',
            debug: !!this.namespace.getConfig('debug'),
            handleGoogleAnalytics: this.namespace.getConfig('handleGoogleAnalytics') !== false,
            testReferrer: this.namespace.getConfig('testReferrer') || ''
        };

        // Configure logger
        logger.enabled = this.config.debug;

        // Force Uppercase to avoid ambiguous hotel IDs
        this.config.hotelID = this.config.hotelID.toUpperCase();
        this.config.merchantid = this.config.merchantid.toUpperCase();

        if (this.config.hotelID === '' && this.config.merchantid !== '') {
            const matches = this.config.merchantid.match(/^MS-([A-Z0-9]+)$/);
            if (matches && matches.length == 2) {
                this.config.hotelID = matches[1];
                logger.log('hotelID was empty, deriving it from merchantid: ', this.config.hotelID);
            }
        }

        if (this.config.merchantid === '') {
            logger.log('config.merchantid is empty!');
            if (this.config.hotelID !== '') {
                this.config.merchantid = 'MS-' + this.config.hotelID;
                logger.log('Using hotelID to set merchantid', this.config.merchantid);
            }
        }


    }

    // Prepare the parameters based on the initial context and configuration
    private initParameters() {
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
        });

        const referrer = this.config.testReferrer !== '' ? this.config.testReferrer : document.referrer;
        const attr = Attribution.getAttributionParams(referrer);
        logger.log('bd', attr);
    }

}

new AccorTrackingDecorator();