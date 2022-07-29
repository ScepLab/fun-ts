import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

const shared = {
    entryPoints: ["./src/index.ts"],
    bundle: true,
    sourcemap: true,
    minify: false,
    plugins: [nodeExternalsPlugin()],
    logLevel: "error",
};

// library for node
build({
    ...shared,
    outfile: "./dist/index.cjs",
    target: ["node16.14"],
    format: "cjs",
});

// library for the browser
build({
    ...shared,
    outfile: "./dist/index.js",
    target: ["es2021"],
    format: "esm",
});
