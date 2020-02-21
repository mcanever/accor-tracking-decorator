declare global {
    interface Window {
        _AccorTrackingDecorator: any;
    }
}

/**
 * Exposes properties and method to window (by default)
 */
export class Namespace {
    constructor(public source: any = window) {
        if (typeof this.source._AccorTrackingDecorator === 'undefined') {
            this.source._AccorTrackingDecorator = {};
        }
    }

    public get(name: string): any {
        return this.source._AccorTrackingDecorator[name];
    }

    public set(name: string, value: any): any {
        this.source._AccorTrackingDecorator[name] = value;
    }

    public getConfig(name: string): any {
        var config = this.get('config');
        return (typeof config !== 'undefined') && (typeof config[name] !== 'undefined') ? config[name] : false;
    }
}
