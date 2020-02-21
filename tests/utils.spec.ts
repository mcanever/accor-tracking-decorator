import {utils} from "../src/utils";
import { expect } from 'chai';

describe('Utils', () => {
    describe('getUrlVars', () => {
       it('should handle hash', () => {
           let  b = utils.getUrlVars('http://a.com/?a=b&c=d#hash');;
           expect(b).deep.eq({a: 'b', c:'d'});
           b = utils.getUrlVars('http://a.com/?a=b#hash&c=d#hash');
           expect(b).deep.eq({a: 'b'});
       })
    });
    describe('normalizeString', () => {
        it('should normalize strings', () => {
            expect(utils.normalizeString('ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž')).to.be.eq('AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz');
            expect(utils.normalizeString('à è ì ò ù Yp§sil^on')).to.be.eq('a-e-i-o-u-Ypsilon');
        } );

        it('should reduce string length', () => {
            var longString = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                            + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                            + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                            + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                            + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

            expect(longString.length).to.be.gt(120);
            expect(utils.normalizeString(longString).length).to.be.eq(120);
        } );
    });
});
