import { logger } from "./logger";
import { utils } from "./utils";

export class Store {
    public static cookie_name = '_AccorTrackingDecoratorData';
    public static cookie_duration = 30;

    public static encode(s: string): string {
        return (typeof btoa === 'function') ? btoa(s) : s;
    }

    public static decode(s: string): string {
        return (typeof atob === 'function') ? atob(s) : s;
    }

    static getDecodedCookieValue(): any {
        const raw = utils.Cookies.get(Store.cookie_name);
        if (raw) {
            try {
                const val = JSON.parse(Store.decode(raw));
                return (typeof val === 'object') ? val : {};
            } catch (e) {
                logger.log('Error parsing cookie', Store.cookie_name, raw, e);
            }
        }
        return {};
    }

    static saveToCookie(val: any): void {
        const encoded = Store.encode(JSON.stringify(val));
        utils.Cookies.set(Store.cookie_name, encoded, { expires: Store.cookie_duration });
    }

    public static get(key: string): any {
        let store = Store.getDecodedCookieValue();
        return ( typeof store[key] !== 'undefined' ) ? store[key] : null;
    }

    public static set(key: string, value: any): void {
        let store = Store.getDecodedCookieValue();
        store[key] = value;
        Store.saveToCookie(store);
    }
}