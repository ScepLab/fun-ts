import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

import { FunctionN, flow, pipe } from "fp-ts/function";

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

type BuiltinFetch = typeof fetch;

export const taskifyFetch = (fetchP: BuiltinFetch) => TE.tryCatchK(
    fetchP,
    flow(
        E.toError,
        e => e.name === "AbortError" ? abortError(e) : networkError(e)
    )
);

export const funFetch = taskifyFetch(fetch);

type FetchError = { readonly type: string; };

type TaskifiedFetch<L extends FetchError> = FunctionN<
    Parameters<BuiltinFetch>,
    TE.TaskEither<L, Response>
>;

// ============================================================================
// Bad status combinator
// ============================================================================
const badStatus = (
    response: Response
) => ({
    type: "BadStatus" as const,
    error: new Error(
        `Received Bad Status Code ${response.status} (${response.statusText}) when accessing ${response.url}.`
    ),
    response,
});

export const withBadStatus = <L extends FetchError>(
    funFetch: TaskifiedFetch<L>
) => flow(
    funFetch,
    TE.chainW(
        TE.fromPredicate(
            resp => resp.ok,
            badStatus
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

const toBadPayloadError = flow(
    badPayloadError,
    ctor => flow(E.toError, ctor)
);

export const asJson = (r: Response) => TE.tryCatch(
    () => r.json() as Promise<unknown>,
    toBadPayloadError(r)
);

export const asText = (r: Response) => TE.tryCatch(
    () => r.text(),
    toBadPayloadError(r)
);

export const asBlob = (r: Response) => TE.tryCatch(
    () => r.blob(),
    toBadPayloadError(r)
);

export const asFormData = (r: Response) => TE.tryCatch(
    () => r.formData(),
    toBadPayloadError(r)
);

export const asArrayBuffer = (r: Response) => TE.tryCatch(
    () => r.arrayBuffer(),
    toBadPayloadError(r)
);

// ============================================================================
// Json combinator
// ============================================================================
export const withJson = <L extends FetchError>(
    funFetch: TaskifiedFetch<L>
) => flow(
    pipe(
        funFetch,
        withDefaults({ headers: { "Content-Type": "application/json" } })
    ),
    TE.chainW(asJson)
);

// ============================================================================
// Timeout combinator
// ============================================================================
const timeoutError = (ms: number) => ({
    type: "Timeout" as const,
    error: new Error(`Timed out after ${ms}ms.`)
});

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
) => (
    input: RequestInfo | URL,
    init: RequestInit = {}
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
