// TypeScript Version: 2.2

/**
 * UMD export
 */
export as namespace WPAPI;
export = WPAPI;

declare class WPAPI {
    constructor(options: any);
    auth(credentials: any): any;
    bootstrap(routes: any): any;
    namespace(namespace: any): any;
    registerRoute(namespace: any, restBase: any, options: any): any;
    root(relativePath: any): any;
    setHeaders(headers: any, value: any): any;
    transport(transport: any): any;
    url(url: any): any;
    static discover(url: any): any;
    static site(endpoint: any, routes: any): any;
}

declare namespace WPAPI {
    namespace transport {
        function get(wpreq: any, callback: any): any;
        function head(wpreq: any, callback: any): any;
        function post(wpreq: any, data: any, callback: any): any;
        function put(wpreq: any, data: any, callback: any): any;
    }
}
