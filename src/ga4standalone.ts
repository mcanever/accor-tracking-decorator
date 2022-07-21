declare global {
    interface Window {
        _GA4CrossDomain: any;
    }
}

import {GA4CrossDomain} from "./ga4";

window._GA4CrossDomain = GA4CrossDomain;