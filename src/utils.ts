import Cookies from 'js-cookie';
import {dispatchEvent, parseUrlParts, normalizeString, getUrlVars, onDomReady, getElapsedMS, areReferrerAndLocationEqual} from "./dom";

export const utils = {
    Cookies: Cookies,
    getUrlVars,
    normalizeString,
    parseUrlParts,
    dispatchEvent,
    areReferrerAndLocationEqual,
    getElapsedMS,
    onDomReady
};
