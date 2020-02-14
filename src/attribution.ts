import { Store } from "./store";
import { TrackingParams } from "./types/trackingparams";
import { utils } from "./utils";
import { logger } from "./logger";

export class Attribution {
    public static getAttributionParams(referrer: string): TrackingParams {
        const params: TrackingParams = { sourceid: 'Direct_Access' };
        const vars = utils.getUrlVars();
        const url_sourceid = vars.sourceid || null;
        const cookie_sourceid = Store.get('sourceid');
        const has_utm_in_url = !!(vars.utm_source || vars.utm_campaign || vars.utm_medium);
        const empty_cookie_sourceid = !!cookie_sourceid;
        const cookie_sourceid_starts_with_utm = cookie_sourceid && /^UTM/.test(cookie_sourceid);
        const cookie_sourceid_starts_with_seo = cookie_sourceid && /^SEO/.test(cookie_sourceid);
        const cookie_sourceid_starts_with_direct = cookie_sourceid && /^Direct/.test(cookie_sourceid);
        const referrer_source = Attribution.detectReferrer(referrer);

        // If there is a sourceid parameter, stock the value in the cookie and replace the existing one.
        if (url_sourceid) {
            params.sourceid = url_sourceid;
            logger.log('sourceid from sourceid url parameter', params.sourceid);
        } else {
            //If there is a utm parameter AND (no value stocked in the cookie OR the value does not start with UTM, SEO or
            // Direct), stock a value that concatenates the parameters as follow: UTM|$utm_source|$utm_medium|$utm_campaign
            // where $utm_source, $utm_medium and $utm_campaign are the value of the corresponding url parameters.
            if (has_utm_in_url && (empty_cookie_sourceid || !(cookie_sourceid_starts_with_direct || cookie_sourceid_starts_with_seo || cookie_sourceid_starts_with_utm))) {
                params.sourceid = 'UTM|' + (vars.utm_source || '') + '|' + (vars.utm_medium || '') + '|' + (vars.utm_campaign || '');
                logger.log('sourceid from utm_ in url', params.sourceid);
            }

            // If there is a dclid parameter AND (no value stocked in the cookie OR the value starts with SEO or Direct) stock a
            // value UTM|DCLID
            else if (vars.dclid && (empty_cookie_sourceid || cookie_sourceid_starts_with_seo || cookie_sourceid_starts_with_direct)) {
                params.sourceid = 'UTM|' + vars.dclid ;
                logger.log('sourceid from dclid in url', params.sourceid);
            }

            //If there is a gclid parameter AND (no value stocked in the cookie OR the value starts with SEO or Direct) stock a
            // value UTM|GCLID
            else if (vars.gclid && (empty_cookie_sourceid || cookie_sourceid_starts_with_seo || cookie_sourceid_starts_with_direct)) {
                params.sourceid = 'UTM|' + vars.gclid ;
                logger.log('sourceid from gclid in url', params.sourceid);
            }

            //If there is no sourceid AND no utm parameter AND the referrer match one the top 10 search engine (Google, bing,
            // Yahoo, Baidu, Yandex.ru, DuckDuckGo, Ask.com, AOL.com, WolframAlpha, Internet Archive) or the top 10 social media
            // network (Facebook, GQ, Instagram, QZONE, Tumblr, Twitter, Baidu, Sina Weibo, Snapchat) the value will be respectively
            // SEO_$SEARCHENGINE OR SOCIAL_$SOCIALNAME (where $SEARCHENGINE and $SOCIALNAME are the UPPERCASE name of the source)
            else if (empty_cookie_sourceid && !has_utm_in_url && referrer_source !== '') {
                params.sourceid = referrer_source;
                logger.log('sourceid from referrer', params.sourceid);
            } else if (!empty_cookie_sourceid) {
                // Finally use the value from the cookie if not empty
                params.sourceid = cookie_sourceid;
            }
        }
        // Save in cookie
        Store.set('sourceid', params.sourceid);
        return params;
    }

    public static detectReferrer(referrer: string): string {
        // No need to run all those RegExes if referrer is empty
        if (referrer === '') {
            return '';
        }

        const topReferrers: any = {
            SOCIAL: {
                FACEBOOK: /^https?:\/\/(www\.)?facebook\.com\/.*$/i,
                QZONE: /^https?:\/\/qzone\.qq\.com(\/.*)?$/i,
                QQ: /^https?:\/\/([a-z]+\.)?qq\.com(\/.*)?$/i,
                INSTAGRAM: /^https?:\/\/(www\.)?instagram\.com\/.*$/i,
                TUMBLR: /^https?:\/\/(www\.)?tumblr\.com\/.*$/i,
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
                YAHOO: /^https?:\/\/([a-z]+\.)?yahoo\.(com|co.jp)(\/.*)?$/i,
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
                            return category + '_' + name;
                        }
                    }
                }
            }
        }

        // If we get here we didn't find a matching referrer
        return '';
    }
}