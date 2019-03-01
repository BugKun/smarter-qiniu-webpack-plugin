import createBrowserHistory from 'history/createBrowserHistory';
import qs from 'query-string';

function init(h) {
    const { pathname, search, hash } = h.location,
        query = qs.parse(search, {ignoreQueryPrefix: true}),
        hashQuery = qs.parse(hash, {ignoreQueryPrefix: true});

    h.location = {...h.location, query, hashQuery};

    h.$push = (path, params, reset = false) => {
        let _o = {};
        path = path || pathname;
        if(reset){
            _o = params;
        }else if (params) {
            Object.assign(_o, query, params);
        }
        h.push(`${ path }?${ qs.stringify(_o) }`);
    };

    h.$reload = () => {
        h.replace(pathname + search + hash);
    };
}

const history = createBrowserHistory();

history.listen(() => {
    init(history);
});

init(history);

export default history;
