/**
 * Wrapper for console.log. To be used as a "singleton", set enabled to true to enable logging to console.
 */

export default class Logger {
    public debug = false;
    public logSuccessMessages = true;

    public log(...args: any[]) {
        if (this.debug && console && console.log) {
            console.log.apply(this, args);
        }
    }

    public success(...args: any[]) {
        if (this.logSuccessMessages && console && console.log) {
            console.log.apply(this, args);
        }
    }

    public alwaysLog(...args: any[]) {
        console.log.apply(this, args);
    }
}
export const logger =
    new Logger();
