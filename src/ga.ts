import { logger } from "./logger";

// For historical reasons we store the client ID and linker param in two global variables
declare global {
    interface Window {
        ga: any
        AccorBooking_GUA_ClientId: string|false
        AccorBooking_GUA_linkerParam: string|false
    }
}

// Ported in typescript-ish from accor-booking/booking.js
// Detects Google Analytics Client ID and Linker Param
export function detectGAParameters(cback: (params: {gacid: string|false,  _ga: string|false}) => void): void {
    window.AccorBooking_GUA_ClientId = false;
    window.AccorBooking_GUA_linkerParam = false;
    let cbackParams:{gacid: string|false,  _ga: string|false} = {gacid: false, _ga: false};
    //Wait for ga() to be available and get clientId
    let clientIdInterval = setInterval(function() {
        if (typeof window.ga !== 'undefined') {
            window.ga(function() {
                let trackers = window.ga.getAll();
                // Get the client ID and Linker param from the first tracker
                if (typeof trackers[0] !== 'undefined') {
                    clearInterval(clientIdInterval);
                    clientIdInterval = null;
                    let clientId = trackers[0].get('clientId')
                    window.AccorBooking_GUA_ClientId = clientId;
                    cbackParams.gacid = clientId;
                    logger.log('Detected clientID (gacid): '+clientId);
                    // linkerParam returned from the tracker will look like _ga=1231234.234234.5235
                    // We only need the value.
                    let linkerParam = trackers[0].get('linkerParam');
                    if (linkerParam) {
                        var parts = linkerParam.split('=');
                        if (parts.length == 2) {
                            linkerParam = parts[1];
                            window.AccorBooking_GUA_linkerParam = linkerParam;
                            cbackParams._ga = clientId;
                            logger.log('Detected linker param (_ga): ' + linkerParam);
                        }
                    }
                }
                // Dispatch an event to notify that we have the tracking parameters available
                document.dispatchEvent(new Event('accor_tracking_params_available'));
                cback(cbackParams);
            });
        }
    }, 50);

    //Cancel polling after 10 seconds (Google analytics may not be there or never load for some reason)
    //In this case we need to call the callback and dispatch the event anyways in case someone relies on this
    setTimeout(function() {
        if (typeof clientIdInterval !== 'undefined' && clientIdInterval !== null) {
            clearInterval(clientIdInterval);
            document.dispatchEvent(new Event('accor_tracking_params_available'));
            cback(cbackParams);
        }
    }, 10000);
}