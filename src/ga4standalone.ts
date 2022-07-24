import {logger} from "./logger";

declare global {
    interface Window {
        _GA4CrossDomain: any;
        _GA4CrossDomain_ReadyCallback: (_gl: string | false) => void
        _GA4CrossDomain_Debug: boolean
    }
}

import {GA4CrossDomain} from "./ga4";
if (typeof window._GA4CrossDomain === 'undefined') {
    logger.debug = typeof window._GA4CrossDomain_Debug !== 'undefined' && window._GA4CrossDomain_Debug;
    window._GA4CrossDomain = new GA4CrossDomain();
    window._GA4CrossDomain.detectGA4CrossDomainParam((_gl: string | false) => {
        if (typeof window._GA4CrossDomain_ReadyCallback === 'function') {
            window._GA4CrossDomain_ReadyCallback(_gl);
        }
    }, window);
}
