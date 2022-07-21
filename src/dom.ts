export function dispatchEvent(type: string, target?: any, detail?: any) {
    target = target || document;
    let event: any;
    if(typeof(Event) === 'function') {
        event = new Event(type);
    } else {
        event = document.createEvent('Event');
        event.initEvent(type, true, true);
    }
    if (typeof detail !== 'undefined') {
        event.detail = detail;
    }
    target.dispatchEvent(event);
}
