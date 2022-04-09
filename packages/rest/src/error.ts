import { JsonResponse, RestBase, RestMethod, RestPath } from "./rest";

// ============================================================================
// Types
// ============================================================================
export type TimeoutError = {
    type: "Timeout",
    error: Error,
};

type NetworkError = {
    type: "NetworkError",
    error: Error,
};

type BadPayloadError<
    TRest extends RestBase,
    TPath extends RestPath<TRest>,
    TMethod extends RestMethod<TRest>,
    > = {
        type: "BadPayload",
        error: Error,
        response: JsonResponse<TRest, TPath, TMethod>,
    };

type BadStatusError<
    TRest extends RestBase,
    TPath extends RestPath<TRest>,
    TMethod extends RestMethod<TRest>,
    > = {
        type: "BadStatus",
        error: Error,
        response: JsonResponse<TRest, TPath, TMethod>,
    };

// ? Why no @morphic-ts/adt
// * @morphic-ts/adt does not work for generic Union Types
export type HttpError<
    TRest extends RestBase,
    TRoute extends RestPath<TRest> = RestPath<TRest>,
    TMethod extends RestMethod<TRest> = RestMethod<TRest>,
    > =
    | TimeoutError
    | NetworkError
    | BadStatusError<TRest, TRoute, TMethod>
    | BadPayloadError<TRest, TRoute, TMethod>
    ;

// ============================================================================
// Wrapper
// ============================================================================

// FIXME find name for wrapper and creator
export const wrapToNetworkError = (error: Error) => ({
    type: "NetworkError" as const,
    error,
} as const);

export const wrapToBadPayloadError = <
    TRest extends RestBase,
    TPath extends RestPath<TRest>,
    TMethod extends RestMethod<TRest>,
    >(
        response: JsonResponse<TRest, TPath, TMethod>
    ) => (
        error: Error
    ): BadPayloadError<TRest, TPath, TMethod> => ({
        type: "BadPayload",
        error,
        response,
    });

export const wrapToBadStatus = <
    TRest extends RestBase,
    TPath extends RestPath<TRest>,
    TMethod extends RestMethod<TRest>
>(
    response: JsonResponse<TRest, TPath, TMethod>
): BadStatusError<TRest, TPath, TMethod> => ({
    type: "BadStatus",
    error: new Error(
        `Bad Status Code ${response.status} \
        (${response.statusText}) received, when accessing ${response.url}.`
    ),
    response,
});

export const wraptToTimeoutError = (ms: number) => ({
    type: "Timeout",
    error: new Error(`TimedOut after ${ms}ms.`)
} as const);
