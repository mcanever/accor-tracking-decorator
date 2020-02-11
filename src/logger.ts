export default class Logger {
    public enabled = false;

    public log(...args: any[]) {
        if (this.enabled) {
            console.log.apply(this, args);
        }
    }
}
export const logger = new Logger();
