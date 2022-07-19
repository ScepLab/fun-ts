import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

import { FunctionN, flow, pipe } from "fp-ts/function";
import { Decoder as IoTsDecoder, Errors as IoTsErrors } from "io-ts";

import { failure as reportIoTsFailure } from "io-ts/PathReporter";

// ! Why explicit return types everywhere
// Inferred return types become explicit for generated type definitions.
// These are based on the current typescript version.
// So `fetch` parameters in the return type are not pulled from BuiltinFetch at
// the time they are used, but at the time of compiling this package.
// Now if typescript types change for parameters of fetch, we have
// incompatibilities only because of typescript version. This happened for
// `fetch` when moving from typescript version 4.6 to 4.7.

// ============================================================================
// Fetch Types
// ============================================================================
type BuiltinFetch = typeof fetch;

type FetchError = { readonly type: string; };

type TaskifiedFetchError = ReturnType<typeof networkError | typeof abortError>;

type TaskifiedFetch<L extends FetchError> = FunctionN<
    Parameters<BuiltinFetch>,
    TE.TaskEither<L, Response>
>;

// ============================================================================
// Fetch
// ============================================================================
const networkError = (error: Error) => ({
    type: "NetworkError" as const,
    error
});

const abortError = (error: Error) => ({
    type: "AbortError" as const,
    error
});

export const taskifyFetch = (
    fetchP: BuiltinFetch
): TaskifiedFetch<TaskifiedFetchError> => TE.tryCatchK(
    fetchP,
    flow(
        E.toError,
        e => e.name === "AbortError" ? abortError(e) : networkError(e)
    )
);

export const funFetch = taskifyFetch(fetch);

// ============================================================================
// Bad status combinator
// ============================================================================
const badStatusError = (
    response: Response
) => ({
    type: "BadStatus" as const,
    error: new Error(
        `Received Bad Status Code ${response.status} (${response.statusText}) when accessing ${response.url}.`
    ),
    response,
});

type BadStatusError = ReturnType<typeof badStatusError>;

export const withBadStatus = <L extends FetchError>(
    funFetch: TaskifiedFetch<L>
): TaskifiedFetch<L | BadStatusError> => flow(
    funFetch,
    TE.chainW(
        TE.fromPredicate(
            resp => resp.ok,
            badStatusError
        )
    )
);

// ============================================================================
// default options combinator
// TODO: Deep merge
// ============================================================================
export const withDefaults = (defaults: RequestInit) => <L extends FetchError>(
    funFetch: TaskifiedFetch<L>
): TaskifiedFetch<L> => (input, init = {}) => funFetch(
    input,
    { ...defaults, ...init }
);

// ============================================================================
// Parsing responses
// ============================================================================
const badPayloadError = (
    response: Response
) => (
    error: Error
) => ({
    type: "BadPayload" as const,
    response,
    error
});

type BadPayloadError = ReturnType<ReturnType<typeof badPayloadError>>;

const toBadPayloadError = flow(
    badPayloadError,
    ctor => flow(E.toError, ctor)
);

export const asJson = (r: Response) => TE.tryCatch(
    () => r.json() as Promise<unknown>,
    toBadPayloadError(r)
);

export const asJsonTE = TE.chainW(asJson);

export const asText = (r: Response) => TE.tryCatch(
    () => r.text(),
    toBadPayloadError(r)
);

export const asTextTE = TE.chainW(asText);

export const asBlob = (r: Response) => TE.tryCatch(
    () => r.blob(),
    toBadPayloadError(r)
);

export const asBlobTE = TE.chainW(asBlob);

export const asFormData = (r: Response) => TE.tryCatch(
    () => r.formData(),
    toBadPayloadError(r)
);

export const asFormDataTE = TE.chainW(asFormData);

export const asArrayBuffer = (r: Response) => TE.tryCatch(
    () => r.arrayBuffer(),
    toBadPayloadError(r)
);

export const asArrayBufferTE = TE.chainW(asArrayBuffer);

// ============================================================================
// io-ts
// ============================================================================
const decodeError = (
    errors: IoTsErrors
) => ({
    type: "DecodeError" as const,
    error: reportIoTsFailure(errors),
    errors
});

export const asDecoded = <A>(dec: IoTsDecoder<unknown, A>) => flow(
    dec.decode,
    E.mapLeft(decodeError)
);

export const asDecodedTE = <A>(dec: IoTsDecoder<unknown, A>) => pipe(
    asDecoded(dec),
    TE.chainEitherKW
);

// ============================================================================
// Json combinator - kind of
// ============================================================================
type TaskifiedFetchReturningUnknown<L extends FetchError> = FunctionN<
    Parameters<BuiltinFetch>,
    TE.TaskEither<L, unknown>
>;

export const withJson = <L extends FetchError>(
    funFetch: TaskifiedFetch<L>
): TaskifiedFetchReturningUnknown<L | BadPayloadError> => flow(
    pipe(
        funFetch,
        withDefaults({ headers: { "Content-Type": "application/json" } })
    ),
    asJsonTE
);

// ============================================================================
// Timeout combinator
// ============================================================================
const timeoutError = (ms: number) => ({
    type: "Timeout" as const,
    error: new Error(`Timed out after ${ms}ms.`)
});

type TimeoutError = ReturnType<typeof timeoutError>;

const raceTE = <L, R>(
    te: TE.TaskEither<L, R>
) => <L2, R2>(
    te2: TE.TaskEither<L2, R2>
) => T.getRaceMonoid<E.Either<L | L2, R | R2>>().concat(
    te,
    te2
);

/**
 * @private
 */
export const anySignal = (signals: AbortSignal[]) => {
    const controller = new AbortController();

    const onAbort = () => {
        controller.abort();
        // Cleanup
        pipe(
            signals,
            A.map(s => s.removeEventListener("abort", onAbort))
        );
    };

    return pipe(
        signals,
        // check if one of the signals is aborted
        O.fromPredicate(A.every(s => !s.aborted)),
        O.fold(
            // if so, we abort too
            () => controller.abort(),
            // if all of the signals are not aborted, we listen for aborts
            A.map(s => s.addEventListener("abort", onAbort)),
        ),
        // return parent controller
        () => controller.signal,
    );
};

const startTimeout = (ms: number) => {
    const ctrl = new AbortController();
    let timeoutId: Parameters<typeof clearTimeout>[0];

    const abortTask = TE.tryCatch(
        () => new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
                () => {
                    reject();
                    return ctrl.abort();
                },
                ms
            );
        }),
        () => timeoutError(ms)
    );

    return {
        timeoutSignal: ctrl.signal,
        clearTimer: () => clearTimeout(timeoutId),
        abortTask
    };
};

export const withTimeout = (
    ms: number
) => <L extends FetchError>(
    funFetch: TaskifiedFetch<L>
): TaskifiedFetch<L | TimeoutError> => (
    input,
    init = {}
) => pipe(
    startTimeout(ms),
    ({ timeoutSignal, clearTimer, abortTask }) => pipe(
        funFetch(
            input,
            {
                ...init,
                // eslint-disable-next-line eqeqeq
                signal: init.signal == undefined ?
                    timeoutSignal :
                    anySignal([timeoutSignal, init.signal])
            }
        ),
        raceTE(abortTask),
        TE.bimap(
            e => { e.type !== "Timeout" && clearTimer(); return e; },
            r => { clearTimer(); return r; }
        )
    )
);
