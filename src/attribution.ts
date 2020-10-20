import { utils } from "./utils";
import { logger } from "./logger";
import {TrackingParam, TrackingParams} from "./types/trackingparams";
import {Store} from "./store";

export class Attribution {
    public static detectAttributon(params: (keyof TrackingParams)[]) {
        const vars = utils.getUrlVars(this.getCurrentURL());
        const foundKeys = Object.keys(vars).filter((key) => params.indexOf(key as TrackingParam) !== -1);
        if (foundKeys.length > 0) {
            logger.log('Matching url Parameters found, clearing cookie', foundKeys);
            Store.clear();
            foundKeys.forEach((key) => Store.set(key, vars[key]));
        }
    }

    public static getCurrentURL() {
        return document.location.href;
    }
}
