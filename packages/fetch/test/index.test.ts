const tests = [
    import("./fetch.test"),
    import("./timeout.test"),
];

Promise.all(tests);
