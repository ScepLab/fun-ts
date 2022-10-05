import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

import { ADTType, makeADT, ofType } from "@morphic-ts/adt";
import { Except, Simplify, ValueOf } from "type-fest";
import { RestypedBase, RestypedRoute } from "./restyped";
import { flow, pipe } from "fp-ts/function";

import { funFetch } from "@fun-ts/fetch";
import { interpolatePath } from "./path";

type ApiMethods =
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "HEAD"
    | "PATCH"
    | "OPTION"
    ;

type StringsOnly<T> = Extract<T, string>;
type ApiMethodsOnly<T> = Extract<T, ApiMethods>;

type ApiRoute<api extends RestypedBase> = StringsOnly<keyof api>;

type ApiMethod<api extends RestypedBase> = ValueOf<{
    [route in ApiRoute<api>]: ApiMethodsOnly<keyof api[route]>;
}>;

type ApiRouteFromMethod<
    api extends RestypedBase,
    method extends ApiMethods,
> = {
    [path in keyof api]: api[path] extends Record<method, {}> ? path : never;
}[ApiRoute<api>];

// TODO add more than json fun - check fun fetch
export interface TypedRawResponse<
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
    routeDef extends RestypedRoute = api[route][method],
> extends Response {
    json(): Promise<routeDef["response"]>;
}

type ClientRequestInit = Simplify<
    & Except<RequestInit, "body" | "method" | "headers">
    & { headers?: Record<string, string>; }
>;

type TypedRequestInit<
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
    routeDef extends RestypedRoute = api[route][method],
> =
    & ClientRequestInit
    & {
        url: string;
        route: route;
        method: method;
        body: routeDef["body"];
    }
    ;

type TimeoutError = { type: "Timeout"; };
type NetworkError = { type: "Network"; error: Error; };
type BadStatusError<
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
> = {
    type: "BadStatus";
    error: Error;
    response: TypedRawResponse<api, route, method>;
};
type BadPayloadError<
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
> = {
    type: "BadPayload";
    error: Error;
    response: TypedRawResponse<api, route, method>;
};

export const HttpErrorAdt = <
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
>() => makeADT("type")({
    Timeout: ofType<TimeoutError>(),
    Network: ofType<NetworkError>(),
    BadStatus: ofType<BadStatusError<api, route, method>>(),
    BadPayload: ofType<BadPayloadError<api, route, method>>(),
});

export type HttpError = <
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
>() => ADTType<ReturnType<typeof HttpErrorAdt<api, route, method>>>;

// TODO use ffetch?
// const ffetch = pipe(
//     funFetch,
//     withDefaults({ credentials: "include" }),
//     withBadStatus,
//     withTimeout(5_000),
// );

// FIXME use lens
// const mergeRequestHeaders = (defaultRequest: ClientRequestInit) => pipe(
//     L.id<ClientRequestInit>(),
//     L.prop("headers"),
//     L.modify(headers => ({ ...defaultRequest.headers, ...headers })),
// );

// const headers: Lens<ClientRequestInit, ClientRequestInit["headers"]> = {
//     get: req => req.headers ?? {},
//     set: headers => req => ({ ...headers, ...req } as ClientRequestInit)
// };

// const request: Lens<ClientRequestInit, ClientRequestInit> = {
//     get: req => req,
//     set: reqA => reqS => ({ ...reqA, ...reqS })
// };

// const mergeClientRequestInit = pipe(
//     request,
//     L.compose(request),
// );

// const a = mergeClientRequestInit.set({})({});

// const mergeRequestHeaders = pipe(
//     L.id<ClientRequestInit>(),
//     L.prop("headers"),
//     L.compose(headers),
// );

const mergeClientRequestInit = (
    { headers: defaultHeaders, ...defaultInit }: ClientRequestInit
) => (
    { headers, ...init }: ClientRequestInit
): ClientRequestInit => {
        const mergedHeaders =
            defaultHeaders === undefined && headers === undefined ?
                {} :
                { headers: { ...defaultHeaders, ...headers } };

        return {
            ...defaultInit,
            ...init,
            ...mergedHeaders
        };
    };

