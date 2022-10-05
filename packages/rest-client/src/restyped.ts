/* eslint-disable @typescript-eslint/no-explicit-any */
// code from https://github.com/rawrmaan/restyped/blob/master/spec/index.d.ts

export interface RestypedBase {
    [route: string]: any;
}

export interface RestypedRoute {
    params: any;
    query: any;
    body: any;
    response: any;
    // TODO response codes
}

export interface RestypedIndexedBase {
    [route: string]: { [method: string]: RestypedRoute; };
}
