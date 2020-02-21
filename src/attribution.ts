import { Store } from "./store";
import { utils } from "./utils";
import { logger } from "./logger";

export class Attribution {
    public static getSourceId(referrer: string): string {
        let sourceid = 'Direct_Access';
        const vars = utils.getUrlVars(Attribution.getCurrentURL());
        const url_sourceid = vars.sourceid || null;
        const cookie_sourceid = Store.get('sourceid');
        const has_utm_in_url = !!(vars.utm_source || vars.utm_campaign || vars.utm_medium);
        const empty_cookie_sourceid = !!cookie_sourceid;
        const cookie_sourceid_starts_with_sid = cookie_sourceid && /^SID/.test(cookie_sourceid);
        const cookie_sourceid_starts_with_utm = cookie_sourceid && /^UTM/.test(cookie_sourceid);
        const referrer_source = Attribution.detectReferrer(referrer);

        let saveInCookie = true;

        // If there is a sourceid parameter, stock the value in the cookie and replace the existing one as follow:
        //SID_$sourceid where $sourceid is the value of the corresponding url parameter.
        if (url_sourceid ) {
            sourceid = 'SID_' +  url_sourceid;
            logger.log('sourceid from sourceid url parameter', sourceid);
        }

        // If the value stocked in the cookie starts with SID
        else if (cookie_sourceid_starts_with_sid) {
            sourceid = cookie_sourceid;
            saveInCookie = false;
            logger.log('sourceid from sourceid cookie with SID', sourceid);
        } else {
            //If there is a utm parameter (and no value stocked in the cookie or its value does not start with SID because of the last two if statement),
            //stock a value that concatenates the parameters as follow: UTM_$utm_source_$utm_medium_$utm_campaign
            //where $utm_source, $utm_medium and $utm_campaign are the value of the corresponding url parameters.
            if (has_utm_in_url) {
                sourceid = 'UTM_' + (vars.utm_source || '') + '_' + (vars.utm_medium || '') + '_' + (vars.utm_campaign || '');
                logger.log('sourceid from utm_ in url', sourceid);
            }

            // If there is a dclid parameter (and no utm, no value stocked in the cookie or its value does not starts with SID),
            //stock a value "UTM_DCLID"
            else if (vars.dclid ) {
                sourceid = 'UTM_DCLID';
                logger.log('sourceid from dclid in url', sourceid);
            }

            //If there is a gclid parameter (and no utm, no value stocked in the cookie or its value does not starts with SID),
            // value UTM_GCLID
            else if (vars.gclid) {
                sourceid = 'UTM_GCLID';
                logger.log('sourceid from gclid in url', sourceid);
            }

            //If the cookie value starts with UTM keeps its value
            else if (cookie_sourceid_starts_with_utm) {
                sourceid = cookie_sourceid;
                saveInCookie = false;
                logger.log('sourceid from sourceid cookie with UTM', sourceid);
            }

            //If the referrer match one the top 10 search engine (and there is there is no sourceid and no utm parameter in both cookie and url parameters and no gclid or dclid parameters)
            //(Google, bing,Yahoo, Baidu, Yandex.ru, DuckDuckGo, Ask.com, AOL.com, WolframAlpha, Internet Archive) or the top 10 social media
            // network (Facebook, GQ, Instagram, QZONE, Tumblr, Twitter, Baidu, Sina Weibo, Snapchat) the value will be respectively
            // SEO_$SEARCHENGINE OR SOCIAL_$SOCIALNAME (where $SEARCHENGINE and $SOCIALNAME are the UPPERCASE name of the source)
            else if (referrer_source !== null) {
                sourceid = referrer_source.category + '_' + referrer_source.name;
                logger.log('sourceid from referrer', sourceid);
            } else if (!empty_cookie_sourceid) {
                // Last chance: use the value from the cookie if not empty
                sourceid = cookie_sourceid;
                saveInCookie = false;
                logger.log('sourceid from cookie value', sourceid);
            }
        }
        sourceid = utils.normalizeString(sourceid);

        // Save in cookie
        if (saveInCookie) {
            Store.set('sourceid', sourceid);
        }
        return sourceid;
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
