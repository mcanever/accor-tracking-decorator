import Cookies from 'js-cookie';

export const utils = {
    getUrlVars: () => {
        let vars: any = {};
        const parts = window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            (substring: string, key: string, value: string) => {
                vars[key] = value;
                return substring;
            });
        return vars;
    },
    Cookies: Cookies,
    normalizeString: (str: string): string => {
        if (typeof str != "string") {
            return undefined;
        }
        if (str.match(/^[a-zA-Z0-9-._$@'"()\[\]]{1,120}$/)) {
            return str;
        }

        // Fix accented chars
        const accents =     'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
        const accentsOut =  'AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz';
        let map: any = {};
        for  (let i = 0; i< accents.length; i++) {
            map[accents.charAt(i)] = accentsOut.charAt(i);
        }
        str = str.replace(new RegExp('[' + accents + ']', 'g'), (c) => {
            return (typeof map[c] !== 'undefined' ? map[c] : c);
        });

        // Remove all unsupported characters
        str = str.replace(/[^a-zA-Z0-9-._$@'"()\[\] ]/g, '');

        // Replace space sequences with a dash
        str = str.replace(/\s+/g, '-');

        // Limit maximum length to 120 characters
        str = str.slice(0,120);

        return str;
    }
};