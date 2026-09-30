import { expect } from 'chai';
import * as sinon from 'sinon';
import { GA4CrossDomain } from '../src/ga4';
import { Decorator } from '../src/decorator';
import { Namespace } from '../src/namespace';
//@ts-ignore
import { JSDOM } from 'jsdom';

declare var global: any;

const GA_COOKIE = '111.222';
const GA4_COOKIE = 's1690968794$o3$g1$t1690968795$j59$l0$h0';
// Same encoding as gtag.js: base64 with the url-safe alphabet and "." as padding
const GA_COOKIE_ENCODED = 'MTExLjIyMg..';
const GA4_COOKIE_ENCODED = 'czE2OTA5Njg3OTQkbzMkZzEkdDE2OTA5Njg3OTUkajU5JGwwJGgw';

describe('GA4CrossDomain', () => {
  const sandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;
  let source: any;
  const saved: any = {};
  // A timestamp at the exact start of a minute: advancing the clock by more than 60s changes the minute in the hash
  const T0 = 1800000000000 - (1800000000000 % 60000);

  const setCookies = () => {
    document.cookie = '_ga=GA1.1.' + GA_COOKIE;
    document.cookie = '_ga_ABC123=GS2.1.' + GA4_COOKIE;
  };

  beforeEach(() => {
    const dom = new JSDOM('<html><body></body></html>', { url: 'https://hotel.example.com/' });
    ['window', 'document', 'navigator', 'Event'].forEach((k) => {
      saved[k] = Object.getOwnPropertyDescriptor(global, k);
      Object.defineProperty(global, k, { value: dom.window[k === 'window' ? 'self' : k], configurable: true, writable: true });
    });
    source = {};
    clock = sandbox.useFakeTimers(T0);
  });

  afterEach(() => {
    sandbox.restore();
    Object.keys(saved).forEach((k) => {
      if (saved[k]) {
        Object.defineProperty(global, k, saved[k]);
      } else {
        delete global[k];
      }
    });
  });

  describe('getCookieVersionAndClientID', () => {
    it('parses GA1, GS1 and GS2 cookie formats', () => {
      const ga4 = new GA4CrossDomain();
      expect(ga4.getCookieVersionAndClientID('_ga', 'GA1.1.111.222')).deep.eq({ version: 3, clientID: '111.222' });
      expect(ga4.getCookieVersionAndClientID('_ga_X', 'GS1.1.1690968794.3.1.1690968795.59.0.0'))
        .deep.eq({ version: 4, clientID: '1690968794.3.1.1690968795.59.0.0' });
      expect(ga4.getCookieVersionAndClientID('_ga_X', 'GS2.1.' + GA4_COOKIE)).deep.eq({ version: 4, clientID: GA4_COOKIE });
      expect(ga4.getCookieVersionAndClientID('_ga_X', 'garbage').version).eq(-1);
    });
  });

  describe('getGA4DecoratorParam', () => {
    it('returns false when there is no GA4 cookie', () => {
      document.cookie = '_ga=GA1.1.' + GA_COOKIE;
      const ga4 = new GA4CrossDomain();
      expect(ga4.getGA4DecoratorParam(false, source)).eq(false);
      expect(ga4.generatedAt).eq(0);
    });

    it('does not crash when document has no cookie property', () => {
      global.document = {};
      const ga4 = new GA4CrossDomain();
      expect(ga4.getGA4DecoratorParam(false, source)).eq(false);
    });

    it('generates a _gl in the gtag.js linker format, with _ga first', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      const _gl = ga4.getGA4DecoratorParam(false, source) as string;
      const parts = _gl.split('*');
      expect(parts[0]).eq('1');
      expect(parts[1]).match(/^[0-9a-z]+$/);
      expect(parts.slice(2)).deep.eq(['_ga', GA_COOKIE_ENCODED, '_ga_ABC123', GA4_COOKIE_ENCODED]);
      expect(ga4.generatedAt).eq(T0);
      expect(source._GA4CrossDomainParam).eq(_gl);
    });

    it('only regenerates when more cookies show up', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      const first = ga4.getGA4DecoratorParam(false, source);
      clock.tick(120000);
      expect(ga4.getGA4DecoratorParam(false, source)).eq(first);
      document.cookie = '_ga_DEF456=GS2.1.s1$o1$g1$t2$j0$l0$h0';
      const second = ga4.getGA4DecoratorParam(false, source) as string;
      expect(second).not.eq(first);
      expect(second.split('*')).include('_ga_DEF456');
    });
  });

  describe('refresh of an old _gl', () => {
    it('keeps the same value while it is not older than maxAge', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      const first = ga4.getFreshGl(source);
      clock.tick(ga4.maxAge);
      expect(ga4.isGlStale()).eq(false);
      expect(ga4.getFreshGl(source)).eq(first);
      expect(ga4.generatedAt).eq(T0);
    });

    it('regenerates the hash once the value is older than maxAge', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      const first = ga4.getFreshGl(source) as string;
      clock.tick(ga4.maxAge + 1);
      expect(ga4.isGlStale()).eq(true);
      const second = ga4.getFreshGl(source) as string;
      expect(second).not.eq(first);
      // Only the hash changes, the encoded cookies are the same
      expect(second.split('*').slice(2)).deep.eq(first.split('*').slice(2));
      expect(second.split('*')[1]).not.eq(first.split('*')[1]);
      expect(ga4.generatedAt).eq(T0 + ga4.maxAge + 1);
      expect(ga4._gl).eq(second);
      expect(source._GA4CrossDomainParam).eq(second);
    });

    it('honours a custom maxAge', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      ga4.maxAge = 5000;
      ga4.getFreshGl(source);
      clock.tick(5000);
      ga4.getFreshGl(source);
      expect(ga4.generatedAt).eq(T0);
      clock.tick(1);
      ga4.getFreshGl(source);
      expect(ga4.generatedAt).eq(T0 + 5001);
    });

    it('dispatches the update event when the refreshed value differs', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      ga4.getGA4DecoratorParam(false, source);
      const spy = sinon.spy();
      document.addEventListener('accor_ga4_param_updated', spy);
      clock.tick(61000);
      const fresh = ga4.getFreshGl(source);
      expect(spy.calledOnce).eq(true);
      expect(spy.firstCall.args[0].detail).eq(fresh);
    });

    it('keeps the previous value if the GA4 cookies disappeared', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      const first = ga4.getFreshGl(source);
      document.cookie = '_ga_ABC123=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      clock.tick(61000);
      expect(ga4.getFreshGl(source)).eq(first);
    });

    it('tries to generate the value when nothing was found before', () => {
      const ga4 = new GA4CrossDomain();
      expect(ga4.getFreshGl(source)).eq(false);
      setCookies();
      expect(ga4.getFreshGl(source)).match(/^1\*/);
    });
  });

  describe('decoration', () => {
    it('decorateObject and decorateURL use a fresh _gl', () => {
      setCookies();
      const ga4 = new GA4CrossDomain();
      const first = ga4.getGA4DecoratorParam(false, source) as string;
      clock.tick(61000);
      const obj: any = ga4.decorateObject({ foo: 'bar' });
      expect(obj.foo).eq('bar');
      expect(obj._gl).not.eq(first);
      expect(obj._gl).eq(ga4._gl);
      const url = ga4.decorateURL('https://all.accor.com/hotel/1234/index.en.shtml?x=1');
      expect(url).include('x=1');
      expect(url).include('_gl=' + encodeURIComponent(ga4._gl as string));
    });

    it('Decorator.decorateObject regenerates a stale _gl', () => {
      setCookies();
      const nsSource: any = {
        _AccorTrackingDecorator: { config: { handleGoogleAnalytics: true, hotelID: 'MEOW', ga4LinkerMaxAge: 10000 } }
      };
      const d = new Decorator(new Namespace(nsSource));
      expect(d.config.ga4LinkerMaxAge).eq(10000);
      const first = (d.decorateObject({}) as any)._gl;
      expect(first).match(/^1\*/);
      clock.tick(10000);
      expect((d.decorateObject({}) as any)._gl).eq(first);
      clock.tick(60000);
      const second = (d.decorateObject({}) as any)._gl;
      expect(second).match(/^1\*/);
      expect(second).not.eq(first);
      expect(d.trackingParams._gl).eq(second);
    });
  });

  describe('autoDecorate refresh', () => {
    const LINK = 'https://all.accor.com/hotel/1234/index.en.shtml';
    const makeDecorator = (extraConfig: any = {}) => {
      setCookies();
      document.body.innerHTML =
        '<a id="l" href="' + LINK + '"><span id="s">x</span></a>' +
        '<a id="same" href="https://hotel.example.com/x">y</a>';
      // Prevent jsdom from trying to navigate when the link is clicked
      document.addEventListener('click', (e) => e.preventDefault());
      const nsSource: any = {
        _AccorTrackingDecorator: { config: { handleGoogleAnalytics: true, hotelID: 'MEOW', autoDecorate: true, ...extraConfig } }
      };
      const d = new Decorator(new Namespace(nsSource));
      d.autoDecorate();
      d.decorateAll();
      return d;
    };
    const click = (id: string, type = 'click') => {
      document.getElementById(id).dispatchEvent(new (window as any).MouseEvent(type, { bubbles: true, cancelable: true }));
    };

    it('re-decorates the clicked link when _gl is stale, even when clicking a child element', () => {
      const d = makeDecorator();
      const a = document.getElementById('l');
      const before = a.getAttribute('href');
      expect(before).include('_gl=');
      clock.tick(61000);
      click('s');
      const after = a.getAttribute('href');
      expect(after).not.eq(before);
      expect(after).include('_gl=' + encodeURIComponent(d.trackingParams._gl as string));
      expect(document.getElementById('same').getAttribute('href')).eq('https://hotel.example.com/x');
    });

    it('re-decorates on middle click too', () => {
      const d = makeDecorator();
      const a = document.getElementById('l');
      const before = a.getAttribute('href');
      clock.tick(61000);
      click('l', 'auxclick');
      expect(a.getAttribute('href')).not.eq(before);
      expect(a.getAttribute('href')).include('_gl=' + encodeURIComponent(d.trackingParams._gl as string));
    });

    it('does not touch links of other domains on click', () => {
      makeDecorator();
      clock.tick(61000);
      click('same');
      expect(document.getElementById('same').getAttribute('href')).eq('https://hotel.example.com/x');
    });

    it('does not run a timer unless ga4RefreshInterval is set', () => {
      const d = makeDecorator();
      expect(d.config.ga4RefreshInterval).eq(0);
      const a = document.getElementById('l');
      const before = a.getAttribute('href');
      clock.tick(10 * 60000);
      expect(a.getAttribute('href')).eq(before);
    });

    it('refreshes all links on the timer once _gl is stale', () => {
      const d = makeDecorator({ ga4RefreshInterval: 30000 });
      expect(d.config.ga4RefreshInterval).eq(30000);
      const a = document.getElementById('l');
      const before = a.getAttribute('href');
      clock.tick(60000);
      // 60s old: not stale yet
      expect(a.getAttribute('href')).eq(before);
      clock.tick(30000);
      const after = a.getAttribute('href');
      expect(after).not.eq(before);
      expect(after).include('_gl=' + encodeURIComponent(d.trackingParams._gl as string));
    });
  });
});
