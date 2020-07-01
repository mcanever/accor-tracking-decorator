import { Namespace } from '../src/namespace';
import { Decorator } from '../src/decorator';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Attribution } from '../src/attribution';
import { utils } from '../src/utils';
//@ts-ignore
import * as url from 'url';

declare var global: any;

describe('Decorator', () => {
  let namespace: Namespace;
  let nsSource: any;
  const sandbox = sinon.createSandbox();
  beforeEach(() => {
    sandbox.restore();
    sandbox.stub(utils, 'dispatchEvent').callsFake(() => {});
    nsSource = {_AccorTrackingDecorator: {config: {}}};
    namespace = new Namespace(nsSource);
    global.document = {
      referrer: '',
      location: {
        origin: '',
        href: ''
      }
    };
  });
  describe('constructor', () => {
    describe('initConfig', () => {
      it('should initialize config with default values', () => {
        const d = new Decorator(namespace);
        expect(d.config.merchantid).eq('');
        expect(d.config.hotelID).eq('');
        expect(d.config.autoDecorate).eq(false);
        expect(d.config.debug).eq(false);
        expect(d.config.handleGoogleAnalytics).eq(false);
        expect(d.config.testReferrer).eq('');
        expect(d.config.domainsToDecorate).deep.eq([
           /^all\.accor\.com$/, /accorhotels.com$/
        ]);
      });
      it('handles merchant id', () => {
        nsSource._AccorTrackingDecorator.config.merchantid = 'meow';
        const d = new Decorator(namespace);
        expect(d.config.merchantid).eq('meow');
      });
      it('handles hotel id and derives merchant', () => {
        nsSource._AccorTrackingDecorator.config.hotelID = 'MEOW';
        const d = new Decorator(namespace);
        expect(d.config.hotelID).eq('MEOW');
        expect(d.config.merchantid).eq('MS-MEOW');
      });
      it('should honorate debug, autoDecorate and handleGoogleAnalytics', () => {
        nsSource._AccorTrackingDecorator.config.autoDecorate = true;
        nsSource._AccorTrackingDecorator.config.debug = true;
        nsSource._AccorTrackingDecorator.config.handleGoogleAnalytics = true;
        const d = new Decorator(namespace);
        expect(d.config.autoDecorate).eq(true);
        expect(d.config.debug).eq(true);
        expect(d.config.handleGoogleAnalytics).eq(true);
      });
      it('should honorate the domainsToDecorate Regexp list', () => {
        nsSource._AccorTrackingDecorator.config.domainsToDecorate = [
          /a/,/b/
        ];
        const d = new Decorator(namespace);
        expect(d.config.domainsToDecorate).deep.eq([/a/,/b/]);
      })
    });
    describe('trackingParams', () => {
      it('should initializa peroperly the ga utm params', () => {
        nsSource._AccorTrackingDecorator.config.hotelID = 'meow';
        const d = new Decorator(namespace);
        expect(d.trackingParams.utm_source).eq('hotelwebsite_MEOW');
        expect(d.trackingParams.utm_campaign).eq('hotel_website_search');
        expect(d.trackingParams.utm_medium).eq('accor_regional_websites');
      });
      // it('should handleGa if requested', () => {
      //   nsSource._AccorTrackingDecorator.config.handleGoogleAnalytics = true;
      //   const d = new Decorator(namespace);
      //   expect(d.trackingParams.gacid)
      // });
      it('should use Attribution to properly identify referrer', () => {
        const stub = sandbox.stub(Attribution, 'detectAttributonFromReferrer').returns({sourceid: 'newSourceId', merchantid: undefined });
        global.document.referrer = 'http://referrer.com';
        const d = new Decorator(namespace);
        expect(stub.calledWith('http://referrer.com')).true;
        expect(d.trackingParams.sourceid).eq('newSourceId');
      });
    })
  });
  describe('decorateObject', () => {
    beforeEach(() => {
      nsSource._AccorTrackingDecorator.config.hotelID = 'HOTELID';
      global.document.referrer = 'http://referrer.com';
    });
    it('should populate object with tracking parameters', () => {
      const d = new Decorator(namespace);
      const oibj = {};
      expect(d.decorateObject(oibj)).deep.eq(oibj);
      expect(oibj).to.deep.eq({
        merchantid: 'MS-HOTELID',
        sourceid: 'Direct_Access',
        utm_campaign: 'hotel_website_search',
        utm_medium: 'accor_regional_websites',
        utm_source: 'hotelwebsite_HOTELID',
      });
    });
    it('should allow override through extraParams', () => {
      const d = new Decorator(namespace);
      const oibj = {};
      d.decorateObject(oibj, {sourceid: 'thaSOURCE'});
      expect(oibj).to.deep.eq({
        merchantid: 'MS-HOTELID',
        sourceid: 'thaSOURCE',
        utm_campaign: 'hotel_website_search',
        utm_medium: 'accor_regional_websites',
        utm_source: 'hotelwebsite_HOTELID',
      });

    });
    it('should add elements from extraParams', () => {
      const d = new Decorator(namespace);
      const oibj = {};
      d.decorateObject(oibj, {sourceid: 'thaSOURCE', fbtrack: 'code'});
      expect(oibj).to.deep.eq({
        merchantid: 'MS-HOTELID',
        sourceid: 'thaSOURCE',
        utm_campaign: 'hotel_website_search',
        utm_medium: 'accor_regional_websites',
        utm_source: 'hotelwebsite_HOTELID',
        fbtrack: 'code'
      });
    });
  });
  describe('decorateAll', () => {
    it('should decorate all links matching the regexps', () => {
      const links = [
        'https://all.accor.com/test1',
        'https://all.accor.COM/test1',
        'http://all.accor.COM/test1',
        'http://untouched.com/',
        'http://untouched.com/all.accor.com/a',
        'http://untouched3.com/accorhotels.com/a',
        'https://accorhotels.com/test1',
        'https://accorhotels.COM/test1',
        'http://accorhotels.COM/test1',
        'http://accorhotels.COM/test1?with=some&param=set#hash',

      ];
      const linksStubs = links.map((l) => ({
        getAttribute: sinon.stub().returns(l),
        setAttribute: sinon.stub()
      }));
      nsSource._AccorTrackingDecorator.config.hotelID = 'HOTELID';

      global.document.getElementsByTagName = sinon.stub().returns(linksStubs);
      sandbox.stub(utils, 'parseUrlParts').callsFake((link: string) => url.parse(link));
      const d = new Decorator(namespace);
      d.decorateAll();
      for (const l of linksStubs) {
        expect(l.getAttribute.called).true;
      }

      // Check decorated links
      for (const l of [0, 1, 2, 6,7,8]) {
        const linkStub = linksStubs[l];
        const link = links[l];
        expect(linkStub.setAttribute.called).true;
        expect(linkStub.setAttribute.firstCall.args[0]).eq('href');
        expect(linkStub.setAttribute.firstCall.args[1]).deep.eq(
          link.toLowerCase() + '?utm_source=hotelwebsite_HOTELID&utm_campaign=hotel_website_search&utm_medium=accor_regional_websites&merchantid=MS-HOTELID&sourceid=Direct_Access'
        );
      }
      expect(linksStubs[9].setAttribute.firstCall.args[1]).deep.eq(
        'http://accorhotels.com/test1?with=some&param=set&utm_source=hotelwebsite_HOTELID&utm_campaign=hotel_website_search&utm_medium=accor_regional_websites&merchantid=MS-HOTELID&sourceid=Direct_Access#hash'
      );

      // Check non decorated links
      for (const l of [3,4,5]) {
        const linkStub = linksStubs[l];
        expect(linkStub.setAttribute.called).false;
      }


    });
  });

  // TODO
  describe('autoDecorate', () => {});

  describe('decorateURL', () => {
    //implicitly tested with decorateAll
  });
});
