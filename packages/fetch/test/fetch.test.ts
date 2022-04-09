import "cross-fetch/polyfill";

import { describe } from "riteway";
import { funFetch } from "../src/index";

describe("fetch", async assert => {
    assert({
        given: "type of funFetch",
        should: "be a function",
        actual: typeof funFetch,
        expected: "function"
    });
});
