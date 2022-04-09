import "cross-fetch/polyfill";

import { anySignal, funFetch, withTimeout } from "../src/fetch";
import { isLeft, isRight } from "fp-ts/Either";

import { describe } from "riteway";
import { pipe } from "fp-ts/function";

describe("multiplexed signals", async assert => {
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const ac3 = new AbortController();

    const multiplexed = anySignal([
        ac1.signal,
        ac2.signal,
        ac3.signal,
    ]);

    assert({
        given: "a multiplexed signal",
        should: "not abort when none of the child signals abort",
        actual: multiplexed.aborted,
        expected: false
    });

    ac2.abort();

    assert({
        given: "a multiplexed signal",
        should: "abort when one of the child signals aborts",
        actual: multiplexed.aborted,
        expected: true
    });

    const initiallyAbortedController = new AbortController();
    initiallyAbortedController.abort();

    assert({
        given: "a multiplexed signal",
        should: "abort when a signal is aborted initially",
        actual: anySignal([ac1.signal, initiallyAbortedController.signal]).aborted,
        expected: true
    });
});

describe("small timeout", async assert => {
    const fetchWithTinyTimeout = pipe(
        funFetch,
        withTimeout(1)
    );

    return fetchWithTinyTimeout("https://jsonplaceholder.typicode.com/posts")()
        .then(r => {
            assert({
                given: "a request with timeout of 1ms",
                should: "always error",
                actual: isLeft(r),
                expected: true
            });

            assert({
                given: "a request with timeout of 1ms",
                should: "always time out",
                actual: isLeft(r) && r.left.type,
                expected: "Timeout"
            });
        });
});

describe("big timeout", async assert => {
    const fetchWithBigTimeout = pipe(
        funFetch,
        withTimeout(60 * 1000)
    );

    return fetchWithBigTimeout("https://jsonplaceholder.typicode.com/posts")()
        .then(r => {
            assert({
                given: "a request with a very long timeout of 60s",
                should: "usually work",
                actual: isRight(r),
                expected: true
            });
        });
});

describe("abort controller and timeout", async assert => {
    const fetchWithBigTimeout = pipe(
        funFetch,
        withTimeout(60 * 1000)
    );

    const abortCtrl = new AbortController();
    setTimeout(() => abortCtrl.abort(), 5);

    return fetchWithBigTimeout("https://jsonplaceholder.typicode.com/posts", { signal: abortCtrl.signal })()
        .then(r => {
            assert({
                given: "a request with a timeout and later on an abort",
                should: "throw an abort error",
                actual: isLeft(r) && r.left.type,
                expected: "AbortError"
            });
        });
});
