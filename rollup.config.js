// @ts-check

import { defineConfig } from "rollup";
import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";

export default defineConfig({
  input: "./src/index.ts",
  output: [
    {
      format: "cjs",
      sourcemap: "inline",
      file: "lib/index.js",
    },
    {
      format: "es",
      sourcemap: "inline",
      file: "lib/index.es.js",
    },
    {
      format: "iife",
      name: "Pushio",
      file: "lib/index.umd.js",
      globals: {
        xstate: "xstate",
        "xstate/lib/actions": "xstate",
      },
    },
  ],
  plugins: [
    nodeResolve(),
    typescript({ useTsconfigDeclarationDir: true }),
    babel({ babelHelpers: "bundled" }),
    terser()
  ],
  external: ["xstate", "xstate/lib/actions"],
});
