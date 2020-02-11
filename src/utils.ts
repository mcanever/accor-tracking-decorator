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
    Cookies: Cookies
};