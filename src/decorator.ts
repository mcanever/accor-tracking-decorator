import { GlobalScope } from './global';

class AccorTrackingDecorator {
    private scope: GlobalScope;

    constructor(nameSpace: string = '') {
        this.scope = new GlobalScope();
        this.scope.set('instance', this);
    }

    public getCurrentUrl(): string {
        return location.href;
    }
}

new AccorTrackingDecorator();