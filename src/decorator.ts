import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';
import {Attribution} from "./attribution";

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
    };

    constructor() {
        // Init namespace handler that will expose our public methods in the window
        // window._AccorTrackingDecorator object
        this.namespace = new Namespace();
        this.namespace.set('instance', this);

        // Read configuration from global namespace
        this.initConfig();

        // Configure logger
        logger.enabled = this.config.debug;
        logger.log('AccorTrackingDecorator config', this.config);

        // Initialize parameters
        this.initParameters();
    }

    private initConfig() {
        this.config = {
            merchantid: this.namespace.getConfig('merchantid') || '',
            hotelID: this.namespace.getConfig('hotelID') || '',
            debug: !!this.namespace.getConfig('debug'),
            handleGoogleAnalytics: this.namespace.getConfig('handleGoogleAnalytics') !== false
        };
    }

    private initParameters() {
        this.trackingParams = {
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
        Attribution.testStore();
    }

}

new AccorTrackingDecorator();