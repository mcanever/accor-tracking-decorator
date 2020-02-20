/**
 * Wrapper for console.log. To be used as a "singleton", set enabled to true to enable logging to console.
 */

export default class Logger {
    public enabled = false;

    public log(...args: any[]) {
        if (this.enabled) {
            console.log.apply(this, args);
        }
    }

    public alwaysLog(...args: any[]) {
        console.log.apply(this, args);
    }
}
export const logger =
    new Logger();
