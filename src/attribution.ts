import { Store } from "./store";
import {TrackingParams } from "./types/trackingparams";
import { utils } from "./utils";
import {logger} from "./logger";

export class Attribution {
    public static testStore() {
        const testKey = 'àè+&a___345';
        const testValue = '!"£$%=)(/&%&///';
        Store.set(testKey, testValue);
        const readValue = Store.get(testKey);
        logger.log(testValue, readValue, testValue === readValue);
    }
}