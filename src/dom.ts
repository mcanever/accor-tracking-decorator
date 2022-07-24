const initialDateObj: Date = new Date();

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

export function getUrlVars(url: string) {
    let vars: any = {};
    const parts = url
        .replace(/#.*?$/g, '')
        .replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            (substring: string, key: string, value: string) => {
                vars[key] = decodeURIComponent(value);
                return substring;
            });
    return vars;
}

export function normalizeString(str: string): string {
    if (typeof str != "string") {
        return undefined;
    }
    if (str.match(/^[a-zA-Z0-9-._$@'"()\[\]]{1,120}$/)) {
        return str;
    }

    // Fix accented chars
    const accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
    const accentsOut = 'AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz';
    let map: any = {};
    for (let i = 0; i < accents.length; i++) {
        map[accents.charAt(i)] = accentsOut.charAt(i);
    }
    str = str.replace(new RegExp('[' + accents + ']', 'g'), (c) => {
        return (typeof map[c] !== 'undefined' ? map[c] : c);
    });

    // Remove all unsupported characters
    str = str.replace(/[^a-zA-Z0-9-._$@'"()\[\] ]/g, '');

    // Replace space sequences with a dash
    str = str.replace(/\s+/g, '-');

    // Limit maximum length to 120 characters
    str = str.slice(0, 120);

    return str;
}

export function parseUrlParts(href: string): any {
    var l = document.createElement("a");
    l.href = href;
    return l;
}

export function onDomReady(callback: () => void) {
    if (document.readyState != "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

export function getElapsedMS(): number {
    const now = new Date();
    return now.getTime() - initialDateObj.getTime();
}

export function areReferrerAndLocationEqual(referrer: string): boolean {
    // We aren't using new URL() because of browser compatibility
    try {
        let referrerOrigin = '';
        if (/^https?:\/\//.test(referrer)) {
            const url = parseUrlParts(referrer);
            referrerOrigin = url.origin;
        }
        return (referrerOrigin === location.origin);
    } catch (invalid_url_error) {
        return false;
    }
}