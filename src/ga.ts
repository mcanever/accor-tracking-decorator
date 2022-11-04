import { logger } from "./logger";
import { utils } from "./utils";

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
export function detectGAParameters(cback: (params: {gacid: string|false, _ga: string|false, _gac: string|false, _gcl: string|false}) => void, source: any = window): void {
    source.AccorBooking_GUA_ClientId = false;
    source.AccorBooking_GUA_linkerParam = false;

    let cbackParams:{gacid: string|false, _ga: string|false, _gac: string|false, _gcl: string|false} = {gacid: false, _ga: false, _gac: false, _gcl: false};
    //Wait for ga() to be available and get clientId
    let clientIdIntervalCounter = 0;
    let lock = false;

    const searchForGaDecoratorParams = () => {
        // logger.log ('searchForGaDecoratorParams', clientIdIntervalCounter);
        clientIdIntervalCounter++;
        if (typeof source.ga !== 'undefined') {
            // logger.log('ga() found!');
            if (
                (  typeof clientIdInterval !== 'undefined' &&
                    typeof source.AccorBooking_GUA_ClientId !== 'undefined' && source.AccorBooking_GUA_ClientId != ''  &&
                    typeof source.AccorBooking_GUA_linkerParam !== 'undefined' && source.AccorBooking_GUA_linkerParam != '' ) ||
                clientIdIntervalCounter > 4000 // 10 minutes
            ) {
                if (clientIdIntervalCounter > 4000) {
                    logger.log('Google Analytics decorator failed after 10 minutes');
                }
                clearInterval(clientIdInterval);
                return;
            }

            // We need a lock because ga() callbacks runs async and in some cases complete after > 1000ms
            if (!lock) {
                lock = true;
                // logger.log ('lock at', utils.getElapsedMS() );
                setTimeout (function () {
                    // logger.log('call ga(...)');
                    source.ga(function() {
                        // logger.log ('unlock at', utils.getElapsedMS() );
                        lock = false;
                        const trackerToUse = location.href.indexOf('useSecondTrackerToDecorate') !== -1 ? 1 : 0;
                        const trackers = source.ga.getAll();
                        if (typeof trackers[trackerToUse] !== 'undefined') {
                            const clientId = trackers[trackerToUse].get('clientId');
                            source.AccorBooking_GUA_ClientId = clientId;
                            cbackParams.gacid = clientId;
                            logger.success('Detected clientID (gacid): ' + clientId);
                            let linkerParam = trackers[trackerToUse].get('linkerParam');
                            if (linkerParam) {
                                const qsChunks: string[] = linkerParam.split('&');
                                if (qsChunks.length > 0) {
                                    qsChunks.forEach((chunk: string) => {
                                        const parts = chunk.split('=');
                                        if (parts.length > 1) {
                                            const paramName = parts[0];
                                            const paramValue = parts[1];
                                            if (paramName === '_ga') {
                                                source.AccorBooking_GUA_linkerParam = paramValue;
                                                cbackParams._ga = paramValue;
                                            }
                                            if (paramName === '_gac') {
                                                cbackParams._gac = paramValue;
                                            }
                                            if (paramName === '_gcl') {
                                                cbackParams._gcl = paramValue;
                                            }
                                        }
                                    });
                                    let foundParams: any = {};
                                    Object.keys(cbackParams).forEach((k) => {
                                        if ((cbackParams as any)[k] !== false) {
                                            foundParams[k] = (cbackParams as any)[k];
                                        }
                                    });
                                    logger.success ('Detected linker params (' + Object.keys(foundParams).join(', ') + '): ', foundParams);
                                    logger.log ('Detected GA parameters after (ms): ', utils.getElapsedMS());
                                } else {
                                    logger.log('WARN likerParam format Error', linkerParam)
                                }
                            } else {
                                logger.log('WARN no linkerParam');
                            }
                            // Dispatch an event to notify that we have the tracking parameters available
                            utils.dispatchEvent('accor_tracking_params_available');
                            cback(cbackParams);
                        } else {
                            logger.log('WARN trackers['+trackerToUse+'] undefined');
                        }
                    });
                }, 10);
            }
        } else {
            // logger.log('ga() not found yet');
        }
    };

    // run immediately then start retrying
    // logger.log('START GA Params detection');
    searchForGaDecoratorParams();
    let clientIdInterval = setInterval(searchForGaDecoratorParams, 150);

    //Give up after 10 minutes
    setTimeout(function() {
        if (typeof clientIdInterval !== 'undefined') {
            logger.log('giving up GA params detection');
            clearInterval(clientIdInterval);
            utils.dispatchEvent('accor_tracking_params_available');
            cback(cbackParams);
        }
    }, 600000);
};
