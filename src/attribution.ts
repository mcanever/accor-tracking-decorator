import { Store } from "./store";
import { utils } from "./utils";
import { logger } from "./logger";

export class Attribution {
    public static getScore(data: { sourceid: string, merchantid: string| undefined }): 3|2|1 {
        const hasBoth = !!data.sourceid && !! data.merchantid;
        return hasBoth &&/^(ppc-|dis-|sop-)/.test(data.merchantid) && 3 || (hasBoth || /^(ml-)/.test(data.sourceid) ) && 2 || 1;
    }

    public static detectAttributonFromReferrer(referrer: string): { sourceid: string, merchantid: string|undefined} {
        const vars = utils.getUrlVars(this.getCurrentURL());
        const url_sourceid = vars.sourceid || null;
        const url_merchantid = vars.merchantid || null;
        const has_url_merchantid_and_sourceid = !!url_sourceid && !!url_merchantid;

        //Attribution rules - calculate score for cookies and url parameters values.
        const get_url_utm_source = !!vars.utm_source && vars.utm_source || vars.dclid && 'dclid' || vars.gclid && 'gclid' || null  ;

        const referrer_source = this.detectReferrer(referrer);

        //Inital values
        let sourceid = 'Direct_Access';
        let merchantid: undefined | string;

        //Apply attributions rules based on previous scoring
        if (has_url_merchantid_and_sourceid ) {
            sourceid = url_sourceid;
            merchantid = url_merchantid;
            logger.log('sourceid from sourceid url parameter', sourceid);
            logger.log('merchantid from merchantid url parameter', merchantid);
        }


        //Fallback when the campaign is tracked but does not follow central standards.
        else if (get_url_utm_source) {
            sourceid = 'UTM_' + get_url_utm_source;
            logger.log('sourceid from utm|dclid|gclid in url', sourceid);
        }


        //If no paid tracking parameters, the sourceid parameter will be defined by a referrer matching: one the top 10 search engine (Google, bing,Yahoo, Baidu, Yandex.ru, DuckDuckGo, Ask.com, AOL.com, WolframAlpha, Internet Archive)
        // or the top 10 social media network (Facebook, GQ, Instagram, QZONE, Tumblr, Twitter, Baidu, Sina Weibo, Snapchat)
        // the value will be respectively: SEO_$SEARCHENGINE OR SOCIAL_$SOCIALNAME (where $SEARCHENGINE and $SOCIALNAME are the UPPERCASE name of the source)
        else if (referrer_source !== null) {
                sourceid = referrer_source.category + '_' + referrer_source.name;
                logger.log('sourceid from referrer', sourceid);
        }

        sourceid = utils.normalizeString(sourceid);
        merchantid = !!merchantid && utils.normalizeString(merchantid);


        return { sourceid, merchantid };
    }

    public static detectReferrer(referrer: string): { category: string, name: string } {
        // No need to run all those RegExes if referrer is empty or same hostname as our page.
        if (referrer === '' || referrer.toLowerCase().indexOf(Attribution.getOrigin()) === 0) {
            return null;
        }

        const topReferrers: any = {
            SOCIAL: {
                FACEBOOK: /^https?:\/\/(www\.)?facebook\.com\/.*$/i,
                QZONE: /^https?:\/\/[a-z0-9.]+qzone\.qq\.com(\/.*)?$/i,
                QQ: /^https?:\/\/([a-z]+\.)?qq\.com(\/.*)?$/i,
                INSTAGRAM: /^https?:\/\/(www\.)?instagram\.com\/.*$/i,
                TUMBLR: /^https?:\/\/(www\.|[a-zA-Z0-9-_\.]+)?tumblr\.com\/.*$/i,
                TWITTER: /^https?:\/\/(www\.)?twitter\.com\/.*$/i,
                BAIDU: /^https?:\/\/(www\.)?tieba\.baidu\.com\/.*$/i,
                WEIBO: /^https?:\/\/(www\.)?weibo\.com\/.*$/i,
                SNAPCHAT: /^https?:\/\/(www\.)?snapchat\.com\/.*$/i,
                VKONTAKTE: /^https?:\/\/(www\.)?vk\.com\/.*$/i,
                PINTEREST: /^https?:\/\/(www\.)?pinterest\.com\/.*$/i,
                LINKEDIN: /^https?:\/\/(www\.)?linkedin\.com\/.*$/i,
                REDDIT: /^https?:\/\/(www\.)?reddit\.com\/.*$/i,
            },
            SEO: {
                GOOGLE: /^https?:\/\/(www\.)?google\.[a-z.]+(\/.*)?$/i,
                BING: /^https?:\/\/(www\.)?bing\.com\/.*$/i,
                YAHOO: /^https?:\/\/([a-z.]+)?yahoo\.(com|co.jp)(\/.*)?$/i,
                BAIDU: /^https?:\/\/(www\.)?baidu\.com\/.*$/i,
                YANDEX: /^https?:\/\/(www\.)?yandex\.(com|ru)(\/.*)?$/i,
                DUCKDUCKGO: /^https?:\/\/(www\.)?duckduckgo\.com(\/.*)?$/i,
                ASK: /^https?:\/\/([a-z]+\.)?ask\.com(\/.*)?$/i,
                AOL: /^https?:\/\/(search\.aol|aol|www\.aol|www\.aolsearch)\.com(\/.*)?$/i,
                WOLFRAMALPHA: /^https?:\/\/(www\.)?wolframalpha\.com(\/.*)?$/i,
                ARCHIVE: /^https?:\/\/([a-z]+\.)?archive\.org(\/.*)?$/i,
            }
        };

        for (let category in topReferrers) {
            if (topReferrers.hasOwnProperty(category)) {
                const section = topReferrers[category];
                for (let name in section) {
                    if (section.hasOwnProperty(name)) {
                        const regexp = section[name] as RegExp;
                        if (regexp.test(referrer)) {
                            logger.log('Detected known referrer', category, name);
                            return { category, name };
                        }
                    }
                }
            }
        }

        // If we get here we didn't find a matching referrer
        return null;
    }

    public static getOrigin(): string {
        return document.location.origin.toLowerCase();
    }

    public static getCurrentURL() {
        return document.location.href;
    }
}
