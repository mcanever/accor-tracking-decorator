import { logger } from "./logger";
import { utils } from "./utils";

// For historical reasons we store the client ID and linker param in two global variables
declare global {
    interface Window {
        ga: any
        JoAndJoeBooking_GUA_linkerParam: string|false
    }
}

// Ported in typescript-ish from accor-booking/booking.js
// Detects Google Analytics Client ID and Linker Param
export function detectGAParameters(cback: (params: {_ga: string|false}) => void, source: any = window): void {
    source.JoAndJoeBooking_GUA_ClientId = false;
    source.JoAndJoeBooking_GUA_linkerParam = false;
    let cbackParams:{ _ga: string|false} = {_ga: false};
    //Wait for ga() to be available and get clientId
    let clientIdInterval = setInterval(function() {
        if (typeof source.ga !== 'undefined') {
            source.ga(function() {
                let trackers = source.ga.getAll();
                // Get the client ID and Linker param from the first tracker
                if (typeof trackers[0] !== 'undefined') {
                    clearInterval(clientIdInterval);
                    clientIdInterval = null;
                    // linkerParam returned from the tracker will look like _ga=1231234.234234.5235
                    // We only need the value.
                    let linkerParam = trackers[0].get('linkerParam');
                    if (linkerParam) {
                        // Added to support gtag.js
                        const tuples = linkerParam.split('&');
                        linkerParam = tuples[0];
                        const parts = linkerParam.split('=');
                        if (parts.length == 2) {
                            linkerParam = parts[1];
                            source.JoAndJoeBooking_GUA_linkerParam = linkerParam;
                            cbackParams._ga = linkerParam;
                            logger.log('Detected linker param (_ga): ' + linkerParam);
                        }
                    }
                }
                cback(cbackParams);
            });
        }
    }, 200);

    //Cancel polling after 10 seconds (Google analytics may not be there or never load for some reason)
    //In this case we need to call the callback and dispatch the event anyways in case someone relies on this
    setTimeout(function() {
        if (typeof clientIdInterval !== 'undefined' && clientIdInterval !== null) {
            clearInterval(clientIdInterval);
            utils.dispatchEvent('accor_tracking_params_available');
            cback(cbackParams);
        }
    }, 10000);
}
