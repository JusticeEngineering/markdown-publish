/* eslint-disable */
// https://github.com/eslint/eslint/discussions/15305

import svg from 'esbuild-plugin-svg';
import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: [
      "./index.js",
    ],
    bundle: true,
    minify: true,
    sourcemap: process.env.NODE_ENV !== "production",
    target: ["chrome100"],
    outfile: "bundle.js",
    plugins: [svg()],
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
    },
  })
  .catch(() => process.exit(1));
