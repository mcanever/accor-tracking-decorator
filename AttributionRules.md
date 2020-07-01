
## Attribution rules

The main element of complexity of this script is the calculation of the `sourceid` parameter based
on the attribution rules defined by Accor. The Source ID is stored in a cookie for 30 days. 

If the value stocked in the cookie starts with SID, the value of the cookie is used as source id.

Else, if the current page URL has utm parameters (and no value stocked in the cookie or its value 
does not start with SID), the script stocks a value that concatenates the parameters as follow: 

`UTM_$utm_source_$utm_medium_$utm_campaign`

where $utm_source, $utm_medium and $utm_campaign are the value of the corresponding url parameters.
That value is used as sourceid. 

If there is a `dclid` parameter in the page URL (and no utm, no value stocked in the cookie or its 
value does not start with SID), the script stocks a value `UTM_DCLID` and uses it as sourceid.

If there is a `gclid` parameter in the page URL (and no utm, no value stocked in the cookie or its 
value does not start with SID), the script stocks a value `UTM_GCLID` and uses it as sourceid.

If the cookie value starts with UTM, the script will just use its value as sourceID

If none of the above rules are matched:

If the referrer match one the top 10 search engine (and there is there is no sourceid and no utm parameter 
in both cookie and url parameters and no gclid or dclid parameters) (Google, bing,Yahoo, Baidu, Yandex.ru, 
DuckDuckGo, Ask.com, AOL.com, WolframAlpha, Internet Archive) or the top 13 social media network (Facebook, 
QQ, Instagram, QZONE, Tumblr, Twitter, Baidu, Sina Weibo, Snapchat, VK, Linkedin, Reddit) the sourceid will 
be respectively `SEO_$SEARCHENGINE` OR `SOCIAL_$SOCIALNAME` (where $SEARCHENGINE and $SOCIALNAME are the 
UPPERCASE name of the source)