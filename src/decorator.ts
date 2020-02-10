import { GlobalScope } from './global';

class AccorTrackingDecorator {
    private scope: GlobalScope;

    constructor() {
        this.scope = new GlobalScope();
        this.scope.set('instance', this);
    }

}

new AccorTrackingDecorator();