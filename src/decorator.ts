import { detectGAParameters } from "./ga";
import { logger } from "./logger";
import { Namespace } from './namespace';
import { TrackingParams } from './types/trackingparams';

class AccorTrackingDecorator {
    private namespace: Namespace;
    public trackingParams: TrackingParams;
    private config: {
        merchantid: string,
        debug: boolean
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
        logger.log('AccorTrackingDecorator params', this.trackingParams);

        // Detect Google Analytics _ga and gacid parameters
        detectGAParameters((params) =>  {
           this.trackingParams.gacid = params.gacid;
           this.trackingParams._ga = params._ga;
           logger.log(this.trackingParams);
        });
    }

    private initConfig() {
        this.config = {
            merchantid: this.namespace.getConfig('merchantid') || '',
            debug: !!this.namespace.getConfig('debug')
        };
    }

    private initParameters() {
        this.trackingParams = {
            merchantid: this.config.merchantid
        };
    }

}

new AccorTrackingDecorator();