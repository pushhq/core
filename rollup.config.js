// @ts-check

import { defineConfig } from "rollup";
import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
// import commonjs from "@rollup/plugin-commonjs";
// import externals from "rollup-plugin-node-externals";

export default defineConfig({
  input: "./src/index.ts",
  output: [
    {
      format: "cjs",
      file: "lib/index.js",
    },
    {
      format: "es",
      file: "lib/index.es.js",
    },
    {
      format: "umd",
      name: "Pushio",
      file: "lib/index.umd.js",
    },
  ],
  plugins: [nodeResolve(), typescript({useTsconfigDeclarationDir: true}), terser()],
  external: ['xstate', 'xstate/lib/actions'],
});
