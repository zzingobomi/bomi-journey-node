import type { Configuration } from "webpack";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Dotenv = require("dotenv-webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

import { rules } from "./webpack.rules";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
  plugins: [new Dotenv()],
};
