import { Attribution } from "../src/attribution";
import { expect } from 'chai';

describe('Attribution', () => {
    let oldFn: () => string;
    before(() => {
        oldFn = Attribution.getOrigin;
        Attribution.getOrigin = () => 'NotARealOrigin';
    });

    after(() => {
        Attribution.getOrigin = oldFn;
    });

    describe('detectReferrer', () => {
        // TODO: Add many more urls based on more research
        const validURLs:any = {
            SOCIAL: {
                FACEBOOK: ['https://www.facebook.com/MercureHotels.it/?brand_redir=279349972238988'],
                QZONE: ['https://80111664.qzone.qq.com/311'],
                QQ: ['https://new.qq.com/omn/20200218/20200218A0RSR400.html'],
                INSTAGRAM: ['https://www.instagram.com/pullmandubaidcc/'],
                TUMBLR: ['https://harrystylesdaily.tumblr.com/post/190897784499/harry-arriving-at-the-brit-awards-february-18'],
                TWITTER: ['https://twitter.com/ecstasy_path/status/1140829001490894849'],
                BAIDU: ['https://tieba.baidu.com/p/6486965101'],
                WEIBO: ['https://www.weibo.com/chinanewsweek'],
                SNAPCHAT: ['https://www.snapchat.com/asd?sdf1=234'],
                VKONTAKTE: ['https://vk.com/europaplus?w=wall-19043_3427997'],
                PINTEREST: ['https://www.pinterest.com/qvc/sweet-treats-easy-dessert-recipes/'],
                LINKEDIN: ['https://www.linkedin.com/slink?code=dZhKEx5'],
                REDDIT: ['https://www.reddit.com/r/tifu/comments/f67t7h/tifu_by_craving_salad_and_triggering_a_traumatic/'],
            },
            SEO: {
                GOOGLE: ['https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=6&cad=rja&uact=8&ved=2ahUKEwiI54329d3nAhXcQEEAHXd-B9gQFjAFegQIMBAB&url=https%3A%2F%2Fwww.weibo.com%2Fchinanewsweek&usg=AOvVaw2alf5_Ojlq-B7-mkLXSvi5'],
                BING: ['https://www.bing.com/search?q=sdgty&qs=n&form=QBRE&sp=-1&pq=sdgty&sc=8-5&sk=&cvid=D0159DB7EDDC4FBFA7EC2BCEF1D99C32'],
                YAHOO: ['https://it.search.yahoo.com/search;_ylt=AwrP4o24VU1euQwA7HQaDQx.;_ylc=X1MDMjExNDcxOTAwMgRfcgMyBGZyAwRncHJpZAN2ZHBEdTd5QVFER3VaM1RGMEpHek1BBG5fcnNsdAMwBG5fc3VnZwM4BG9yaWdpbgNpdC5zZWFyY2gueWFob28uY29tBHBvcwMwBHBxc3RyAwRwcXN0cmwDBHFzdHJsAzYEcXVlcnkDc2Rmc2RmBHRfc3RtcAMxNTgyMTI2NTM5?fr2=sb-top-it.search&p=sdfsdf&fr=sfp&iscqry='],
                BAIDU: ['http://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=1&tn=baidu&wd=tienanmen%20square&rsv_pq=cde813a50000393d&rsv_t=3c88Hw1NxzHHNN%2Bd5FsLHts3wM0Jp41kZe7uB2dUt8SDFmfWQiK%2B6szqKwg&rqlang=cn&rsv_enter=1&rsv_dl=tb&rsv_sug3=32&rsv_sug1=1&rsv_sug7=100&rsv_sug2=0&inputT=6531&rsv_sug4=6531'],
                YANDEX: ['https://yandex.com/search/?text=peperoni&lr=116513'],
                DUCKDUCKGO: ['https://duckduckgo.com/?q=bauhaus&t=h_&ia=web'],
                ASK: ['https://it.ask.com/web?q=potato&qsrc=0&o=0&l=dir&qo=homepageSearchBox'],
                AOL: ['https://search.aol.com/aol/search;_ylt=AwrE19CNVk1eTjQAdU9oCWVH;_ylc=X1MDMTE5NzgwMzg4MARfcgMyBGZyAwRncHJpZAM0emF2Tkw0S1QuZWJTdVdFSDkwLnpBBG5fcnNsdAMwBG5fc3VnZwMxMARvcmlnaW4Dc2VhcmNoLmFvbC5jb20EcG9zAzAEcHFzdHIDBHBxc3RybAMEcXN0cmwDNgRxdWVyeQNiYW5hbmEEdF9zdG1wAzE1ODIxMjY3Mzg-?fr2=sb-top-&q=banana&v_t=na&s_it=sb-home&iscqry='],
                WOLFRAMALPHA: ['https://www.wolframalpha.com/input/?i=grand+mercure'],
                ARCHIVE:['http://web.archive.org/web/20170225095117/http://www.pullmanhotels.com/gb/usa/index.shtml'],
            },
            Direct: {
                Access: ['']
            }
        };

        for (let category in validURLs) {
            if (validURLs.hasOwnProperty(category)) {
                const section = validURLs[category];
                for (let name in section) {
                    if (section.hasOwnProperty(name)) {
                        const URLstoTest = section[name] as string[];
                        URLstoTest.forEach((URLtoTest) => {
                            const URLtoTestReduced = URLtoTest.slice(0,70) + '...';
                            const sourceid = category + '_' + name ;
                            it('Should detect ' + sourceid + ' if the referrer is "' + URLtoTestReduced + '"', () => {
                                const res = Attribution.detectReferrer(URLtoTest);
                                if (URLtoTest == '') {
                                    expect(res).to.be.null;
                                } else {
                                    expect(res).to.not.be.null;
                                    expect(res.name).to.be.eq(name);
                                    expect(res.category).to.be.eq(category);
                                }
                            });

                        });
                    }
                }
            }
        }
    });
});
