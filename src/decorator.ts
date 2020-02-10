import { Namespace } from './namespace';

class AccorTrackingDecorator {
    private namespace: Namespace;

    constructor() {
        this.namespace = new Namespace();
        this.namespace.set('instance', this);
    }

}

new AccorTrackingDecorator();