import { Decorator } from './decorator';
import { Namespace } from './namespace';
import { Store } from './store';
import { utils } from './utils';

const namespace = new Namespace();
const decorator = new Decorator(namespace);
// Init namespace handler that will expose our public methods in the window
// window._JoAndJoeTrackingDecorator object

// @ts-ignore
namespace.set('decorateUrl', (...args: any) => decorator.decorateURL(...args));
// @ts-ignore
namespace.set('decorateObject', (...args: any[]) => decorator.decorateObject(...args));
// @ts-ignore
namespace.set('decorateAll', (...args: any[]) => decorator.decorateAll(...args));
// @ts-ignore
namespace.set('getDataLayerVars', (...args: any[]) => decorator.getDataLayerVars(...args));

namespace.set('decorator', decorator);
namespace.set('Store', Store);
namespace.set('utils', utils);

if (decorator.config.autoDecorate) {
  decorator.autoDecorate();
}