const interpolateRoute = interpolatePath<
    Record<string, number | string | boolean>
>;

const decodeJSON = <
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>
>(
    response: TypedRawResponse<api, route, method>
) => TE.tryCatch(
    () => response.json(),
    flow(
        error => error as Error,
        error => HttpErrorAdt<api, route, method>().as.BadPayload({
            error, response
        }),
    )
);

type StringifyUrlParams = {
    query: Record<string, string>;
    url: string;
};

const stringifyUrl = ({ url, query }: StringifyUrlParams) => pipe(
    new URLSearchParams(query).toString(),
    qs => qs ? `${url}?${qs}` : url
);

const typedRequest = <
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>
>(
    { baseUrl, method, route }: {
        baseUrl: string,
        method: method,
        route: route,
    },
    config: Except<api[route][method], "response">
) => (
    requestInit: ClientRequestInit = {},
): TypedRequestInit<api, route, method> => {
        // ! `config` is very well typed for the consumer of this function
        // ! but it behaves like `any` inside of this func, which is correct

        // ? why though?
        // * because TApi is generic and at maximum a RestypedBase
        // * RestypedBase is a loose type to make API definitions stricter
        // * it does so by API definitions not needing a catch-all index type
        // * but it is too loose to type config here inside of the function

        // ? what now?
        // * three options:
        // * 1: making RestypedBase stricter breaks the API by making it less strict
        // * 2: handle config with care without compiler support
        // * 3: introduce a tiny runtime overhead by casting it to sth typed
        // * => 3 is implemented

        type WeaklyTypedConfig = Partial<Except<RestypedRoute, "response">>;
        const { params, query, body }: WeaklyTypedConfig = config;

        const url = stringifyUrl({
            url: `${baseUrl}${interpolateRoute(route)(params)}`,
            query
        });

        return {
            ...requestInit,
            url,
            method,
            body,
            route,
        };
    };

// wrap all purpose fetch in a request typed for restyped
const request = <
    api extends RestypedBase,
    route extends ApiRoute<api>,
    method extends ApiMethod<api>,
>(
    { url, ...req }: TypedRequestInit<api, route, method>
) => pipe(
    funFetch(url, req),
    TE.chainW(
        TE.fromPredicate(
            response => response.ok,
            response => HttpErrorAdt<api, route, method>().as.BadStatus({
                error: new Error(
                    `Received Bad Status Code ${response.status} (${response.statusText}) when accessing ${response.url}.`
                ),
                response
            }),
        )
    ),
    TE.bimap(
        error => error,
        resp => resp as TypedRawResponse<api, route, method>
    )
);

export const makeRestApiClient = <
    api extends RestypedBase,
>(
    baseUrl: string,
    defaultRequestInit: ClientRequestInit = {},
) => <method extends ApiMethod<api>>(
    method: method,
) => <route extends ApiRouteFromMethod<api, method>>(
    route: route,
) => (
    config: Except<api[route][method], "response">,
    requestInit: ClientRequestInit = {},
) => pipe(
    requestInit,
    mergeClientRequestInit(defaultRequestInit),
    typedRequest<api, route, method>({ baseUrl, method, route }, config),
    request,
    TE.chainW(decodeJSON),
);

type FunctionReturningTask<t> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t extends (...args: any[]) => T.Task<infer response> ? response : never;

type FunctionReturningTaskEither<t> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t extends (...args: any[]) => TE.TaskEither<infer error, infer response> ?
    [error, response] :
    never;

export type ApiResponse<fun> = FunctionReturningTask<fun>;
export type ApiResponseSuccess<fun> = FunctionReturningTaskEither<fun>[1];
export type ApiResponseError<fun> = FunctionReturningTaskEither<fun>[0];

// TODO check parse url params types
// type ParseUrlParams<url> =
//     url extends `${infer path}(${infer optionalPath})`
//     ? ParseUrlParams<path> & Partial<ParseUrlParams<optionalPath>>
//     : url extends `${infer start}/${infer rest}`
//     ? ParseUrlParams<start> & ParseUrlParams<rest>
//     : url extends `:${infer param}`
//     ? { [k in param]: string }
//     : {};
