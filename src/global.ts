declare global {
    interface Window {
        _AccorTrackingDecorator: any;
    }
}

/**
 * Exposes properties and method to window
 */
export class GlobalScope {
    constructor() {
        if (typeof window._AccorTrackingDecorator === 'undefined') {
            window._AccorTrackingDecorator = {};
        }
    }

    public get(name: string): any {
        return window._AccorTrackingDecorator[name];
    }

    public set(name: string, value: any): any {
        window._AccorTrackingDecorator[name] = value;
    }
}