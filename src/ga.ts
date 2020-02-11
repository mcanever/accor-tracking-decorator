import { logger } from "./logger";

declare global {
    interface Window {
        ga: any
        AccorBooking_GUA_ClientId: string|false
        AccorBooking_GUA_linkerParam: string|false
    }
}

export function detectGAParameters(cback: (params: {gacid: string|false,  _ga: string|false}) => void): void {
    let cbackParams:{gacid: string|false,  _ga: string|false} = {gacid: false, _ga: false};
    //Wait for ga() to be available and get clientId
    let clientIdInterval = setInterval(function() {
        if (typeof window.ga !== 'undefined') {
            clearInterval(clientIdInterval);
            clientIdInterval = null;
            window.ga(function() {
                let trackers = window.ga.getAll();
                if (typeof trackers[0] !== 'undefined') {
                    let clientId = trackers[0].get('clientId')
                    window.AccorBooking_GUA_ClientId = clientId;
                    cbackParams.gacid = clientId;
                    logger.log('Detected clientID (gacid): '+clientId);
                    let linkerParam = trackers[0].get('linkerParam');
                    if (linkerParam) {
                        var parts = linkerParam.split('=');
                        if (parts.length == 2) {
                            linkerParam = parts[1];
                            window.AccorBooking_GUA_linkerParam = linkerParam;
                            cbackParams._ga = clientId;
                            logger.log('Detected linker param (_ga): ' + linkerParam);
                            document.body.dispatchEvent(new Event('accor.tracking_params_available'));
                        }
                    }
                }
                cback(cbackParams);
            });
        }
    }, 50);
    //Give up after 10 seconds
    setTimeout(function() {
        if (typeof clientIdInterval !== 'undefined' && clientIdInterval !== null) {
            clearInterval(clientIdInterval);
            window.AccorBooking_GUA_ClientId = false;
            window.AccorBooking_GUA_linkerParam = false;
            document.body.dispatchEvent(new Event('accor.tracking_params_available'));
            cback(cbackParams);
        }
    }, 10000);
}