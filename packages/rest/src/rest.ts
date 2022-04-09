import * as E from "fp-ts/Either";
import * as M from "fp-ts/Monoid";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

import { Except, Simplify, ValueOf } from "type-fest";
import { TimeoutError, wraptToTimeoutError } from "./error";

import { pipe } from "fp-ts/function";

// ============================================================================
// Base
// ============================================================================
export type HttpMethod =
    | "CONNECT"
    | "DELETE"
    | "GET"
    | "HEAD"
    | "OPTIONS"
    | "PATCH"
    | "POST"
    | "PUT"
    ;

export interface RestBase {
    // FIXME unknown creates issue in JsonResponse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [path: string]: any;
}

// ============================================================================
// Params
// ============================================================================

// TODO ...
// type RouteParams<Route extends string> =
//     // infer :value/key/:value like 1234/properties/5678
//     Route extends `:${infer Name}/${infer Value}` ?
//     Name | RouteParams<Value> :
//     // infer end params :value like 1234
//     Route extends `:${infer Name}` ?
//     // infer param with value /users/:userId like /users/1234
//     // eslint-disable-next-line no-unused-vars
//     Name : Route extends `${infer _Prefix}:${infer Value}` ?
//     RouteParams<`:${Value}`> :
//     never;

// type RouteArgs<Route extends string> = {
//     // eslint-disable-next-line no-unused-vars
//     [Key in RouteParams<Route>]: string
// };

// type _testParams = RouteParams<"/users/:userId/posts/:postId">;
// type _testArgs = RouteArgs<"/users/:userId/posts/:postId">;

// FIXME: different params each http method because body is not possible for GET
// the message-body SHOULD be ignored when handling the request
// see the specs
// HTTP: https://www.rfc-editor.org/rfc/rfc7231#page-24
export interface RestParams {
    params: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any;
    body: unknown;
    response: unknown;
}

export type RestPath<Path extends RestBase> = Extract<keyof Path, string>;
export type RestMethod<Rest extends RestBase> = ValueOf<{
    [TPath in RestPath<Rest>]: Extract<keyof Rest[TPath], HttpMethod>;
}>;

export type RestPathWMethod<Rest extends RestBase, TMethods extends HttpMethod> = {
    [Path in keyof Rest]: Rest[Path] extends Record<TMethods, {}> ?
    Path :
    never;
}[RestPath<Rest>];

export type TypedRequest<
    Rest extends RestBase,
    TPath extends RestPath<Rest> = RestPath<Rest>,
    TMethod extends RestMethod<Rest> = RestMethod<Rest>,
    TParams extends RestParams = Rest[TPath][TMethod],
    > =
    & { url: string; }
    &
    (unknown extends TParams["body"] ?
        {} :
        { body: TParams["body"]; }
    )
    & RequestDependencies
    ;

export type QueryParams<T> = {
    url: string;
    query: Record<string, T>;
};

// ============================================================================
// Response
// ============================================================================

type TaskKReturn<T> =
    // eslint-disable-next-line no-unused-vars
    T extends (...args: unknown[]) => T.Task<infer TResp> ?
    TResp :
    never;

type TaskEitherKReturn<T> =
    // eslint-disable-next-line no-unused-vars
    T extends (...args: unknown[]) =>
        TE.TaskEither<infer TErr, infer TResp> ?
    [TErr, TResp] :
    never;

export type RestResponse<TRestFun> = TaskKReturn<TRestFun>;
export type RestResponseSuccess<TRestFun> = TaskEitherKReturn<TRestFun>[1];
export type RestResponseError<TRestFun> = TaskEitherKReturn<TRestFun>[0];

const race = <T>() => M.concatAll(T.getRaceMonoid<T>());
const timeout = (ms: number) => pipe(
    T.of(wraptToTimeoutError(ms)),
    T.delay(ms),
    TE.leftTask,
);

export const withTimeout = (ms: number) =>
    <L extends { type: string; }, R>(
        te: TE.TaskEither<L, R>
    ) => race<E.Either<L | TimeoutError, R>>()([
        te,
        timeout(ms)
    ]);

export interface JsonResponse<
    TRest extends RestBase,
    TPath extends RestPath<TRest>,
    TMethod extends RestMethod<TRest>,
    TParams extends RestParams = TRest[TPath][TMethod],
    > extends Response {
    json(): Promise<TParams["response"]>;
}

export type RequestDependencies = Simplify<
    & Except<RequestInit, "body" | "method" | "headers">
    & { headers?: Record<string, unknown>; }
>;
